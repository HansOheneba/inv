import { requireSupabaseContext } from "@/lib/supabase/context";

export interface AdminDepartment {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
}

/** Leaf departments for product assignment in the admin catalogue forms. */
export async function getDepartmentsForAdmin(): Promise<AdminDepartment[]> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, slug, parent_id")
    .not("parent_id", "is", null)
    .order("name");

  if (error) throw error;

  const parents = new Map<string, string>();
  const { data: topLevel } = await supabase
    .from("departments")
    .select("id, name")
    .is("parent_id", null);

  for (const row of topLevel ?? []) {
    parents.set(row.id, row.name);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentName: row.parent_id ? (parents.get(row.parent_id) ?? null) : null,
  }));
}

/** Distinct department names for inventory filtering/display. */
export async function getDepartmentNames(): Promise<string[]> {
  const departments = await getDepartmentsForAdmin();
  return departments.map((row) => row.name).sort((a, b) => a.localeCompare(b));
}
