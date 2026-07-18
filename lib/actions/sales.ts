"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile } from "@/lib/auth";

export interface RecordSaleResult {
  error?: string;
  success?: boolean;
}

export async function recordSaleAction(
  _prev: RecordSaleResult,
  formData: FormData,
): Promise<RecordSaleResult> {
  const profile = await getCurrentProfile();
  const channelId = String(formData.get("channelId") ?? "") || null;
  const locationId = String(formData.get("locationId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity"));
  const unitPrice = Number(formData.get("unitPrice"));
  const customerName = String(formData.get("customerName") ?? "").trim() || null;

  if (!locationId || !variantId || !productId) return { error: "Choose a location and product" };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Enter a valid quantity" };
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: "Enter a valid price" };

  const { supabase } = await requireSupabaseContext();

  const { data: stock } = await supabase
    .from("inventory_stock")
    .select("quantity")
    .eq("variant_id", variantId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (!stock || stock.quantity < quantity) {
    return { error: "Not enough stock at that location" };
  }

  const [{ data: variant }, { data: product }] = await Promise.all([
    supabase.from("product_variants").select("cost_price, name, is_default").eq("id", variantId).single(),
    supabase.from("products").select("name").eq("id", productId).single(),
  ]);

  const productName = product?.name ?? "item";
  const label = variant && !variant.is_default ? `${productName} (${variant.name})` : productName;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      channel_id: channelId,
      location_id: locationId,
      customer_name: customerName,
      total_amount: quantity * unitPrice,
      status: "completed",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) return { error: saleError?.message ?? "Could not record sale" };

  const { error: itemError } = await supabase.from("sale_items").insert({
    sale_id: sale.id,
    product_id: productId,
    variant_id: variantId,
    quantity,
    unit_price: unitPrice,
    unit_cost_snapshot: variant?.cost_price ?? 0,
  });

  if (itemError) return { error: itemError.message };

  await supabase
    .from("inventory_stock")
    .update({ quantity: stock.quantity - quantity, updated_at: new Date().toISOString() })
    .eq("variant_id", variantId)
    .eq("location_id", locationId);

  await supabase.from("stock_movements").insert({
    product_id: productId,
    variant_id: variantId,
    from_location_id: locationId,
    quantity,
    type: "sale",
    reference_type: "sale",
    reference_id: sale.id,
    created_by: profile.id,
  });

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "sale.create",
    entity_type: "sale",
    entity_id: sale.id,
    description: `Sold ${quantity} × ${label}`,
  });

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true };
}
