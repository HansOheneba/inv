import { requireSupabaseContext } from "@/lib/supabase/context";
import type { Tables } from "@/lib/supabase/types";

export async function getEmployees(): Promise<Tables<"profiles">[]> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
