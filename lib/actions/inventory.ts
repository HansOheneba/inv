"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getProductDetail } from "@/lib/data/inventory";

export async function getProductDetailAction(productId: string) {
  const profile = await getCurrentProfile();
  return getProductDetail(productId, { includeCosts: isOwner(profile) });
}

export interface AdjustStockResult {
  error?: string;
  success?: boolean;
}

/**
 * Manual stock adjustment (count correction, damage, etc). Positive delta
 * adds stock, negative delta removes it. Every change is written to
 * stock_movements so it stays auditable.
 */
export async function adjustStockAction(
  _prev: AdjustStockResult,
  formData: FormData,
): Promise<AdjustStockResult> {
  const profile = await getCurrentProfile();
  const productId = String(formData.get("productId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || !locationId) return { error: "Missing product or location" };
  if (!Number.isFinite(delta) || delta === 0) return { error: "Enter a non-zero quantity" };

  const { supabase } = await requireSupabaseContext();

  const { data: existing } = await supabase
    .from("inventory_stock")
    .select("quantity")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);

  const { error: upsertError } = await supabase
    .from("inventory_stock")
    .upsert(
      { product_id: productId, location_id: locationId, quantity: nextQuantity, updated_at: new Date().toISOString() },
      { onConflict: "product_id,location_id" },
    );

  if (upsertError) return { error: upsertError.message };

  const { error: movementError } = await supabase.from("stock_movements").insert({
    product_id: productId,
    from_location_id: delta < 0 ? locationId : null,
    to_location_id: delta > 0 ? locationId : null,
    quantity: Math.abs(delta),
    type: "adjustment",
    note,
    created_by: profile.id,
  });

  if (movementError) return { error: movementError.message };

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "stock.adjust",
    entity_type: "product",
    entity_id: productId,
    description: `${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} unit(s)${note ? ` — ${note}` : ""}`,
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true };
}

export interface TransferStockResult {
  error?: string;
  success?: boolean;
}

export async function transferStockAction(
  _prev: TransferStockResult,
  formData: FormData,
): Promise<TransferStockResult> {
  const profile = await getCurrentProfile();
  const productId = String(formData.get("productId") ?? "");
  const fromLocationId = String(formData.get("fromLocationId") ?? "");
  const toLocationId = String(formData.get("toLocationId") ?? "");
  const quantity = Number(formData.get("quantity"));

  if (!productId || !fromLocationId || !toLocationId) {
    return { error: "Missing product or locations" };
  }
  if (fromLocationId === toLocationId) return { error: "Pick two different locations" };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Enter a quantity to move" };

  const { supabase } = await requireSupabaseContext();

  const { data: source } = await supabase
    .from("inventory_stock")
    .select("quantity")
    .eq("product_id", productId)
    .eq("location_id", fromLocationId)
    .maybeSingle();

  if (!source || source.quantity < quantity) {
    return { error: "Not enough stock at the source location" };
  }

  const { data: destination } = await supabase
    .from("inventory_stock")
    .select("quantity")
    .eq("product_id", productId)
    .eq("location_id", toLocationId)
    .maybeSingle();

  const { error: fromError } = await supabase
    .from("inventory_stock")
    .update({ quantity: source.quantity - quantity, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .eq("location_id", fromLocationId);

  if (fromError) return { error: fromError.message };

  const { error: toError } = await supabase
    .from("inventory_stock")
    .upsert(
      {
        product_id: productId,
        location_id: toLocationId,
        quantity: (destination?.quantity ?? 0) + quantity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id,location_id" },
    );

  if (toError) return { error: toError.message };

  await supabase.from("stock_movements").insert({
    product_id: productId,
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    quantity,
    type: "transfer",
    created_by: profile.id,
  });

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "stock.transfer",
    entity_type: "product",
    entity_id: productId,
    description: `Transferred ${quantity} unit(s) between locations`,
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true };
}
