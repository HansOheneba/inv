import Link from "next/link";
import { ArrowLeft, Bike, Map, MapPin, Mail, Phone } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderSourceBadge } from "@/components/orders/order-source-badge";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { AdvanceOrderButton } from "@/components/orders/advance-order-button";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderListItem } from "@/lib/data/orders";
import type { PaymentMethod } from "@/lib/supabase/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    value,
  );

const METHOD_LABEL: Record<PaymentMethod, string> = {
  momo: "Mobile Money",
  card: "Card",
  cash: "Cash",
  bank_transfer: "Bank transfer",
};

function formatWhen(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderDetail({
  order,
  isOwner,
}: {
  order: OrderListItem;
  isOwner: boolean;
}) {
  const canCancel = isOwner && order.status !== "delivered" && order.status !== "cancelled";
  const cityLine = [order.deliveryCity, order.deliveryRegion].filter(Boolean).join(", ");

  const timeline = [
    { label: "Created", at: order.createdAt },
    { label: "Packed", at: order.packedAt },
    { label: "Dispatched", at: order.dispatchedAt },
    { label: "Delivered", at: order.deliveredAt },
  ].filter((step) => step.at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/orders"
            className="mb-2 inline-flex items-center gap-1 text-meta text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Orders
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page-title font-semibold tabular-nums">#{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
            <OrderSourceBadge source={order.source} />
            {order.externalId ? (
              <span className="text-meta text-muted-foreground">{order.externalId}</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-meta text-muted-foreground">{order.customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-row-value font-semibold tabular-nums">{currency(order.total)}</p>
          <div className="flex items-center gap-1">
            {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
            <AdvanceOrderButton orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="rounded-xl border p-5">
          <p className="mb-2 text-section-title">Customer</p>
          <p className="text-row-title font-medium">{order.customerName}</p>
          {order.customerPhone ? (
            <p className="mt-1 flex items-center gap-1 text-meta text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              {order.customerPhone}
            </p>
          ) : null}
          {order.customerEmail ? (
            <p className="mt-1 flex items-center gap-1 text-meta text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {order.customerEmail}
            </p>
          ) : null}
          {order.notes ? <p className="mt-2 text-meta text-muted-foreground">{order.notes}</p> : null}
        </section>

        <section className="rounded-xl border p-5">
          <p className="mb-2 text-section-title">Delivery</p>
          {order.deliveryAddress ? (
            <p className="flex items-start gap-1 text-meta">
              <MapPin className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
              <span>
                {order.deliveryAddress}
                {cityLine ? <span className="block text-muted-foreground">{cityLine}</span> : null}
              </span>
            </p>
          ) : (
            <p className="text-meta text-muted-foreground">No address</p>
          )}
          {order.mapsUrl ? (
            <a
              href={order.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-meta text-primary underline-offset-2 hover:underline"
            >
              <Map className="size-3" />
              Open in Maps
            </a>
          ) : null}
          {order.riderName ? (
            <p className="mt-2 flex items-center gap-1 text-meta">
              <Bike className="size-3 shrink-0 text-muted-foreground" />
              {order.riderName}
              {order.riderPhone ? (
                <span className="text-muted-foreground"> · {order.riderPhone}</span>
              ) : null}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border p-5">
          <p className="mb-2 text-section-title">Payment</p>
          <div className="mb-2">
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <dl className="space-y-1 text-meta">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Method</dt>
              <dd>{order.paymentMethod ? METHOD_LABEL[order.paymentMethod] : "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="truncate tabular-nums">{order.paymentReference ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{currency(order.shippingFee)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between gap-2 text-status-out">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{currency(order.discount)}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b px-5 py-3.5">
          <p className="text-section-title">Line items</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-meta">Product</TableHead>
              <TableHead className="text-right text-meta">Qty</TableHead>
              <TableHead className="text-right text-meta">Unit</TableHead>
              <TableHead className="text-right text-meta">Line</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="row-py">
                  <p className="text-row-title font-medium">{item.productName}</p>
                  <p className="text-meta text-muted-foreground">
                    {[item.variantName, item.specNote].filter(Boolean).join(" · ") || "—"}
                  </p>
                </TableCell>
                <TableCell className="row-py text-right text-row-value tabular-nums">
                  {item.quantity}
                </TableCell>
                <TableCell className="row-py text-right text-row-value tabular-nums text-muted-foreground">
                  {currency(item.unitPrice)}
                </TableCell>
                <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                  {currency(item.quantity * item.unitPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="space-y-1.5 border-t px-5 py-3.5 text-meta">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{currency(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between gap-2 text-status-out">
              <span>Discount</span>
              <span className="tabular-nums">−{currency(order.discount)}</span>
            </div>
          ) : null}
          {order.shippingFee > 0 ? (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Shipping</span>
              <span className="tabular-nums">{currency(order.shippingFee)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-2 text-row-value font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{currency(order.total)}</span>
          </div>
        </div>
      </section>

      {timeline.length > 0 ? (
        <section className="rounded-xl border p-5">
          <p className="mb-2 text-section-title">Timeline</p>
          <ul className="space-y-1">
            {timeline.map((step) => (
              <li key={step.label} className="flex justify-between gap-3 text-meta">
                <span className="text-muted-foreground">{step.label}</span>
                <span className="tabular-nums">{formatWhen(step.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
