"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildOpeningInsights, suggestedPrompts, ATLAS_NAME } from "@/lib/insights/atlas";
import { createConversationAction } from "@/lib/actions/atlas";
import { Markdown } from "@/components/insights/markdown";
import { cn } from "@/lib/utils";
import type { BusinessSnapshot } from "@/lib/data/insights";
import type { AtlasStoredMessage } from "@/lib/data/atlas";
import type { CurrentProfile } from "@/lib/auth";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

function initials(name: string, email: string | null) {
  const source = name.trim() || email || "?";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AssistantAvatar() {
  return (
    <Avatar className="size-7 shrink-0 bg-primary text-primary-foreground">
      <AvatarFallback className="bg-primary text-primary-foreground">
        <Sparkles className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}

export function AtlasChat({
  conversationId: initialConversationId,
  initialMessages,
  snapshot,
  showCosts,
  profile,
}: {
  conversationId: string | null;
  initialMessages: AtlasStoredMessage[];
  snapshot: BusinessSnapshot;
  showCosts: boolean;
  profile: CurrentProfile;
}) {
  const router = useRouter();
  // Live snapshot greeting shown only on a fresh/empty thread — never persisted,
  // so it always reflects current numbers rather than a stale copy.
  const [intro] = useState(() =>
    initialMessages.length === 0 ? buildOpeningInsights(snapshot, showCosts) : [],
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
  );
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prompts = suggestedPrompts(snapshot);
  const hasUserMessage = messages.some((message) => message.role === "user");

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || thinking) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: question }]);
    setInput("");
    setThinking(true);

    const wasNew = conversationId === null;
    let activeId = conversationId;
    if (!activeId) {
      const created = await createConversationAction();
      if (created.error || !created.id) {
        setThinking(false);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: created.error ?? "Couldn't start the chat." },
        ]);
        return;
      }
      activeId = created.id;
      setConversationId(activeId);
    }

    const assistantId = crypto.randomUUID();
    const addReply = (content: string) => {
      setThinking(false);
      setMessages((prev) => {
        const existing = prev.find((message) => message.id === assistantId);
        if (existing) {
          return prev.map((message) =>
            message.id === assistantId ? { ...message, content } : message,
          );
        }
        return [...prev, { id: assistantId, role: "assistant", content }];
      });
    };

    try {
      const response = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, question }),
      });

      if (!response.ok || !response.body) {
        addReply((await response.text()) || "Something went wrong. Please try again.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        addReply(answer);
      }
      if (!answer.trim()) addReply("Atlas didn't return an answer. Please try again.");
    } catch {
      addReply("Atlas couldn't reach the model just now. Please try again.");
    } finally {
      // Sync the sidebar (titles/order) and, for a brand-new thread, move to its
      // permanent URL so a reload resumes it.
      if (wasNew && activeId) router.replace(`/insights?c=${activeId}`);
      else router.refresh();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div ref={viewportRef} className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-5 py-5 lg:px-6">
          {intro.map((content, index) => (
            <div key={`intro-${index}`} className="flex items-start gap-2.5">
              <AssistantAvatar />
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-row-value font-normal text-foreground">
                {content}
              </div>
            </div>
          ))}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2.5",
                message.role === "user" && "flex-row-reverse text-right",
              )}
            >
              {message.role === "assistant" ? (
                <AssistantAvatar />
              ) : (
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-[11px]">
                    {initials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-row-value font-normal",
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-muted text-left text-foreground"
                    : "rounded-tr-sm bg-primary text-primary-foreground",
                )}
              >
                {message.role === "assistant" ? (
                  <Markdown>{message.content}</Markdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {thinking ? (
            <div className="flex items-start gap-2.5">
              <AssistantAvatar />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t px-5 py-4 lg:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {!hasUserMessage ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  className="text-meta"
                  onClick={() => send(prompt)}
                  disabled={thinking}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask ${ATLAS_NAME} about your business…`}
              className="h-9"
              disabled={thinking}
            />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
