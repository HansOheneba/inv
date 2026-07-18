import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderPipeline } from "@/lib/data/dashboard";

function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

const STAGES = [
  { key: "confirmed", label: "Confirmed", tone: "text-muted-foreground" },
  { key: "packed", label: "Packed", tone: "text-status-low" },
  { key: "outForDelivery", label: "Out for delivery", tone: "text-blue-600" },
  { key: "deliveredToday", label: "Delivered today", tone: "text-status-available" },
] as const;

export function OrderPipelineCard({ pipeline }: { pipeline: OrderPipeline }) {
  return (
    <Card className="gap-2.5 py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-meta text-muted-foreground">Orders in fulfilment</p>
          <span className="text-meta tabular-nums text-muted-foreground">
            {pipeline.openTotal} open
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage.key}>
              <p className={cn("text-page-title font-semibold tabular-nums", stage.tone)}>
                {pipeline[stage.key]}
              </p>
              <p className="mt-0.5 text-meta text-muted-foreground">{stage.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-meta text-muted-foreground">
          {pipeline.deliveredWeek} delivered this week
          {pipeline.avgFulfilmentHours !== null
            ? ` • ${formatDuration(pipeline.avgFulfilmentHours)} avg order → delivery`
            : ""}
        </p>

        <div className="mt-3 flex items-center justify-end">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/orders" />}>
            View orders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
