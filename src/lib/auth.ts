import { supabase } from "@/integrations/supabase/client";

export type UserRole = "MASTER" | "AGENCY";

export interface UserProfile {
  id: string;
  agency_id: string | null;
  organization: string | null;
  full_name: string;
  position: string | null;
  phone: string | null;
  username: string;
}

export interface SignUpData {
  username: string;
  password: string;
  full_name: string;
  organization?: string;
  position?: string;
  phone?: string;
}

export const signUp = async (data: SignUpData) => {
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: `${data.username}@sympohub.internal`,
    password: data.password,
    options: {
      data: {
        username: data.username,
        full_name: data.full_name,
        organization: data.organization,
        position: data.position,
        phone: data.phone,
        role: "AGENCY", // Default to AGENCY role
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  return { data: signUpData, error };
};

export const signIn = async (username: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@sympohub.internal`,
    password: password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as UserRole;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
};
