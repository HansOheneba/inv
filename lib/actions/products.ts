"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { suggestVariantSku } from "@/lib/sku";
import { externalId, slugify } from "@/lib/storefront/utils";
import {
  buildVariantAttributes,
  variantNameFromAttributes,
} from "@/lib/inventory/variant-attributes";
import { resolveVariantPricing, type DiscountType } from "@/lib/inventory/pricing";

export interface CreateProductResult {
  error?: string;
  success?: boolean;
  productId?: string;
}

interface VariantInput {
  label: string;
  sku: string | null;
  color: string;
  size: string;
  weight: string;
  volume: string;
  imageUrl: string;
  listPrice: number;
  discountType: DiscountType | "";
  discountValue: number;
  costPrice: number;
  reorderPoint: number;
  openingStock: number;
}

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

async function uniqueProductSlug(
  supabase: Awaited<ReturnType<typeof requireSupabaseContext>>["supabase"],
  name: string,
): Promise<string> {
  let base = slugify(name);
  if (!base) base = externalId("product");
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function variantDbPricing(input: {
  listPrice: number;
  discountType: DiscountType | "";
  discountValue: number;
}) {
  const pricing = resolveVariantPricing(input);
  return {
    sale_price: pricing.salePrice,
    compare_at_price: pricing.compareAtPrice,
    discount_type: pricing.discountType,
    discount_value: pricing.discountType ? pricing.discountValue : null,
  };
}

async function syncProductCatalogFromVariants(
  supabase: Awaited<ReturnType<typeof requireSupabaseContext>>["supabase"],
  productId: string,
) {
  const { data: variants } = await supabase
    .from("product_variants")
    .select("sale_price, compare_at_price, cost_price, reorder_point, image_urls, is_default")
    .eq("product_id", productId)
    .eq("active", true)
    .order("is_default", { ascending: false });

  if (!variants?.length) return;

  const salePrices = variants.map((variant) => Number(variant.sale_price));
  const comparePrices = variants
    .map((variant) => variant.compare_at_price)
    .filter((value): value is number => value != null)
    .map(Number);
  const lead = variants[0];

  const imageUrls: string[] = [];
  for (const variant of variants) {
    for (const url of variant.image_urls ?? []) {
      if (url && !imageUrls.includes(url)) imageUrls.push(url);
    }
  }

  await supabase
    .from("products")
    .update({
      sale_price: Math.max(...salePrices),
      compare_at_price: comparePrices.length ? Math.max(...comparePrices) : null,
      cost_price: lead.cost_price,
      reorder_point: lead.reorder_point,
      image_urls: imageUrls,
      image_url: imageUrls[0] ?? null,
    })
    .eq("id", productId);
}

function validateVariantImages(
  variants: Array<{ active?: boolean; imageUrl: string }>,
): string | null {
  const active = variants.filter((variant) => variant.active !== false);
  if (active.length === 0) return "Add at least one active variant";
  if (active.some((variant) => !variant.imageUrl.trim())) {
    return "Upload a photo for each active variant. Storefront images come from variants only.";
  }
  return null;
}

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
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "pcs";
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "") || null;

  if (!name) return { error: "Enter a product name" };
  if (!departmentId) return { error: "Select a department" };

  let variants: VariantInput[] = [];
  try {
    variants = JSON.parse(String(formData.get("variantsJson") ?? "[]"));
  } catch {
    return { error: "Could not read the variant list" };
  }
  variants = variants.filter(
    (variant) => variant.listPrice > 0 || variant.costPrice > 0 || variant.label.trim(),
  );
  if (variants.length === 0) return { error: "Add at least one variant with a price" };

  const imageError = validateVariantImages(variants);
  if (imageError) return { error: imageError };

  const single = variants.length === 1;
  const basePricing = resolveVariantPricing(variants[0]);

  const { supabase } = await requireSupabaseContext();
  const slug = await uniqueProductSlug(supabase, name);
  const productExternalId = externalId("p");

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name,
      brand,
      department_id: departmentId,
      slug,
      external_id: productExternalId,
      catalog_created_at: new Date().toISOString().slice(0, 10),
      unit,
      sku,
      reorder_point: variants[0].reorderPoint,
      cost_price: variants[0].costPrice,
      sale_price: basePricing.salePrice,
      compare_at_price: basePricing.compareAtPrice,
      image_urls: [],
      image_url: null,
      in_stock: false,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: productError?.message ?? "Could not create the product" };
  }

  let openingTotal = 0;
  for (const [index, variant] of variants.entries()) {
    const attributes = buildVariantAttributes({
      color: variant.color,
      size: variant.size,
      weight: variant.weight,
      volume: variant.volume,
    });
    const variantName = single
      ? "Default"
      : variantNameFromAttributes(attributes, variant.label.trim() || `Option ${index + 1}`);
    const pricing = variantDbPricing(variant);

    const { data: created, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        name: variantName,
        external_id: externalId("v"),
        sku: single ? sku : variant.sku || suggestVariantSku(sku ?? "", variantName),
        attributes,
        image_urls: variant.imageUrl ? [variant.imageUrl] : null,
        cost_price: variant.costPrice,
        ...pricing,
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

  await syncProductCatalogFromVariants(supabase, product.id);

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
  color: string;
  size: string;
  weight: string;
  volume: string;
  imageUrl: string;
  listPrice: number;
  discountType: DiscountType | "";
  discountValue: number;
  costPrice: number;
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
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "pcs";
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "") || null;

  if (!name) return { error: "Enter a product name" };
  if (!departmentId) return { error: "Select a department" };

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

  const imageError = validateVariantImages(variants);
  if (imageError) return { error: imageError };

  const { supabase } = await requireSupabaseContext();

  const { error: productError } = await supabase
    .from("products")
    .update({
      name,
      brand,
      department_id: departmentId,
      unit,
      sku,
    })
    .eq("id", productId);

  if (productError) return { error: productError.message };

  const activeIds: string[] = [];
  let addedStock = 0;

  for (const [index, variant] of variants.entries()) {
    const attributes = buildVariantAttributes({
      color: variant.color,
      size: variant.size,
      weight: variant.weight,
      volume: variant.volume,
    });
    const variantName = variantNameFromAttributes(
      attributes,
      variant.label.trim() || `Option ${index + 1}`,
    );
    const pricing = variantDbPricing(variant);

    if (variant.id) {
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          name: variantName,
          attributes,
          image_urls: variant.imageUrl ? [variant.imageUrl] : null,
          cost_price: variant.costPrice,
          ...pricing,
          reorder_point: variant.reorderPoint,
          active: variant.active,
        })
        .eq("id", variant.id)
        .eq("product_id", productId);

      if (updateError) return { error: updateError.message };
      if (variant.active) activeIds.push(variant.id);
      continue;
    }

    const { data: created, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name: variantName,
        external_id: externalId("v"),
        sku: suggestVariantSku(sku ?? "", variantName),
        attributes,
        image_urls: variant.imageUrl ? [variant.imageUrl] : null,
        cost_price: variant.costPrice,
        ...pricing,
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

  await syncProductCatalogFromVariants(supabase, productId);

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
