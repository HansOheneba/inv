import { requireSupabaseContext } from "@/lib/supabase/context";

/**
 * A single sellable/receivable unit for the order, sale and shipment pickers.
 * The label collapses to just the product name for options-less products (whose
 * only variant is the auto-created "Default"), and reads "Product · Variant"
 * otherwise — so staff never see a noisy "… · Default" everywhere.
 */
export interface VariantOption {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  label: string;
  isDefault: boolean;
  unit: string;
  salePrice: number;
  costPrice: number;
  stock: number;
}

export function variantLabel(productName: string, variantName: string, isDefault: boolean): string {
  return isDefault ? productName : `${productName} · ${variantName}`;
}

/**
 * Every active variant with its stock totalled across locations, ready to drop
 * into a picker. Sorted by product then variant so related variants sit
 * together. `costPrice` is only meaningful to owners; callers that expose it to
 * employees should zero it out.
 */
export async function getVariantOptions(): Promise<VariantOption[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("variant_stock_overview")
    .select(
      "variant_id, product_id, product_name, variant_name, is_default, unit, sale_price, cost_price, total_stock, active",
    )
    .eq("active", true)
    .order("product_name")
    .order("variant_name");

  return (data ?? []).map((row) => ({
    variantId: row.variant_id,
    productId: row.product_id,
    productName: row.product_name,
    variantName: row.variant_name,
    label: variantLabel(row.product_name, row.variant_name, row.is_default),
    isDefault: row.is_default,
    unit: row.unit,
    salePrice: Number(row.sale_price),
    costPrice: Number(row.cost_price),
    stock: row.total_stock,
  }));
}
