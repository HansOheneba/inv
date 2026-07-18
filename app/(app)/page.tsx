import Link from "next/link";
import { Receipt, TrendingUp } from "lucide-react";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import {
  getChannelSplit,
  getDashboardStats,
  getOrderPipeline,
  getPendingShipments,
  getRecentActivity,
  getWeeklyRevenueTrend,
} from "@/lib/data/dashboard";
import { getProductPerformance } from "@/lib/data/product-performance";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ChannelSplitCard } from "@/components/dashboard/channel-split-card";
import { OrderPipelineCard } from "@/components/dashboard/order-pipeline-card";
import { RevenueChartCard } from "@/components/dashboard/revenue-chart-card";
import { AtlasPromoCard } from "@/components/dashboard/atlas-promo-card";
import { ProductPerformanceTable } from "@/components/dashboard/product-performance-table";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [stats, trend, split, performance, activity, pendingShipments, pipeline] = await Promise.all([
    getDashboardStats({ includeStockValue: owner }),
    getWeeklyRevenueTrend(),
    getChannelSplit(),
    getProductPerformance({ includeCosts: owner }),
    getRecentActivity(),
    getPendingShipments(),
    getOrderPipeline(),
  ]);

  const firstName = profile.full_name?.split(" ")[0] || "there";
  const avgDaily = stats.weekSales / 7;
  const revenueTrend =
    avgDaily > 0 ? Math.round(((stats.todaySales - avgDaily) / avgDaily) * 100) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-6">
      <div>
        <h1 className="text-page-title font-semibold">Hi, {firstName}</h1>
        <p className="text-meta text-muted-foreground">Here&apos;s how the business looks today.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Revenue today"
          value={currency(stats.todaySales)}
          trend={revenueTrend === null ? undefined : `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs daily avg`}
          trendTone={revenueTrend === null ? "neutral" : revenueTrend >= 0 ? "positive" : "negative"}
          href="/sales"
        />
        <MetricCard
          icon={Receipt}
          label="Orders today"
          value={String(stats.todayOrders)}
          trend={`${stats.weekOrders} this week`}
          href="/sales"
        />
        <ChannelSplitCard split={split} />
      </div>

      <OrderPipelineCard pipeline={pipeline} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RevenueChartCard trend={trend} weekOrders={stats.weekOrders} weekRevenue={stats.weekSales} />
        <AtlasPromoCard />
      </div>

      <ProductPerformanceTable rows={performance} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-section-title">Shipments to watch</h2>
            <Link href="/shipments" className="text-meta text-primary">
              View all
            </Link>
          </div>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {pendingShipments.length === 0 ? (
                <p className="px-3 py-4 text-meta text-muted-foreground">
                  Nothing in transit right now.
                </p>
              ) : (
                pendingShipments.map((shipment) => (
                  <div key={shipment.id} className="row-h row-px flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-row-title font-medium">{shipment.referenceCode}</p>
                      <p className="truncate text-meta text-muted-foreground">
                        {shipment.supplierName ?? "Unknown supplier"}
                        {shipment.expectedArrival
                          ? ` • ETA ${new Date(shipment.expectedArrival).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                    <ShipmentStatusBadge status={shipment.status as never} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-section-title">Team activity</h2>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {activity.length === 0 ? (
                <p className="px-3 py-4 text-meta text-muted-foreground">
                  No activity logged yet — actions your team takes will show up here.
                </p>
              ) : (
                activity.map((entry) => (
                  <div key={entry.id} className="px-3 py-2.5">
                    <p className="text-row-title">
                      <span>{entry.actorName}</span>{" "}
                      <span className="font-normal text-muted-foreground">{entry.description}</span>
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
