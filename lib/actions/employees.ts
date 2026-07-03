"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";

export async function toggleEmployeeRoleAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return;

  const targetId = String(formData.get("profileId") ?? "");
  const nextRole = String(formData.get("nextRole") ?? "");
  if (!targetId || (nextRole !== "owner" && nextRole !== "employee")) return;
  if (targetId === profile.id) return; // can't change your own role

  const { supabase } = await requireSupabaseContext();
  await supabase.from("profiles").update({ role: nextRole }).eq("id", targetId);

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "employee.role_change",
    entity_type: "profile",
    entity_id: targetId,
    description: `Changed a team member's role to ${nextRole}`,
  });

  revalidatePath("/employees");
}

export async function toggleEmployeeActiveAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return;

  const targetId = String(formData.get("profileId") ?? "");
  const active = formData.get("active") === "true";
  if (!targetId || targetId === profile.id) return;

  const { supabase } = await requireSupabaseContext();
  await supabase.from("profiles").update({ active: !active }).eq("id", targetId);

  revalidatePath("/employees");
}
