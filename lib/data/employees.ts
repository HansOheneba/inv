import { requireSupabaseContext } from "@/lib/supabase/context";

export interface EmployeeRow {
  id: string;
  fullName: string;
  email: string | null;
  role: "owner" | "employee";
  active: boolean;
  createdAt: string;
}

export async function getEmployees(): Promise<EmployeeRow[]> {
  const { supabase, supabaseAdmin } = await requireSupabaseContext();

  const [{ data: profiles, error }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, active, created_at").order("created_at"),
    supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  if (error) throw error;

  const emailById = new Map(
    (authData?.users ?? []).map((user) => [user.id, user.email ?? null] as const),
  );

  return (profiles ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: emailById.get(row.id) ?? null,
    role: row.role as "owner" | "employee",
    active: row.active,
    createdAt: row.created_at,
  }));
}
