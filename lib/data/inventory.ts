import { requireSupabaseContext } from "@/lib/supabase/context";

export type StockStatus = "available" | "low" | "out";

export interface InventoryItem {
  productId: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  totalStock: number;
  reorderPoint: number;
  primaryLocation: string | null;
  locationCount: number;
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
    unit: row.unit,
    totalStock: row.total_stock,
    reorderPoint: row.reorder_point,
    primaryLocation: row.primary_location,
    locationCount: row.location_count,
    status: stockStatus(row.total_stock, row.reorder_point),
    costPrice: options?.includeCosts === false ? 0 : row.cost_price,
    salePrice: row.sale_price,
  }));
}

export interface ProductDetail extends InventoryItem {
  barcode: string | null;
  imageUrl: string | null;
  stockByLocation: { locationId: string; locationName: string; quantity: number }[];
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

  const [{ data: overview }, { data: stockRows }, { data: movementRows }] = await Promise.all([
    supabase.from("product_stock_overview").select("*").eq("product_id", productId).single(),
    supabase
      .from("inventory_stock")
      .select("quantity, location_id, locations(id, name)")
      .eq("product_id", productId)
      .returns<{ quantity: number; location_id: string; locations: { id: string; name: string } | null }[]>(),
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

  return {
    productId: overview.product_id,
    name: overview.name,
    sku: overview.sku,
    category: overview.category,
    unit: overview.unit,
    totalStock: overview.total_stock,
    reorderPoint: overview.reorder_point,
    primaryLocation: overview.primary_location,
    locationCount: overview.location_count,
    status: stockStatus(overview.total_stock, overview.reorder_point),
    costPrice: options?.includeCosts === false ? 0 : overview.cost_price,
    salePrice: overview.sale_price,
    barcode: product?.barcode ?? null,
    imageUrl: product?.image_url ?? null,
    stockByLocation: (stockRows ?? [])
      .filter((row) => row.quantity > 0)
      .map((row) => {
        const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;
        return {
          locationId: row.location_id,
          locationName: location?.name ?? "Unknown",
          quantity: row.quantity,
        };
      }),
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
