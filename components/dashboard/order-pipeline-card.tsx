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
  {
    key: "confirmed",
    label: "Confirmed",
    tone: "text-accent-sky",
    surface: "border-accent-sky/20 bg-accent-sky-soft",
  },
  {
    key: "packed",
    label: "Packed",
    tone: "text-accent-amber",
    surface: "border-accent-amber/25 bg-accent-amber-soft",
  },
  {
    key: "outForDelivery",
    label: "Out for delivery",
    tone: "text-accent-teal",
    surface: "border-accent-teal/20 bg-accent-teal-soft",
  },
  {
    key: "deliveredToday",
    label: "Delivered today",
    tone: "text-accent-emerald",
    surface: "border-accent-emerald/20 bg-accent-emerald-soft",
  },
] as const;

export function OrderPipelineCard({ pipeline }: { pipeline: OrderPipeline }) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-section-title">Orders in fulfilment</p>
            <p className="text-meta text-muted-foreground">
              {pipeline.openTotal} open
              {pipeline.deliveredWeek > 0
                ? ` · ${pipeline.deliveredWeek} delivered this week`
                : ""}
              {pipeline.avgFulfilmentHours !== null
                ? ` · ${formatDuration(pipeline.avgFulfilmentHours)} avg to delivery`
                : ""}
            </p>
          </div>
          <Button variant="outline" nativeButton={false} render={<Link href="/orders" />}>
            View orders
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className={cn("rounded-xl border px-4 py-3.5", stage.surface)}>
              <p className={cn("text-page-title font-semibold tabular-nums", stage.tone)}>
                {pipeline[stage.key]}
              </p>
              <p className="mt-1 text-meta text-muted-foreground">{stage.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
