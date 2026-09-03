import { getCatalogClient } from "@/lib/catalog/client";
import { createPaymentReference, initiateReceiveMoney } from "@/lib/hubtel/payments";
import { computeShipping, normalizePhone, trackingNumber } from "@/lib/storefront/utils";
import { mapAdminStatus, type CreateOrderInput, type CreateOrderResult, type StorefrontOrder } from "@/lib/storefront/types";
import { upsertCustomerByPhone } from "@/lib/storefront/session";

interface OrderRow {
  id: string;
  order_number: number;
  tracking_number: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_region: string | null;
  status: string;
  shipping_fee: number;
  subtotal: number | null;
  total: number | null;
  payment_reference: string | null;
  rider_name: string | null;
  delivery_date: string | null;
  created_at: string;
  order_items: OrderItemRow[];
}

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  product_external_id: string | null;
  product_slug: string | null;
  product_name: string | null;
  image_url: string | null;
  line_attributes: Record<string, string> | null;
  spec_note: string | null;
  product: { external_id: string | null; slug: string | null; name: string; image_urls: string[] | null } | { external_id: string | null; slug: string | null; name: string; image_urls: string[] | null }[] | null;
}

const ORDER_SELECT = `
  id,
  order_number,
  tracking_number,
  customer_name,
  customer_phone,
  customer_email,
  delivery_address,
  delivery_city,
  delivery_region,
  status,
  shipping_fee,
  subtotal,
  total,
  payment_reference,
  rider_name,
  delivery_date,
  created_at,
  order_items (
    quantity,
    unit_price,
    product_external_id,
    product_slug,
    product_name,
    image_url,
    line_attributes,
    spec_note,
    product:product_id ( external_id, slug, name, image_urls )
  )
`;

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapOrderRow(row: OrderRow): StorefrontOrder {
  const lines = (row.order_items ?? []).map((item) => {
    const product = first(item.product);
    const attributes = item.line_attributes ?? {};
    return {
      productId: item.product_external_id ?? product?.external_id ?? "unknown",
      slug: item.product_slug ?? product?.slug ?? "",
      name: item.product_name ?? product?.name ?? "Item",
      imageUrl:
        item.image_url ??
        product?.image_urls?.[0] ??
        "/images/products/placeholder.jpg",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      attributes,
    };
  });

  const subtotal =
    row.subtotal != null
      ? Number(row.subtotal)
      : lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const shipping = Number(row.shipping_fee ?? 0);
  const total = row.total != null ? Number(row.total) : subtotal + shipping;
  const placedAt = row.created_at;
  const deliveryDate = row.delivery_date ?? placedAt.slice(0, 10);

  const order: StorefrontOrder = {
    id: String(row.order_number),
    placedAt,
    status: mapAdminStatus(row.status),
    deliveryDate,
    address: {
      name: row.customer_name,
      line: row.delivery_address ?? "",
      city: row.delivery_city ?? undefined,
      region: row.delivery_region ?? "",
    },
    shipping,
    subtotal,
    total,
    lines,
  };

  if (row.tracking_number) {
    order.trackingNumber = row.tracking_number;
    order.invoiceNumber = row.tracking_number;
  }
  if (row.payment_reference) order.paymentReference = row.payment_reference;
  if (row.rider_name) order.rider = { name: row.rider_name };

  return order;
}

export async function getOrderByTrackingNumber(value: string): Promise<StorefrontOrder | null> {
  const supabase = getCatalogClient();
  const normalized = value.trim().toUpperCase();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("tracking_number", normalized)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapOrderRow(data as unknown as OrderRow);
}

export async function getOrderByPublicId(id: string): Promise<StorefrontOrder | null> {
  const orderNumber = Number(id);
  if (!Number.isFinite(orderNumber)) return null;

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapOrderRow(data as unknown as OrderRow);
}

export async function listCustomerOrders(customerUuid: string): Promise<StorefrontOrder[]> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerUuid)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapOrderRow(row as unknown as OrderRow));
}

interface ResolvedLine {
  productUuid: string;
  variantUuid: string;
  unitPrice: number;
  productExternalId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  variantExternalId: string | null;
  attributes: Record<string, string>;
  quantity: number;
}

