import Link from "next/link";
import { AlertTriangle, Boxes, PackageX, Ship, TrendingUp, Wallet } from "lucide-react";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getDashboardStats, getPendingShipments, getRecentActivity } from "@/lib/data/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [stats, activity, pendingShipments] = await Promise.all([
    getDashboardStats({ includeStockValue: owner }),
    getRecentActivity(),
    getPendingShipments(),
  ]);

  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
      <div>
        <h1 className="text-page-title font-semibold">Hi, {firstName}</h1>
        <p className="text-meta text-muted-foreground">Here&apos;s how the business looks today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {owner ? (
          <KpiCard
            icon={Wallet}
            label="Stock value"
            value={currency(stats.stockValue)}
            href="/inventory"
          />
        ) : (
          <KpiCard icon={Boxes} label="Products tracked" value={String(stats.totalProducts)} href="/inventory" />
        )}
        <KpiCard icon={TrendingUp} label="Sales today" value={currency(stats.todaySales)} href="/sales" />
        <KpiCard icon={Ship} label="Shipments in transit" value={String(stats.pendingShipments)} href="/shipments" />
        <KpiCard
          icon={stats.outOfStockCount > 0 ? PackageX : AlertTriangle}
          label="Low / out of stock"
          value={`${stats.lowStockCount} / ${stats.outOfStockCount}`}
          href="/inventory"
          tone={stats.outOfStockCount > 0 ? "danger" : stats.lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

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
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-status-out"
      : tone === "warning"
        ? "text-status-low"
        : "text-primary";

  return (
    <Link href={href}>
      <Card className="gap-1.5 py-3">
        <CardContent className="px-3">
          <Icon className={`size-4 ${toneClass}`} />
          <p className="mt-1.5 text-row-value font-semibold tabular-nums">{value}</p>
          <p className="text-meta text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
