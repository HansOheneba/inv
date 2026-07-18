"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Bike, Phone, Map } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { AdvanceOrderButton } from "@/components/orders/advance-order-button";
import { getBrowserClient } from "@/lib/supabase/client";
import { cancelOrderAction } from "@/lib/actions/orders";
import type { OrderListItem } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/supabase/types";

const TABS = [
  { value: "active", label: "Active" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
] as const;

const ACTIVE_STATUSES: OrderStatus[] = ["confirmed", "packed", "out_for_delivery"];

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    value,
  );

function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        formData.set("orderId", orderId);
        setPending(true);
        const result = await cancelOrderAction(formData);
        setPending(false);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Order cancelled");
        router.refresh();
      }}
    >
      <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel"}
      </Button>
    </form>
  );
}

export function OrdersBoard({
  orders,
  isOwner,
}: {
  orders: OrderListItem[];
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<string>("active");
  const router = useRouter();

  // Realtime: refetch the board (server-side, so joins + RLS stay intact) the
  // instant an order is created or its status changes.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("orders-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (tab === "active") return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-3 w-full overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-meta text-muted-foreground">No orders here.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((order) => {
            const canCancel = isOwner && order.status !== "delivered" && order.status !== "cancelled";
            return (
              <li key={order.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-row-value font-semibold tabular-nums">#{order.orderNumber}</span>
                      <span className="truncate text-row-title font-medium">{order.customerName}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    {order.customerPhone ? (
                      <p className="mt-0.5 flex items-center gap-1 text-meta text-muted-foreground">
                        <Phone className="size-3" />
                        {order.customerPhone}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-row-value font-semibold tabular-nums">
                    {currency(order.total)}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-2 text-meta">
                      <span className="truncate">
                        <span className="tabular-nums text-muted-foreground">{item.quantity}×</span>{" "}
                        {item.productName}
                        {item.variantName ? (
                          <span className="text-muted-foreground"> · {item.variantName}</span>
                        ) : null}
                        {item.specNote ? (
                          <span className="text-muted-foreground"> — {item.specNote}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {currency(item.quantity * item.unitPrice)}
                      </span>
                    </li>
                  ))}
                  {order.discount > 0 ? (
                    <li className="flex items-baseline justify-between gap-2 text-meta text-status-out">
                      <span>Discount</span>
                      <span className="shrink-0 tabular-nums">−{currency(order.discount)}</span>
                    </li>
                  ) : null}
                </ul>

                {order.deliveryAddress ? (
                  <p className="mt-2 flex items-start gap-1 text-meta text-muted-foreground">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    {order.deliveryAddress}
                  </p>
                ) : null}

                {order.mapsUrl ? (
                  <a
                    href={order.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-meta text-blue-600 hover:underline"
                  >
                    <Map className="size-3" />
                    Open in Maps
                  </a>
                ) : null}

                {order.notes ? (
                  <p className="mt-1 text-meta text-muted-foreground">{order.notes}</p>
                ) : null}

                {order.riderName ? (
                  <p className="mt-1 flex items-center gap-1 text-meta text-foreground">
                    <Bike className="size-3" />
                    {order.riderName}
                    {order.riderPhone ? (
                      <span className="text-muted-foreground"> • {order.riderPhone}</span>
                    ) : null}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-end gap-1">
                  {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
                  <AdvanceOrderButton orderId={order.id} status={order.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
