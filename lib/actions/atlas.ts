"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { requireSupabaseContext } from "@/lib/supabase/context";

export interface CreateConversationResult {
  id?: string;
  error?: string;
}

/** Starts an empty Atlas thread and returns its id. Owner-only. */
export async function createConversationAction(): Promise<CreateConversationResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Atlas is only available to the owner." };

  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase
    .from("atlas_conversations")
    .insert({ user_id: profile.id })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not start a new chat." };

  revalidatePath("/insights");
  return { id: data.id };
}

/** Deletes a thread (messages cascade). Owner-only; RLS scopes to own rows. */
export async function deleteConversationAction(id: string): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Atlas is only available to the owner." };

  const { supabase } = await requireSupabaseContext();
  const { error } = await supabase.from("atlas_conversations").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/insights");
  return {};
}
