import { requireSupabaseContext } from "@/lib/supabase/context";

export type StockStatus = "available" | "low" | "out";

export interface InventoryItem {
  productId: string;
  name: string;
  sku: string | null;
  category: string | null;
  brand: string | null;
  unit: string;
  totalStock: number;
  reorderPoint: number;
  primaryLocation: string | null;
  locationCount: number;
  variantCount: number;
  status: StockStatus;
  costPrice: number;
  salePrice: number;
}

export function stockStatus(totalStock: number, reorderPoint: number): StockStatus {
  if (totalStock <= 0) return "out";
  if (totalStock <= reorderPoint) return "low";
  return "available";
}

/**
 * One row per product with stock totalled across every location — powers
 * the dense inventory list. `includeCosts` is false for employee views so
 * cost_price never leaves the server for accounts that shouldn't see it.
 */
export async function getInventoryOverview(options?: {
  includeCosts?: boolean;
}): Promise<InventoryItem[]> {
  const { supabase } = await requireSupabaseContext();
  const { data, error } = await supabase
    .from("product_stock_overview")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    unit: row.unit,
    totalStock: row.total_stock,
    reorderPoint: row.reorder_point,
    primaryLocation: row.primary_location,
    locationCount: row.location_count,
    variantCount: row.variant_count,
    status: stockStatus(row.total_stock, row.reorder_point),
    costPrice: options?.includeCosts === false ? 0 : row.cost_price,
    salePrice: row.sale_price,
  }));
}

/**
 * Distinct brand and category values already in use — feeds the New Product
 * form's autocomplete so the owner reuses existing spellings instead of
 * fragmenting the catalogue with typos.
 */
export async function getProductFacets(): Promise<{ brands: string[]; categories: string[] }> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase.from("products").select("brand, category");

  const brands = new Set<string>();
  const categories = new Set<string>();
  for (const row of data ?? []) {
    if (row.brand) brands.add(row.brand);
    if (row.category) categories.add(row.category);
  }

  return {
    brands: [...brands].sort((a, b) => a.localeCompare(b)),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
  };
}

export interface VariantStockLocation {
  locationId: string;
  locationName: string;
  quantity: number;
}

export interface VariantDetail {
  variantId: string;
  name: string;
  attributes: Record<string, string>;
  sku: string | null;
  isDefault: boolean;
  totalStock: number;
  reorderPoint: number;
  status: StockStatus;
  costPrice: number;
  salePrice: number;
  stockByLocation: VariantStockLocation[];
}

export interface ProductDetail extends InventoryItem {
  barcode: string | null;
  imageUrl: string | null;
  variants: VariantDetail[];
  recentMovements: {
    id: string;
    type: string;
    quantity: number;
    note: string | null;
    createdAt: string;
    fromLocation: string | null;
    toLocation: string | null;
  }[];
}

export async function getProductDetail(
  productId: string,
  options?: { includeCosts?: boolean },
): Promise<ProductDetail | null> {
  const { supabase } = await requireSupabaseContext();
  const showCosts = options?.includeCosts !== false;

  const [{ data: overview }, { data: variantRows }, { data: stockRows }, { data: movementRows }] =
    await Promise.all([
      supabase.from("product_stock_overview").select("*").eq("product_id", productId).single(),
      supabase
        .from("variant_stock_overview")
        .select(
          "variant_id, variant_name, attributes, sku, is_default, reorder_point, cost_price, sale_price, total_stock",
        )
        .eq("product_id", productId)
        .order("is_default", { ascending: false })
        .order("variant_name"),
      supabase
        .from("inventory_stock")
        .select("variant_id, quantity, location_id, locations(id, name)")
        .eq("product_id", productId)
        .returns<
          {
            variant_id: string;
            quantity: number;
            location_id: string;
            locations: { id: string; name: string } | null;
          }[]
        >(),
      supabase
        .from("stock_movements")
        .select(
          "id, type, quantity, note, created_at, from:from_location_id(name), to:to_location_id(name)",
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(10)
        .returns<
          {
            id: string;
            type: string;
            quantity: number;
            note: string | null;
            created_at: string;
            from: { name: string } | null;
            to: { name: string } | null;
          }[]
        >(),
    ]);

  if (!overview) return null;

  const { data: product } = await supabase
    .from("products")
    .select("barcode, image_url")
    .eq("id", productId)
    .single();

  const locationsByVariant = new Map<string, VariantStockLocation[]>();
  for (const row of stockRows ?? []) {
    if (row.quantity <= 0) continue;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;
    const list = locationsByVariant.get(row.variant_id) ?? [];
    list.push({
      locationId: row.location_id,
      locationName: location?.name ?? "Unknown",
      quantity: row.quantity,
    });
    locationsByVariant.set(row.variant_id, list);
  }

  const variants: VariantDetail[] = (variantRows ?? []).map((row) => ({
    variantId: row.variant_id,
    name: row.variant_name,
    attributes: row.attributes ?? {},
    sku: row.sku,
    isDefault: row.is_default,
    totalStock: row.total_stock,
    reorderPoint: row.reorder_point,
    status: stockStatus(row.total_stock, row.reorder_point),
    costPrice: showCosts ? Number(row.cost_price) : 0,
    salePrice: Number(row.sale_price),
    stockByLocation: locationsByVariant.get(row.variant_id) ?? [],
  }));

  return {
    productId: overview.product_id,
    name: overview.name,
    sku: overview.sku,
    category: overview.category,
    brand: overview.brand,
    unit: overview.unit,
    totalStock: overview.total_stock,
    reorderPoint: overview.reorder_point,
    primaryLocation: overview.primary_location,
    locationCount: overview.location_count,
    variantCount: overview.variant_count,
    status: stockStatus(overview.total_stock, overview.reorder_point),
    costPrice: showCosts ? overview.cost_price : 0,
    salePrice: overview.sale_price,
    barcode: product?.barcode ?? null,
    imageUrl: product?.image_url ?? null,
    variants,
    recentMovements: (movementRows ?? []).map((row) => {
      const from = Array.isArray(row.from) ? row.from[0] : row.from;
      const to = Array.isArray(row.to) ? row.to[0] : row.to;
      return {
        id: row.id,
        type: row.type,
        quantity: row.quantity,
        note: row.note,
        createdAt: row.created_at,
        fromLocation: from?.name ?? null,
        toLocation: to?.name ?? null,
      };
    }),
  };
}
