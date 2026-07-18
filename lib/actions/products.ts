"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { suggestVariantSku } from "@/lib/sku";

export interface CreateProductResult {
  error?: string;
  success?: boolean;
  productId?: string;
}

interface VariantInput {
  label: string;
  sku: string | null;
  costPrice: number;
  salePrice: number;
  reorderPoint: number;
  openingStock: number;
}

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Creates a catalogue product together with its variants and, optionally, an
 * opening stock balance at one location. Variants are the sellable unit, so a
 * product always gets at least one: a single unnamed variant is stored as the
 * hidden "Default" (so pickers stay clean), while two or more become real named
 * options the whole app can sell, ship and count individually.
 */
export async function createProductAction(
  _prev: CreateProductResult,
  formData: FormData,
): Promise<CreateProductResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only owners can add products" };

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "").trim() || "pcs";
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "") || null;

  if (!name) return { error: "Enter a product name" };

  let variants: VariantInput[] = [];
  try {
    variants = JSON.parse(String(formData.get("variantsJson") ?? "[]"));
  } catch {
    return { error: "Could not read the variant list" };
  }
  variants = variants.filter((variant) => variant.salePrice > 0 || variant.costPrice > 0 || variant.label.trim());
  if (variants.length === 0) return { error: "Add at least one variant with a price" };

  const single = variants.length === 1;
  const base = variants[0];

  const { supabase } = await requireSupabaseContext();

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name,
      brand,
      category,
      unit,
      sku,
      reorder_point: base.reorderPoint,
      cost_price: base.costPrice,
      sale_price: base.salePrice,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: productError?.message ?? "Could not create the product" };
  }

  let openingTotal = 0;
  for (const [index, variant] of variants.entries()) {
    const variantName = single ? "Default" : variant.label.trim() || `Option ${index + 1}`;

    const { data: created, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        name: variantName,
        sku: single ? sku : variant.sku || suggestVariantSku(sku ?? "", variantName),
        cost_price: variant.costPrice,
        sale_price: variant.salePrice,
        reorder_point: variant.reorderPoint,
        is_default: single,
      })
      .select("id")
      .single();

    if (variantError || !created) {
      return { error: variantError?.message ?? "Could not create a variant" };
    }

    if (locationId && variant.openingStock > 0) {
      await supabase.from("inventory_stock").insert({
        product_id: product.id,
        variant_id: created.id,
        location_id: locationId,
        quantity: variant.openingStock,
      });

      await supabase.from("stock_movements").insert({
        product_id: product.id,
        variant_id: created.id,
        to_location_id: locationId,
        quantity: variant.openingStock,
        type: "receive",
        reference_type: "opening",
        note: "Opening stock",
        created_by: profile.id,
      });

      openingTotal += variant.openingStock;
    }
  }

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "product.create",
    entity_type: "product",
    entity_id: product.id,
    description:
      `Added ${name} (${variants.length} variant${variants.length > 1 ? "s" : ""})` +
      (openingTotal > 0 ? `, ${openingTotal} opening stock` : ""),
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true, productId: product.id };
}

interface EditVariantInput {
  id: string | null;
  label: string;
  costPrice: number;
  salePrice: number;
  reorderPoint: number;
  active: boolean;
  openingStock: number;
}

/**
 * Edits an existing product and its variants: updates product fields, edits
 * existing variants, archives ones the owner switches off (kept, not deleted,
 * so past sales/movements that reference them stay intact), and inserts any new
 * variants — with optional opening stock. `is_default` is recomputed so a
 * product that ends up with a single active variant keeps its picker hidden.
 */
export async function updateProductAction(
  _prev: CreateProductResult,
  formData: FormData,
): Promise<CreateProductResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only owners can edit products" };

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Missing product" };

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "").trim() || "pcs";
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "") || null;

  if (!name) return { error: "Enter a product name" };

  let variants: EditVariantInput[] = [];
  try {
    variants = JSON.parse(String(formData.get("variantsJson") ?? "[]"));
  } catch {
    return { error: "Could not read the variant list" };
  }
  if (variants.length === 0) return { error: "A product needs at least one variant" };
  if (!variants.some((variant) => variant.active)) {
    return { error: "Keep at least one active variant" };
  }

  const { supabase } = await requireSupabaseContext();

  const base = variants.find((variant) => variant.active) ?? variants[0];
  const { error: productError } = await supabase
    .from("products")
    .update({
      name,
      brand,
      category,
      unit,
      sku,
      reorder_point: base.reorderPoint,
      cost_price: base.costPrice,
      sale_price: base.salePrice,
    })
    .eq("id", productId);

  if (productError) return { error: productError.message };

  const activeIds: string[] = [];
  let addedStock = 0;

  for (const [index, variant] of variants.entries()) {
    if (variant.id) {
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          name: variant.label.trim() || "Default",
          cost_price: variant.costPrice,
          sale_price: variant.salePrice,
          reorder_point: variant.reorderPoint,
          active: variant.active,
        })
        .eq("id", variant.id)
        .eq("product_id", productId);

      if (updateError) return { error: updateError.message };
      if (variant.active) activeIds.push(variant.id);
      continue;
    }

    const variantName = variant.label.trim() || `Option ${index + 1}`;
    const { data: created, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name: variantName,
        sku: suggestVariantSku(sku ?? "", variantName),
        cost_price: variant.costPrice,
        sale_price: variant.salePrice,
        reorder_point: variant.reorderPoint,
        is_default: false,
      })
      .select("id")
      .single();

    if (variantError || !created) {
      return { error: variantError?.message ?? "Could not add a variant" };
    }
    activeIds.push(created.id);

    if (locationId && variant.openingStock > 0) {
      await supabase.from("inventory_stock").insert({
        product_id: productId,
        variant_id: created.id,
        location_id: locationId,
        quantity: variant.openingStock,
      });
      await supabase.from("stock_movements").insert({
        product_id: productId,
        variant_id: created.id,
        to_location_id: locationId,
        quantity: variant.openingStock,
        type: "receive",
        reference_type: "opening",
        note: "Opening stock",
        created_by: profile.id,
      });
      addedStock += variant.openingStock;
    }
  }

  // Keep the "single variant hides the picker" rule true after edits.
  await supabase.from("product_variants").update({ is_default: false }).eq("product_id", productId);
  if (activeIds.length === 1) {
    await supabase.from("product_variants").update({ is_default: true }).eq("id", activeIds[0]);
  }

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "product.update",
    entity_type: "product",
    entity_id: productId,
    description:
      `Edited ${name}` + (addedStock > 0 ? `, added ${addedStock} opening stock` : ""),
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true, productId };
}
