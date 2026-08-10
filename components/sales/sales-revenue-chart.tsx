import { Card, CardContent } from "@/components/ui/card";
import type { RevenueDay } from "@/lib/data/sales";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export function SalesRevenueChart({
  trend,
  periodLabel = "Last 14 days",
}: {
  trend: RevenueDay[];
  periodLabel?: string;
}) {
  const max = Math.max(1, ...trend.map((day) => day.value));
  const total = trend.reduce((sum, day) => sum + day.value, 0);

  return (
    <Card className="h-full gap-0 py-5">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-section-title">Revenue</p>
            <p className="text-meta text-muted-foreground">{periodLabel}</p>
          </div>
          <p className="text-row-value font-semibold tabular-nums">{currency(total)}</p>
        </div>

        <div className="mt-5 flex h-44 items-end gap-1.5">
          {trend.map((day) => {
            const pct = day.value > 0 ? Math.max(6, Math.round((day.value / max) * 100)) : 2;
            return (
              <div key={day.dateKey} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={
                      day.value > 0
                        ? "w-full rounded-sm bg-linear-to-t from-accent-emerald to-accent-teal"
                        : "w-full rounded-sm bg-muted"
                    }
                    style={{ height: `${pct}%` }}
                    title={`${day.label}: ${currency(day.value)}`}
                  />
                </div>
                <span className="truncate text-caption text-muted-foreground">
                  {day.dateKey.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
