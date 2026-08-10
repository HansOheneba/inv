"use client";

import { useState } from "react";
import { PanelLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConversationList } from "@/components/insights/conversation-list";
import { AtlasChat } from "@/components/insights/atlas-chat";
import { ATLAS_NAME } from "@/lib/insights/atlas";
import type { AtlasConversationSummary, AtlasStoredMessage } from "@/lib/data/atlas";
import type { BusinessSnapshot } from "@/lib/data/insights";
import type { CurrentProfile } from "@/lib/auth";

export function AtlasWorkspace({
  conversations,
  activeId,
  initialMessages,
  snapshot,
  profile,
}: {
  conversations: AtlasConversationSummary[];
  activeId: string | null;
  initialMessages: AtlasStoredMessage[];
  snapshot: BusinessSnapshot;
  profile: CurrentProfile;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <aside className="hidden w-72 shrink-0 border-r md:block">
        <ConversationList conversations={conversations} activeId={activeId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b px-5 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Chat history"
            onClick={() => setSheetOpen(true)}
          >
            <PanelLeft className="size-4" />
          </Button>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-section-title font-semibold">{ATLAS_NAME}</h1>
            <p className="truncate text-caption text-muted-foreground">
              Reasons over your live collections, stock, sales and orders
            </p>
          </div>
        </div>

        <AtlasChat
          key={activeId ?? "new"}
          conversationId={activeId}
          initialMessages={initialMessages}
          snapshot={snapshot}
          showCosts
          profile={profile}
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onNavigate={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
