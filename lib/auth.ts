import { redirect } from "next/navigation";
import { getSupabaseContext } from "@/lib/supabase/context";
import type { Tables } from "@/lib/supabase/types";

export type CurrentProfile = Tables<"profiles"> & { email: string | null };

/**
 * Returns the signed-in user's profile when the session is fully valid.
 * Returns null for guests or sessions that fail JWT verification.
 */
export async function getOptionalProfile(): Promise<CurrentProfile | null> {
  const result = await getSupabaseContext();
  if (result.error || !result.data.userClaims) {
    return null;
  }

  const { supabase, supabaseAdmin, userClaims } = result.data;
  const userId = userClaims.id;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { ...existing, email: userClaims.email ?? null };
  }

  // Admin-created users can exist before the DB trigger ran (or if migrations
  // were applied after the user was created). Bootstrap the missing profile.
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: created, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: userId,
      full_name: userClaims.email?.split("@")[0] ?? "",
      role: (count ?? 0) === 0 ? "owner" : "employee",
    })
    .select("*")
    .single();

  if (error || !created) {
    return null;
  }

  return { ...created, email: userClaims.email ?? null };
}

/**
 * Fetches the signed-in user's profile (role, name, etc). Redirects to
 * /login if there's no session — safe to call at the top of any
 * authenticated Server Component or Server Action.
 */
export async function getCurrentProfile(): Promise<CurrentProfile> {
  const profile = await getOptionalProfile();

  if (!profile) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Database not set up yet. In Supabase Dashboard → SQL Editor, run supabase/migrations/0001_init.sql (then optional seed.sql), and sign in again.",
        ),
    );
  }

  return profile;
}

export function isOwner(profile: Pick<CurrentProfile, "role">) {
  return profile.role === "owner";
}
