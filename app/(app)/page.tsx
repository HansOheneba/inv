import Link from "next/link";
import {
  CalendarDays,
  Package,
  Plus,
  Receipt,
  TrendingUp,
} from "lucide-react";
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
import { PageHeader, PageShell } from "@/components/app-shell/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <PageShell>
      <PageHeader
        title={`Hi, ${firstName}`}
        description="Here&apos;s how the business looks today."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/inventory" />}>
              Inventory
            </Button>
            {owner ? (
              <Button className="gap-1.5" nativeButton={false} render={<Link href="/orders/new" />}>
                <Plus className="size-4" />
                New order
              </Button>
            ) : (
              <Button nativeButton={false} render={<Link href="/orders" />}>
                Orders
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Revenue today"
          value={currency(stats.todaySales)}
          accent="emerald"
          trend={
            revenueTrend === null
              ? undefined
              : `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs daily avg`
          }
          trendTone={revenueTrend === null ? "neutral" : revenueTrend >= 0 ? "positive" : "negative"}
          href="/sales"
        />
        <MetricCard
          icon={Receipt}
          label="Orders today"
          value={String(stats.todayOrders)}
          accent="sky"
          trend={`${stats.weekOrders} this week`}
          href="/sales"
        />
        <MetricCard
          icon={CalendarDays}
          label="This week"
          value={currency(stats.weekSales)}
          accent="teal"
          trend={`${stats.weekOrders} orders`}
          href="/sales"
        />
        <MetricCard
          icon={Package}
          label="Open orders"
          value={String(pipeline.openTotal)}
          accent="amber"
          trend={`${pipeline.deliveredToday} delivered today`}
          href="/orders"
        />
      </div>

      <OrderPipelineCard pipeline={pipeline} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChartCard trend={trend} weekOrders={stats.weekOrders} weekRevenue={stats.weekSales} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ChannelSplitCard split={split} />
          <AtlasPromoCard />
        </div>
      </div>

      <ProductPerformanceTable rows={performance} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-section-title">Shipments to watch</h2>
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/shipments" />}>
              View all
            </Button>
          </div>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {pendingShipments.length === 0 ? (
                <p className="px-4 py-5 text-meta text-muted-foreground">
                  Nothing in transit right now.
                </p>
              ) : (
                pendingShipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
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
          <h2 className="mb-3 text-section-title">Team activity</h2>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {activity.length === 0 ? (
                <p className="px-4 py-5 text-meta text-muted-foreground">
                  No activity logged yet — actions your team takes will show up here.
                </p>
              ) : (
                activity.map((entry) => (
                  <div key={entry.id} className="px-4 py-3.5">
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
    </PageShell>
  );
}
