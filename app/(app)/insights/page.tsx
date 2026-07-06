import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getBusinessSnapshot } from "@/lib/data/insights";
import { KofiChat } from "@/components/insights/kofi-chat";
import { KOFI_NAME } from "@/lib/insights/kofi";

export default async function InsightsPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);
  const snapshot = await getBusinessSnapshot({ includeCosts: owner });

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-w-3xl flex-col px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-page-title font-semibold">{KOFI_NAME}</h1>
          <p className="truncate text-meta text-muted-foreground">
            Your business copilot — reads your live numbers, no setup needed
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 gap-1 text-[11px]">
          Demo
        </Badge>
      </div>

      <KofiChat snapshot={snapshot} showCosts={owner} profile={profile} />

      <p className="mt-2 text-center text-caption text-muted-foreground">
        {KOFI_NAME} answers from rules over your live data today. Full AI-powered analysis is coming
        soon.
      </p>
    </div>
  );
}
