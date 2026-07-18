import { getOptionalProfile, isOwner } from "@/lib/auth";
import { getSupabaseContext } from "@/lib/supabase/context";
import { buildAtlasContext } from "@/lib/insights/context";
import { buildSystemPrompt } from "@/lib/insights/atlas-prompt";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

/** Pulls a human-readable reason out of DeepSeek's JSON error body, if present. */
function parseDeepSeekError(body: string): string | null {
  try {
    const json = JSON.parse(body) as { error?: { message?: string } };
    return json.error?.message ?? null;
  } catch {
    return null;
  }
}

/** A short thread title from the first user message, à la ChatGPT. */
function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= 48 ? clean : `${clean.slice(0, 48).trimEnd()}…`;
}

interface AtlasRequest {
  conversationId?: string;
  question?: string;
}

/**
 * Streams Atlas's answer token-by-token and persists the turn. Owner-only.
 *
 * Like ChatGPT/DeepSeek, the prompt is rebuilt from the conversation's stored
 * messages on every turn (system prompt + prior messages + new question) rather
 * than kept as one blob — that's what makes a thread resumable. The user message
 * is saved immediately; the assistant message is saved once the stream finishes.
 */
export async function POST(request: Request) {
  const profile = await getOptionalProfile();
  if (!profile || !isOwner(profile)) {
    return new Response("Atlas is only available to the owner.", { status: 403 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response("Atlas isn't configured yet — the DEEPSEEK_API_KEY is missing.", {
      status: 503,
    });
  }

  let body: AtlasRequest;
  try {
    body = (await request.json()) as AtlasRequest;
  } catch {
    return new Response("Could not read the request.", { status: 400 });
  }

  const question = body.question?.trim();
  const conversationId = body.conversationId?.trim();
  if (!question) return new Response("Ask a question to get started.", { status: 400 });
  if (!conversationId) return new Response("Missing conversation.", { status: 400 });

  const ctxResult = await getSupabaseContext();
  if (ctxResult.error) {
    return new Response("Your session expired. Please sign in again.", { status: 401 });
  }
  const { supabase } = ctxResult.data;

  // RLS scopes to the owner's rows; this also confirms the thread exists.
  const { data: conversation } = await supabase
    .from("atlas_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return new Response("Conversation not found.", { status: 404 });

  // Prior turns, loaded before we insert the new question.
  const { data: priorRows } = await supabase
    .from("atlas_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  const prior = priorRows ?? [];

  // Persist the user's message now so it survives even if the model call fails.
  await supabase
    .from("atlas_messages")
    .insert({ conversation_id: conversationId, role: "user", content: question });

  const titlePatch =
    !conversation.title || conversation.title === "New chat"
      ? { title: deriveTitle(question) }
      : {};

  const context = await buildAtlasContext();
  const messages = [
    { role: "system", content: buildSystemPrompt(context) },
    ...prior.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user", content: question },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 900,
        stream: true,
      }),
    });
  } catch (error) {
    console.error("[atlas] network error reaching DeepSeek:", error);
    await supabase
      .from("atlas_conversations")
      .update({ updated_at: new Date().toISOString(), ...titlePatch })
      .eq("id", conversationId);
    return new Response("Atlas couldn't reach the model just now. Please try again.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[atlas] DeepSeek returned ${upstream.status}:`, detail);
    await supabase
      .from("atlas_conversations")
      .update({ updated_at: new Date().toISOString(), ...titlePatch })
      .eq("id", conversationId);
    const reason = parseDeepSeekError(detail);
    return new Response(
      reason
        ? `Atlas couldn't answer: ${reason}`
        : "Atlas couldn't reach the model just now. Please try again.",
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const finalize = async (assistantText: string) => {
    if (assistantText.trim()) {
      await supabase
        .from("atlas_messages")
        .insert({ conversation_id: conversationId, role: "assistant", content: assistantText });
    }
    await supabase
      .from("atlas_conversations")
      .update({ updated_at: new Date().toISOString(), ...titlePatch })
      .eq("id", conversationId);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      let assistantText = "";
      let streamDone = false;
      try {
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              streamDone = true;
              break;
            }
            try {
              const json = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                assistantText += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // Ignore keep-alive lines or partial JSON split across chunks.
            }
          }
        }
        await finalize(assistantText);
        controller.close();
      } catch (error) {
        console.error("[atlas] stream interrupted:", error);
        await finalize(assistantText).catch(() => {});
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
