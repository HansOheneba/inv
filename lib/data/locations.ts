import { requireSupabaseContext } from "@/lib/supabase/context";
import type { Tables } from "@/lib/supabase/types";

export async function getLocations(): Promise<Tables<"locations">[]> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
