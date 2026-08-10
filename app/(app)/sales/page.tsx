import Link from "next/link";
import { Banknote, CalendarDays, Receipt, ShoppingBag } from "lucide-react";
import {
  getChannelBreakdown,
  getRecentSales,
  getSalesPeriodStats,
  getSalesRevenueTrend,
  getTopSellingProducts,
} from "@/lib/data/sales";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ChannelBreakdown } from "@/components/sales/channel-breakdown";
import { SalesRevenueChart } from "@/components/sales/sales-revenue-chart";
import { TopProductsTable } from "@/components/sales/top-products-table";
import { PageHeader, PageShell } from "@/components/app-shell/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export default async function SalesPage() {
  const [stats, trend, channels, topProducts, recent] = await Promise.all([
    getSalesPeriodStats(),
    getSalesRevenueTrend(14),
    getChannelBreakdown(),
    getTopSellingProducts(8),
    getRecentSales(12),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Sales"
        description={
          <>
            Analytics from completed orders — record sales on the{" "}
            <Link href="/orders" className="text-primary underline-offset-2 hover:underline">
              Orders
            </Link>{" "}
            board when you deliver.
          </>
        }
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/orders" />}>
            Open orders
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Banknote}
          label="Revenue today"
          value={currency(stats.todayRevenue)}
          accent="emerald"
          trend={`${stats.todayOrders} order${stats.todayOrders === 1 ? "" : "s"}`}
        />
        <MetricCard
          icon={CalendarDays}
          label="This week"
          value={currency(stats.weekRevenue)}
          accent="teal"
          trend={`${stats.weekOrders} order${stats.weekOrders === 1 ? "" : "s"}`}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Last 30 days"
          value={currency(stats.monthRevenue)}
          accent="sky"
          trend={`${stats.monthOrders} order${stats.monthOrders === 1 ? "" : "s"}`}
        />
        <MetricCard
          icon={Receipt}
          label="Avg order value"
          value={currency(stats.avgOrderValue)}
          accent="amber"
          trend="Across last 30 days"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesRevenueChart trend={trend} />
        </div>
        <ChannelBreakdown rows={channels} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopProductsTable rows={topProducts} />
        </div>
        <Card className="h-full gap-0 py-5">
          <CardContent className="px-5">
            <div className="mb-4">
              <p className="text-section-title">Recent sales</p>
              <p className="text-meta text-muted-foreground">From delivered orders</p>
            </div>
            {recent.length === 0 ? (
              <p className="text-meta text-muted-foreground">
                No completed sales yet. Mark an order as delivered to see it here.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((sale) => (
                  <li key={sale.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-row-title font-medium">
                        {sale.customerName ?? "Customer"}
                      </p>
                      <p className="truncate text-meta text-muted-foreground">
                        {sale.channelName ?? "Channel"}
                        {" · "}
                        {new Date(sale.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="shrink-0 text-row-value font-semibold tabular-nums">
                      {new Intl.NumberFormat("en-GH", {
                        style: "currency",
                        currency: sale.currency || "GHS",
                        maximumFractionDigits: 0,
                      }).format(sale.totalAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
