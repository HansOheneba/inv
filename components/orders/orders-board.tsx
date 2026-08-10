"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderSourceBadge } from "@/components/orders/order-source-badge";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { AdvanceOrderButton } from "@/components/orders/advance-order-button";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { getBrowserClient } from "@/lib/supabase/client";
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
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export function OrdersBoard({
  orders,
  isOwner,
}: {
  orders: OrderListItem[];
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<string>("active");
  const router = useRouter();

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
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-meta">Order</TableHead>
                <TableHead className="text-meta">Customer</TableHead>
                <TableHead className="text-meta">Source</TableHead>
                <TableHead className="text-meta">Payment</TableHead>
                <TableHead className="text-right text-meta">Items</TableHead>
                <TableHead className="text-right text-meta">Total</TableHead>
                <TableHead className="text-meta">Status</TableHead>
                <TableHead className="text-right text-meta">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const canCancel =
                  isOwner && order.status !== "delivered" && order.status !== "cancelled";
                return (
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell className="row-py">
                      <Link href={`/orders/${order.id}`} className="block">
                        <p className="text-row-value font-semibold tabular-nums">#{order.orderNumber}</p>
                        <p className="text-caption text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="row-py">
                      <Link href={`/orders/${order.id}`} className="block min-w-0">
                        <p className="truncate text-row-title font-medium">{order.customerName}</p>
                        <p className="truncate text-meta text-muted-foreground">
                          {order.customerPhone ?? order.customerEmail ?? "—"}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="row-py">
                      <OrderSourceBadge source={order.source} />
                    </TableCell>
                    <TableCell className="row-py">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value tabular-nums text-muted-foreground">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {currency(order.total)}
                    </TableCell>
                    <TableCell className="row-py">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="row-py">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
                        <AdvanceOrderButton orderId={order.id} status={order.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
