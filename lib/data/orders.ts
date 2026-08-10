import { requireSupabaseContext } from "@/lib/supabase/context";
import { getVariantOptions, type VariantOption } from "@/lib/data/variants";
import type {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/supabase/types";

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
  customerEmail: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryRegion: string | null;
  mapsUrl: string | null;
  status: OrderStatus;
  source: OrderSource;
  notes: string | null;
  discount: number;
  shippingFee: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  externalId: string | null;
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
  customer_email: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_region: string | null;
  maps_url: string | null;
  status: OrderStatus;
  source: OrderSource;
  notes: string | null;
  discount: number;
  shipping_fee: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  external_id: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  created_at: string;
  packed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  order_items: OrderItemRow[];
}

const ORDER_SELECT =
  "id, order_number, customer_name, customer_phone, customer_email, delivery_address, delivery_city, delivery_region, maps_url, status, source, notes, discount, shipping_fee, payment_status, payment_method, payment_reference, external_id, rider_name, rider_phone, created_at, packed_at, dispatched_at, delivered_at, order_items(quantity, unit_price, spec_note, product:product_id(name), variant:variant_id(name, is_default))";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapOrder(row: OrderRow): OrderListItem {
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
  const shippingFee = Number(row.shipping_fee ?? 0);

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    deliveryAddress: row.delivery_address,
    deliveryCity: row.delivery_city,
    deliveryRegion: row.delivery_region,
    mapsUrl: row.maps_url,
    status: row.status,
    source: row.source ?? "whatsapp",
    notes: row.notes,
    discount,
    shippingFee,
    paymentStatus: row.payment_status ?? "unpaid",
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    externalId: row.external_id,
    subtotal,
    total: Math.max(0, subtotal - discount + shippingFee),
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
    itemCount: items.length,
    items,
    createdAt: row.created_at,
    packedAt: row.packed_at,
    dispatchedAt: row.dispatched_at,
    deliveredAt: row.delivered_at,
  };
}

export async function getOrders(limit = 100): Promise<OrderListItem[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<OrderRow[]>();

  return (data ?? []).map(mapOrder);
}

export async function getOrderById(id: string): Promise<OrderListItem | null> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .returns<OrderRow[]>()
    .maybeSingle();

  if (error || !data) return null;
  return mapOrder(data);
}

export interface OrderFormOptions {
  variants: VariantOption[];
}

export async function getOrderFormOptions(): Promise<OrderFormOptions> {
  // Variant-level stock, so the owner sees how much of each size/colour is left
  // as she adds a line to the order.
  return { variants: await getVariantOptions() };
}
