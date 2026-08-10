import Link from "next/link";
import { Plus } from "lucide-react";
import { getOrders } from "@/lib/data/orders";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { OrdersBoard } from "@/components/orders/orders-board";
import { PageHeader, PageShell } from "@/components/app-shell/page-shell";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const orders = await getOrders();

  const openCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length;

  return (
    <PageShell>
      <PageHeader
        title="Orders"
        description={`${openCount} order${openCount === 1 ? "" : "s"} in progress · WhatsApp & website`}
        actions={
          owner ? (
            <Button className="gap-1.5" nativeButton={false} render={<Link href="/orders/new" />}>
              <Plus className="size-4" />
              New order
            </Button>
          ) : null
        }
      />
      <OrdersBoard orders={orders} isOwner={owner} />
    </PageShell>
  );
}
