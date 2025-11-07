-- SympoHub Database Schema

-- 1. Enums
CREATE TYPE public.user_role AS ENUM ('MASTER', 'AGENCY');
CREATE TYPE public.project_status AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED');

-- 2. Agencies Table
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 3. User Profiles Table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization TEXT,
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. User Roles Table (Security Critical)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status project_status DEFAULT 'SCHEDULED' NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Participants Table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 7. Security Definer Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.user_profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'MASTER')
$$;

-- 8. Trigger for creating agency and profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Check if this is a MASTER user (no agency needed)
  IF (NEW.raw_user_meta_data->>'role')::text = 'MASTER' THEN
    -- Create profile without agency
    INSERT INTO public.user_profiles (
      id, full_name, username, organization, position, phone
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'organization',
      NEW.raw_user_meta_data->>'position',
      NEW.raw_user_meta_data->>'phone'
    );
    
    -- Create MASTER role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'MASTER');
  ELSE
    -- Create agency for AGENCY user
    INSERT INTO public.agencies (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization', '새 에이전시'))
    RETURNING id INTO new_agency_id;
    
    -- Create profile with agency
    INSERT INTO public.user_profiles (
      id, agency_id, full_name, username, organization, position, phone
    ) VALUES (
      NEW.id,
      new_agency_id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'organization',
      NEW.raw_user_meta_data->>'position',
      NEW.raw_user_meta_data->>'phone'
    );
    
    -- Create AGENCY role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'AGENCY');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. RLS Policies

-- Agencies: MASTER can read all, AGENCY can only read their own
CREATE POLICY "MASTER can read all agencies"
  ON public.agencies FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER'));

CREATE POLICY "AGENCY can read their own agency"
  ON public.agencies FOR SELECT
  USING (id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can update their own agency"
  ON public.agencies FOR UPDATE
  USING (id = public.get_user_agency_id(auth.uid()));

-- User Profiles: Users can read their own, MASTER can read all
CREATE POLICY "Users can read their own profile"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'MASTER'));

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid());

-- User Roles: Read-only for users, MASTER can read all
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'MASTER'));

-- Projects: MASTER can read all, AGENCY can CRUD their own
CREATE POLICY "MASTER can read all projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER'));

CREATE POLICY "AGENCY can read their own projects"
  ON public.projects FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can update their own projects"
  ON public.projects FOR UPDATE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can delete their own projects"
  ON public.projects FOR DELETE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

-- Participants: MASTER can read all, AGENCY can CRUD their own
CREATE POLICY "MASTER can read all participants"
  ON public.participants FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER'));

CREATE POLICY "AGENCY can read their own participants"
  ON public.participants FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can create participants"
  ON public.participants FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can update their own participants"
  ON public.participants FOR UPDATE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "AGENCY can delete their own participants"
  ON public.participants FOR DELETE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

-- 10. Updated_at Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();