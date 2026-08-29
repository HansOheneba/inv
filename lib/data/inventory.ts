import { requireSupabaseContext } from "@/lib/supabase/context";
import { getDepartmentsForAdmin, type AdminDepartment } from "@/lib/data/departments";

export type StockStatus = "available" | "low" | "out";

export interface InventoryItem {
  productId: string;
  name: string;
  sku: string | null;
  department: string | null;
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
  inStock: boolean;
  imageUrl: string | null;
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
    department: row.department_name,
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
    inStock: row.in_stock,
    imageUrl: row.image_url,
  }));
}

/**
 * Distinct brand and department values from the live catalogue — feeds product
 * forms so staff reuse existing spellings instead of fragmenting the catalogue.
 */
export async function getProductFacets(): Promise<{ brands: string[]; departments: AdminDepartment[] }> {
  const { supabase } = await requireSupabaseContext();
  const [{ data }, departments] = await Promise.all([
    supabase.from("products").select("brand").not("external_id", "is", null),
    getDepartmentsForAdmin(),
  ]);

  const brands = new Set<string>();
  for (const row of data ?? []) {
    if (row.brand) brands.add(row.brand);
  }

  return {
    brands: [...brands].sort((a, b) => a.localeCompare(b)),
    departments,
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
  compareAtPrice: number | null;
  discountType: "amount" | "percent" | null;
  discountValue: number;
  imageUrls: string[];
  stockByLocation: VariantStockLocation[];
}

export interface ProductDetail extends InventoryItem {
  departmentId: string | null;
  barcode: string | null;
  imageUrls: string[];
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
        .from("product_variants")
        .select(
          "id, name, attributes, sku, is_default, reorder_point, cost_price, sale_price, compare_at_price, discount_type, discount_value, image_urls",
        )
        .eq("product_id", productId)
        .eq("active", true)
        .order("is_default", { ascending: false })
        .order("name"),
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
    .select("barcode, image_url, image_urls, department_id")
    .eq("id", productId)
    .single();

  const stockByVariant = new Map<string, number>();
  for (const row of stockRows ?? []) {
    stockByVariant.set(
      row.variant_id,
      (stockByVariant.get(row.variant_id) ?? 0) + row.quantity,
    );
  }

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

  const variants: VariantDetail[] = (variantRows ?? []).map((row) => {
    const totalStock = stockByVariant.get(row.id) ?? 0;
    return {
      variantId: row.id,
      name: row.name,
      attributes: row.attributes ?? {},
      sku: row.sku,
      isDefault: row.is_default,
      totalStock,
      reorderPoint: row.reorder_point,
      status: stockStatus(totalStock, row.reorder_point),
      costPrice: showCosts ? Number(row.cost_price) : 0,
      salePrice: Number(row.sale_price),
      compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
      discountType:
        row.discount_type === "amount" || row.discount_type === "percent"
          ? row.discount_type
          : null,
      discountValue: row.discount_value != null ? Number(row.discount_value) : 0,
      imageUrls: row.image_urls ?? [],
      stockByLocation: locationsByVariant.get(row.id) ?? [],
    };
  });

  return {
    productId: overview.product_id,
    name: overview.name,
    sku: overview.sku,
    department: overview.department_name,
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
    inStock: overview.in_stock,
    imageUrl: overview.image_url,
    departmentId: product?.department_id ?? null,
    barcode: product?.barcode ?? null,
    imageUrls: product?.image_urls ?? [],
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
