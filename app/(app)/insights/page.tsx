import { redirect } from "next/navigation";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getBusinessSnapshot } from "@/lib/data/insights";
import { getConversations, getConversationMessages } from "@/lib/data/atlas";
import { AtlasWorkspace } from "@/components/insights/atlas-workspace";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const profile = await getCurrentProfile();
  // Atlas reasons over cost/margin data across the whole business, so it's the
  // owner's tool only — employees are sent back to the dashboard.
  if (!isOwner(profile)) redirect("/");

  const [{ c: requested }, conversations, snapshot] = await Promise.all([
    searchParams,
    getConversations(),
    getBusinessSnapshot({ includeCosts: true }),
  ]);

  // `c=new` forces a blank thread; otherwise resume the requested (owned) thread,
  // falling back to the most recent one.
  const isNew = requested === "new";
  const activeId = isNew
    ? null
    : requested && conversations.some((conversation) => conversation.id === requested)
      ? requested
      : (conversations[0]?.id ?? null);

  const initialMessages = activeId ? await getConversationMessages(activeId) : [];

  return (
    <AtlasWorkspace
      conversations={conversations}
      activeId={activeId}
      initialMessages={initialMessages}
      snapshot={snapshot}
      profile={profile}
    />
  );
}
