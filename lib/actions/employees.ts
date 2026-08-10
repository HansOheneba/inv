"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";

export interface InviteEmployeeResult {
  error?: string;
  email?: string;
  tempPassword?: string;
}

/**
 * Lightweight team invite for the demo: creates an Auth user (employee) with a
 * temporary password. The handle_new_user trigger inserts their profile row.
 * Not a full email-invite pipeline — just enough to add someone from the Team tab.
 */
export async function inviteEmployeeAction(
  _prev: InviteEmployeeResult,
  formData: FormData,
): Promise<InviteEmployeeResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only owners can invite team members" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { error: "Enter their name" };
  if (!email || !email.includes("@")) return { error: "Enter a valid email" };

  const tempPassword = `Rk-${Math.random().toString(36).slice(2, 8)}!`;
  const { supabaseAdmin } = await requireSupabaseContext();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    const message = error?.message ?? "Could not create the account";
    if (message.toLowerCase().includes("already")) {
      return { error: "That email already has an account" };
    }
    return { error: message };
  }

  await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName, role: "employee", active: true })
    .eq("id", data.user.id);

  await supabaseAdmin.from("activity_log").insert({
    user_id: profile.id,
    action_type: "employee.invite",
    entity_type: "profile",
    entity_id: data.user.id,
    description: `Invited ${fullName} (${email})`,
  });

  revalidatePath("/employees");
  return { email, tempPassword };
}

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
