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
    <Card className="h-full gap-0 py-5">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-section-title">Revenue</p>
          <span className="text-meta text-muted-foreground">Last 7 days</span>
        </div>

        <div className="mt-5 flex gap-6">
          <div className="flex h-44 flex-1 items-end gap-2.5">
            {trend.map((day) => {
              const pct = Math.max(4, Math.round((day.value / max) * 100));
              return (
                <div key={day.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-md bg-linear-to-t from-accent-emerald to-accent-teal"
                      style={{ height: `${pct}%` }}
                      title={currency(day.value)}
                    />
                  </div>
                  <span className="text-caption text-muted-foreground">{day.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex w-32 shrink-0 flex-col gap-2.5 sm:w-36">
            <StatTile label="Orders" value={String(weekOrders)} accent="sky" />
            <StatTile label="Avg order" value={currency(avgOrder)} accent="amber" />
            <StatTile label="Revenue" value={currency(weekRevenue)} accent="emerald" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sky" | "amber" | "emerald";
}) {
  const surface =
    accent === "sky"
      ? "border-accent-sky/20 bg-accent-sky-soft"
      : accent === "amber"
        ? "border-accent-amber/25 bg-accent-amber-soft"
        : "border-accent-emerald/20 bg-accent-emerald-soft";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${surface}`}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-row-value font-semibold tabular-nums">{value}</p>
    </div>
  );
}
