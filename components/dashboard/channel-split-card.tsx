import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ChannelSplit } from "@/lib/data/dashboard";

export function ChannelSplitCard({ split }: { split: ChannelSplit }) {
  return (
    <Card className="gap-2.5 py-4 sm:col-span-2">
      <CardContent className="px-4">
        <p className="text-meta text-muted-foreground">Sales split to date</p>

        {split.hasData ? (
          <>
            <div className="mt-3 flex h-10 overflow-hidden rounded-lg">
              <div
                style={{ width: `${split.inStorePct}%` }}
                className="flex min-w-14 flex-col justify-center bg-foreground px-3"
              >
                <span className="text-row-value font-semibold text-background tabular-nums">
                  {split.inStorePct}%
                </span>
              </div>
              <div
                style={{ width: `${split.onlinePct}%` }}
                className="flex min-w-14 flex-col justify-center bg-muted px-3"
              >
                <span className="text-row-value font-semibold text-foreground tabular-nums">
                  {split.onlinePct}%
                </span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-meta text-muted-foreground">
              <span>In-store</span>
              <span>Online</span>
            </div>
          </>
        ) : (
          <p className="mt-3 text-meta text-muted-foreground">
            No completed sales yet — the split will appear once you start recording sales.
          </p>
        )}

        <div className="mt-3 flex items-center justify-end">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/sales" />}>
            View sales
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
