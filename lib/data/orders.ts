import { requireSupabaseContext } from "@/lib/supabase/context";
import { getVariantOptions, type VariantOption } from "@/lib/data/variants";
import type { OrderStatus } from "@/lib/supabase/types";

export interface OrderLineItem {
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  specNote: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  mapsUrl: string | null;
  status: OrderStatus;
  notes: string | null;
  discount: number;
  subtotal: number;
  total: number;
  riderName: string | null;
  riderPhone: string | null;
  itemCount: number;
  items: OrderLineItem[];
  createdAt: string;
  packedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
}

interface NamedRef {
  name: string;
  is_default?: boolean;
}

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  spec_note: string | null;
  product: NamedRef | NamedRef[] | null;
  variant: NamedRef | NamedRef[] | null;
}

interface OrderRow {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string | null;
  delivery_address: string | null;
  maps_url: string | null;
  status: OrderStatus;
  notes: string | null;
  discount: number;
  rider_name: string | null;
  rider_phone: string | null;
  created_at: string;
  packed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  order_items: OrderItemRow[];
}

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getOrders(limit = 100): Promise<OrderListItem[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, delivery_address, maps_url, status, notes, discount, rider_name, rider_phone, created_at, packed_at, dispatched_at, delivered_at, order_items(quantity, unit_price, spec_note, product:product_id(name), variant:variant_id(name, is_default))",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<OrderRow[]>();

  return (data ?? []).map((row) => {
    const items: OrderLineItem[] = (row.order_items ?? []).map((item) => {
      const product = first(item.product);
      const variant = first(item.variant);
      return {
        productName: product?.name ?? "Unknown item",
        variantName: variant && !variant.is_default ? variant.name : null,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        specNote: item.spec_note,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = Number(row.discount ?? 0);

    return {
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      deliveryAddress: row.delivery_address,
      mapsUrl: row.maps_url,
      status: row.status,
      notes: row.notes,
      discount,
      subtotal,
      total: Math.max(0, subtotal - discount),
      riderName: row.rider_name,
      riderPhone: row.rider_phone,
      itemCount: items.length,
      items,
      createdAt: row.created_at,
      packedAt: row.packed_at,
      dispatchedAt: row.dispatched_at,
      deliveredAt: row.delivered_at,
    };
  });
}

export interface OrderFormOptions {
  variants: VariantOption[];
}

export async function getOrderFormOptions(): Promise<OrderFormOptions> {
  // Variant-level stock, so the owner sees how much of each size/colour is left
  // as she adds a line to the order.
  return { variants: await getVariantOptions() };
}
