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
  const variantId = String(formData.get("variantId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || !variantId || !locationId) return { error: "Missing variant or location" };
  if (!Number.isFinite(delta) || delta === 0) return { error: "Enter a non-zero quantity" };

  const { supabase } = await requireSupabaseContext();

  const { data: existing } = await supabase
    .from("inventory_stock")
    .select("quantity")
    .eq("variant_id", variantId)
    .eq("location_id", locationId)
    .maybeSingle();

  const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);

  const { error: upsertError } = await supabase
    .from("inventory_stock")
    .upsert(
      {
        product_id: productId,
        variant_id: variantId,
        location_id: locationId,
        quantity: nextQuantity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "variant_id,location_id" },
    );

  if (upsertError) return { error: upsertError.message };

  const { error: movementError } = await supabase.from("stock_movements").insert({
    product_id: productId,
    variant_id: variantId,
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
