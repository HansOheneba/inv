import Link from "next/link";
import { Plus } from "lucide-react";
import { getOrders } from "@/lib/data/orders";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { OrdersBoard } from "@/components/orders/orders-board";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const orders = await getOrders();

  const openCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title font-semibold">Orders</h1>
          <p className="text-meta text-muted-foreground">
            {openCount} order{openCount === 1 ? "" : "s"} in progress
          </p>
        </div>
        {owner ? (
          <Button size="sm" className="gap-1.5" nativeButton={false} render={<Link href="/orders/new" />}>
            <Plus className="size-4" />
            New order
          </Button>
        ) : null}
      </div>
      <OrdersBoard orders={orders} isOwner={owner} />
    </div>
  );
}
