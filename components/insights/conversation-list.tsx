"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteConversationAction } from "@/lib/actions/atlas";
import { cn } from "@/lib/utils";
import type { AtlasConversationSummary } from "@/lib/data/atlas";

export function ConversationList({
  conversations,
  activeId,
  onNavigate,
}: {
  conversations: AtlasConversationSummary[];
  activeId: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openThread(id: string) {
    onNavigate?.();
    router.push(`/insights?c=${id}`);
  }

  function newChat() {
    onNavigate?.();
    router.push("/insights?c=new");
  }

  function remove(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    startTransition(async () => {
      await deleteConversationAction(id);
      if (id === activeId) router.push("/insights?c=new");
      else router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <Button
          onClick={newChat}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-meta text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => openThread(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-left text-meta transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <MessageSquare className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate">{conversation.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => remove(event, conversation.id)}
                    disabled={pending}
                    aria-label="Delete chat"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
