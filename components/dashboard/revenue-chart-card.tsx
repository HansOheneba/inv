import { Card, CardContent } from "@/components/ui/card";
import type { RevenueTrendPoint } from "@/lib/data/dashboard";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export function RevenueChartCard({
  trend,
  weekOrders,
  weekRevenue,
}: {
  trend: RevenueTrendPoint[];
  weekOrders: number;
  weekRevenue: number;
}) {
  const max = Math.max(1, ...trend.map((d) => d.value));
  const avgOrder = weekOrders > 0 ? weekRevenue / weekOrders : 0;

  return (
    <Card className="gap-3 py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-section-title">Revenue</p>
          <span className="text-meta text-muted-foreground">Last 7 days</span>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex h-36 flex-1 items-end gap-2">
            {trend.map((day) => {
              const pct = Math.max(4, Math.round((day.value / max) * 100));
              return (
                <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-md bg-primary/85"
                      style={{ height: `${pct}%` }}
                      title={currency(day.value)}
                    />
                  </div>
                  <span className="text-caption text-muted-foreground">{day.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex w-28 shrink-0 flex-col gap-2 sm:w-32">
            <StatTile label="Orders" value={String(weekOrders)} />
            <StatTile label="Avg order" value={currency(avgOrder)} />
            <StatTile label="Revenue" value={currency(weekRevenue)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-2.5 py-2">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-row-value font-semibold tabular-nums">{value}</p>
    </div>
  );
}