async function resolveLine(line: CreateOrderInput["lines"][number]): Promise<ResolvedLine> {
  const supabase = getCatalogClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, external_id, slug, name, image_urls, sale_price, in_stock")
    .eq("external_id", line.productId)
    .maybeSingle();

  if (!product || !product.in_stock) {
    throw new Error(`${line.name} is unavailable`);
  }

  let variantUuid: string;
  let unitPrice: number;
  let variantExternalId: string | null = null;
  let attributes = line.attributes ?? {};

  if (line.variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, external_id, sale_price, attributes")
      .eq("external_id", line.variantId)
      .eq("product_id", product.id)
      .eq("active", true)
      .maybeSingle();

    if (!variant) throw new Error(`Selected option for ${line.name} is unavailable`);

    const { data: stockRows } = await supabase
      .from("inventory_stock")
      .select("quantity")
      .eq("variant_id", variant.id);
    const stock = (stockRows ?? []).reduce((sum, row) => sum + row.quantity, 0);
    if (stock < line.quantity) throw new Error(`${line.name} does not have enough stock`);

    variantUuid = variant.id;
    unitPrice = Number(variant.sale_price);
    variantExternalId = variant.external_id;
    attributes = (variant.attributes as Record<string, string>) ?? attributes;
  } else {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, external_id, sale_price, attributes, is_default")
      .eq("product_id", product.id)
      .eq("active", true)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!variant) throw new Error(`${line.name} is unavailable`);

    const { data: stockRows } = await supabase
      .from("inventory_stock")
      .select("quantity")
      .eq("variant_id", variant.id);
    const stock = (stockRows ?? []).reduce((sum, row) => sum + row.quantity, 0);
    if (stock < line.quantity) throw new Error(`${line.name} does not have enough stock`);

    variantUuid = variant.id;
    unitPrice = Number(variant.sale_price);
    variantExternalId = variant.external_id;
    attributes = (variant.attributes as Record<string, string>) ?? attributes;
  }

  return {
    productUuid: product.id,
    variantUuid,
    unitPrice,
    productExternalId: product.external_id!,
    productSlug: product.slug ?? line.slug,
    productName: product.name,
    imageUrl: product.image_urls?.[0] ?? line.imageUrl,
    variantExternalId,
    attributes,
    quantity: line.quantity,
  };
}

export async function createStorefrontOrder(
  input: CreateOrderInput,
  customerUuid?: string | null,
): Promise<CreateOrderResult> {
  if (!input.lines.length) throw new Error("Add at least one item");

  const resolved = await Promise.all(input.lines.map(resolveLine));
  const computedSubtotal = resolved.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const computedShipping = computeShipping(computedSubtotal);
  const computedTotal = computedSubtotal + computedShipping;

  if (Math.round(computedSubtotal) !== Math.round(input.subtotal)) {
    throw new Error("Order subtotal changed — refresh and try again");
  }
  if (Math.round(computedShipping) !== Math.round(input.shipping)) {
    throw new Error("Shipping cost changed — refresh and try again");
  }
  if (Math.round(computedTotal) !== Math.round(input.total)) {
    throw new Error("Order total changed — refresh and try again");
  }

  const phone = normalizePhone(input.customer.phone);
  let linkedCustomerId = customerUuid ?? null;

  if (!linkedCustomerId) {
    const customer = await upsertCustomerByPhone({
      phone,
      name: input.customer.name,
      email: input.customer.email,
    });
    linkedCustomerId = customer.id;
  }

  const paymentReference = createPaymentReference();
  const supabase = getCatalogClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: linkedCustomerId,
      customer_name: input.customer.name,
      customer_phone: phone,
      customer_email: input.customer.email,
      delivery_address: input.customer.address,
      delivery_city: input.customer.city,
      delivery_region: input.customer.region,
      maps_url: input.customer.mapsUrl ?? null,
      notes: input.customer.notes ?? null,
      status: "confirmed",
      source: "website",
      shipping_fee: computedShipping,
      subtotal: computedSubtotal,
      total: computedTotal,
      payment_status: "unpaid",
      payment_method: "momo",
      payment_reference: paymentReference,
      delivery_date: new Date().toISOString().slice(0, 10),
    })
    .select("id, order_number, tracking_number")
    .single();

  if (orderError || !order) throw orderError ?? new Error("Could not create order");

  const itemRows = resolved.map((line) => ({
    order_id: order.id,
    product_id: line.productUuid,
    variant_id: line.variantUuid,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    product_external_id: line.productExternalId,
    product_slug: line.productSlug,
    product_name: line.productName,
    image_url: line.imageUrl,
    variant_external_id: line.variantExternalId,
    line_attributes: line.attributes,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) throw itemsError;

  const tracking = order.tracking_number ?? trackingNumber(order.order_number);

  let paymentStatus: CreateOrderResult["paymentStatus"] = "pending";
  let paymentMessage = "Approve the MoMo prompt on your phone to complete payment.";

  try {
    const payment = await initiateReceiveMoney({
      clientReference: paymentReference,
      amount: computedTotal,
      customerName: input.customer.name,
      customerPhone: phone,
      customerEmail: input.customer.email,
      description: `Raj Kollections order ${tracking}`,
    });

    paymentMessage = payment.message;

    if (payment.status === "demo") {
      paymentStatus = "demo";
    } else if (payment.responseCode === "0000") {
      paymentStatus = "paid";
      await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", order.id);
    }
  } catch (paymentError) {
    console.error("[orders] Hubtel payment initiation failed:", paymentError);
    paymentMessage =
      paymentError instanceof Error
        ? paymentError.message
        : "Order saved but payment could not be started. Contact support with your tracking number.";
  }

  return {
    reference: paymentReference,
    orderId: String(order.order_number),
    trackingNumber: tracking,
    paymentReference,
    paymentStatus,
    paymentMessage,
  };
}
