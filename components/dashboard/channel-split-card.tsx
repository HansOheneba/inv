import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ChannelSplit } from "@/lib/data/dashboard";

export function ChannelSplitCard({ split }: { split: ChannelSplit }) {
  return (
    <Card className="h-full gap-0 py-5">
      <CardContent className="flex h-full flex-col px-5">
        <p className="text-meta text-muted-foreground">Sales split to date</p>

        {split.hasData ? (
          <>
            <div className="mt-4 flex h-11 overflow-hidden rounded-lg">
              <div
                style={{ width: `${split.websitePct}%` }}
                className="flex min-w-14 flex-col justify-center bg-accent-sky px-3"
              >
                <span className="text-row-value font-semibold text-white tabular-nums">
                  {split.websitePct}%
                </span>
              </div>
              <div
                style={{ width: `${split.socialPct}%` }}
                className="flex min-w-14 flex-col justify-center bg-accent-teal px-3"
              >
                <span className="text-row-value font-semibold text-white tabular-nums">
                  {split.socialPct}%
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-meta">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-accent-sky" />
                Website
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-accent-teal" />
                Social media
              </span>
            </div>
          </>
        ) : (
          <p className="mt-4 text-meta text-muted-foreground">
            No completed sales yet — the split appears once orders are delivered.
          </p>
        )}

        <div className="mt-auto flex items-center justify-end pt-4">
          <Button variant="outline" nativeButton={false} render={<Link href="/sales" />}>
            View sales
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
