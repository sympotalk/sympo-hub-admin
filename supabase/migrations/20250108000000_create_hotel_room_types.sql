-- Hotel Room Types Table
CREATE TABLE public.hotel_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_name TEXT NOT NULL,
  description TEXT,
  max_occupancy INTEGER,
  bed_type TEXT,
  amenities TEXT[],
  price_per_night DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(hotel_id, room_type_name)
);

ALTER TABLE public.hotel_room_types ENABLE ROW LEVEL SECURITY;

-- Create index for search performance
CREATE INDEX idx_hotel_room_types_hotel_id ON public.hotel_room_types(hotel_id);

-- RLS Policy: Everyone can read room types
CREATE POLICY "Anyone can read hotel room types"
  ON public.hotel_room_types FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_hotel_room_types_updated_at
  BEFORE UPDATE ON public.hotel_room_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

