"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  answerKofi,
  buildOpeningInsights,
  randomThinkingDelay,
  suggestedPrompts,
  KOFI_NAME,
} from "@/lib/insights/kofi";
import { cn } from "@/lib/utils";
import type { BusinessSnapshot } from "@/lib/data/insights";
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

export function KofiChat({
  snapshot,
  showCosts,
  profile,
}: {
  snapshot: BusinessSnapshot;
  showCosts: boolean;
  profile: CurrentProfile;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    buildOpeningInsights(snapshot, showCosts).map((content) => ({
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content,
    })),
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prompts = suggestedPrompts(snapshot);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    const question = text.trim();
    if (!question || thinking) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: question }]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const reply = answerKofi(question, snapshot, showCosts);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      setThinking(false);
    }, randomThinkingDelay());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div ref={viewportRef} className="flex flex-col gap-4 px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2.5",
                message.role === "user" && "flex-row-reverse text-right",
              )}
            >
              {message.role === "assistant" ? (
                <Avatar className="size-7 shrink-0 bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="size-3.5" />
                  </AvatarFallback>
                </Avatar>
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
                    ? "rounded-tl-sm bg-muted text-foreground"
                    : "rounded-tr-sm bg-primary text-primary-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {thinking ? (
            <div className="flex items-start gap-2.5">
              <Avatar className="size-7 shrink-0 bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="size-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        {messages.length <= 4 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {prompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
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
            placeholder={`Ask ${KOFI_NAME} about your business…`}
            className="h-9"
            disabled={thinking}
          />
          <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
