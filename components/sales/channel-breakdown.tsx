import { Card, CardContent } from "@/components/ui/card";
import type { ChannelBreakdownRow } from "@/lib/data/sales";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export function ChannelBreakdown({ rows }: { rows: ChannelBreakdownRow[] }) {
  return (
    <Card className="h-full gap-0 py-5">
      <CardContent className="px-5">
        <div className="mb-4">
          <p className="text-section-title">By channel</p>
          <p className="text-meta text-muted-foreground">Completed sales · last 30 days</p>
        </div>

        {rows.length === 0 ? (
          <p className="text-meta text-muted-foreground">
            No completed sales yet. Delivered orders will show up here by channel.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.channelId}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-row-title font-medium">{row.name}</p>
                    <p className="text-meta text-muted-foreground">
                      {row.orders} order{row.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-row-value font-semibold tabular-nums">{currency(row.revenue)}</p>
                    <p className="text-meta text-muted-foreground tabular-nums">{row.sharePct}%</p>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent-teal"
                    style={{ width: `${Math.max(row.sharePct, row.revenue > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
