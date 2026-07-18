import { requireSupabaseContext } from "@/lib/supabase/context";

export interface AtlasConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface AtlasStoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** The owner's chat threads, most recently active first (RLS-scoped). */
export async function getConversations(): Promise<AtlasConversationSummary[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("atlas_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

/** Every message in a thread, oldest first. RLS ensures ownership. */
export async function getConversationMessages(
  conversationId: string,
): Promise<AtlasStoredMessage[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("atlas_messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
  }));
}
