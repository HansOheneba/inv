"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import type { OrderStatus } from "@/lib/supabase/types";

export interface OrderActionResult {
  error?: string;
  success?: boolean;
}

interface OrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  specNote: string | null;
}

/**
 * The owner "locks in" an order taken over WhatsApp. Payment is handled
 * off-system, so this just captures the customer, delivery details and line
 * items — the moment it saves, it's live on the Ghana team's fulfilment board.
 */
export async function createOrderAction(
  _prev: OrderActionResult,
  formData: FormData,
): Promise<OrderActionResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only the owner can lock in orders" };

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim() || null;
  const mapsUrl = String(formData.get("mapsUrl") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discountInput = Number(formData.get("discount"));
  const discount = Number.isFinite(discountInput) && discountInput > 0 ? discountInput : 0;

  if (!customerName) return { error: "Enter the customer's name" };

  let items: OrderItemInput[] = [];
  try {
    items = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Could not read the item list" };
  }
  items = items.filter(
    (item) =>
      item.productId && item.variantId && Number.isFinite(item.quantity) && item.quantity > 0,
  );
  if (items.length === 0) return { error: "Add at least one product line" };

  const { supabase } = await requireSupabaseContext();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      maps_url: mapsUrl,
      status: "confirmed",
      notes,
      discount,
      created_by: profile.id,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) return { error: orderError?.message ?? "Could not save order" };

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.unitPrice || 0,
      spec_note: item.specNote?.trim() || null,
    })),
  );

  if (itemsError) return { error: itemsError.message };

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "order.create",
    entity_type: "order",
    entity_id: order.id,
    description: `Locked in order #${order.order_number} for ${customerName}`,
  });

  revalidatePath("/orders");
  revalidatePath("/");

  return { success: true };
}

const ADVANCE: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

/**
 * Turns a delivered order into a completed sale: records the sale + its items,
 * draws the goods down from wherever they're stocked, and logs the movements.
 * Called once, when an order transitions to "delivered".
 */
async function recordSaleFromOrder(
  supabase: Awaited<ReturnType<typeof requireSupabaseContext>>["supabase"],
  profileId: string,
  order: { id: string; customer_name: string; customer_phone: string | null; discount: number },
): Promise<void> {
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity, unit_price")
    .eq("order_id", order.id);

  if (!items || items.length === 0) return;

  const { data: whatsappChannel } = await supabase
    .from("sales_channels")
    .select("id")
    .eq("type", "whatsapp")
    .limit(1)
    .maybeSingle();

  const { data: primaryLocation } = await supabase
    .from("locations")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  // The discount the owner agreed at order time comes off the sale total, so
  // revenue reporting matches what the customer actually paid.
  const subtotal = items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);
  const total = Math.max(0, subtotal - Number(order.discount ?? 0));

  const { data: sale } = await supabase
    .from("sales")
    .insert({
      channel_id: whatsappChannel?.id ?? null,
      location_id: primaryLocation?.id ?? null,
      customer_name: order.customer_name,
      customer_contact: order.customer_phone,
      total_amount: total,
      status: "completed",
      created_by: profileId,
    })
    .select("id")
    .single();

  if (!sale) return;

  for (const item of items) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("cost_price")
      .eq("id", item.variant_id)
      .maybeSingle();

    await supabase.from("sale_items").insert({
      sale_id: sale.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      unit_cost_snapshot: Number(variant?.cost_price ?? 0),
    });

    // Draw down from the location that actually holds this variant's stock.
    const { data: stock } = await supabase
      .from("inventory_stock")
      .select("location_id, quantity")
      .eq("variant_id", item.variant_id)
      .order("quantity", { ascending: false })
      .limit(1)
      .maybeSingle();

    const locationId = stock?.location_id ?? primaryLocation?.id ?? null;
    if (!locationId) continue;

    // Floor at zero: the goods have physically left, so never block a real
    // delivery on a stock-count mismatch — just record the movement.
    const nextQuantity = Math.max(0, (stock?.quantity ?? 0) - item.quantity);

    await supabase.from("inventory_stock").upsert(
      {
        product_id: item.product_id,
        variant_id: item.variant_id,
        location_id: locationId,
        quantity: nextQuantity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "variant_id,location_id" },
    );

    await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      variant_id: item.variant_id,
      from_location_id: locationId,
      quantity: item.quantity,
      type: "sale",
      reference_type: "order",
      reference_id: order.id,
      created_by: profileId,
    });
  }
}

/**
 * Advances an order to its next fulfilment status. Dispatch requires the
 * rider's name and number; delivery records the sale and draws down stock.
 */
export async function advanceOrderAction(formData: FormData): Promise<OrderActionResult> {
  const profile = await getCurrentProfile();
  const orderId = String(formData.get("orderId") ?? "");
  const riderName = String(formData.get("riderName") ?? "").trim();
  const riderPhone = String(formData.get("riderPhone") ?? "").trim();

  if (!orderId) return { error: "Missing order" };

  const { supabase } = await requireSupabaseContext();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, customer_name, customer_phone, discount")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };

  const nextStatus = ADVANCE[order.status];
  if (!nextStatus) return { error: "This order is already closed" };

  const now = new Date().toISOString();

  if (nextStatus === "out_for_delivery") {
    if (!riderName || !riderPhone) {
      return { error: "Enter the rider's name and phone number" };
    }
    await supabase
      .from("orders")
      .update({
        status: nextStatus,
        rider_name: riderName,
        rider_phone: riderPhone,
        dispatched_at: now,
      })
      .eq("id", orderId);
  } else if (nextStatus === "delivered") {
    await recordSaleFromOrder(supabase, profile.id, order);
    await supabase
      .from("orders")
      .update({ status: nextStatus, delivered_at: now })
      .eq("id", orderId);
  } else {
    await supabase
      .from("orders")
      .update({ status: nextStatus, packed_at: now })
      .eq("id", orderId);
  }

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "order.advance",
    entity_type: "order",
    entity_id: orderId,
    description: `Moved order #${order.order_number} to ${nextStatus.replace(/_/g, " ")}`,
  });

  revalidatePath("/orders");
  revalidatePath("/inventory");
  revalidatePath("/sales");
  revalidatePath("/");

  return { success: true };
}

/** Owner-only: cancels an order that hasn't been delivered yet. */
export async function cancelOrderAction(formData: FormData): Promise<OrderActionResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only the owner can cancel orders" };

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Missing order" };

  const { supabase } = await requireSupabaseContext();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.status === "delivered") return { error: "Delivered orders can't be cancelled" };
  if (order.status === "cancelled") return { error: "This order is already cancelled" };

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "order.cancel",
    entity_type: "order",
    entity_id: orderId,
    description: `Cancelled order #${order.order_number}`,
  });

  revalidatePath("/orders");
  revalidatePath("/");

  return { success: true };
}
