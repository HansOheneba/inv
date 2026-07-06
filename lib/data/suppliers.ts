import { requireSupabaseContext } from "@/lib/supabase/context";
import type { Tables } from "@/lib/supabase/types";

export async function getSuppliers(): Promise<Tables<"suppliers">[]> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase.from("suppliers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
