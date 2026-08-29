import { requireSupabaseContext } from "@/lib/supabase/context";
import { getInventoryOverview, type StockStatus } from "@/lib/data/inventory";

export interface ProductPerformanceRow {
  productId: string;
  name: string;
  sku: string | null;
  department: string | null;
  unit: string;
  totalStock: number;
  status: StockStatus;
  healthScore: number;
  ordersLast30d: number;
  unitsSoldLast30d: number;
  demandPct: number;
  locationCount: number;
}

function healthScore(totalStock: number, reorderPoint: number): number {
  if (reorderPoint <= 0) return totalStock > 0 ? 100 : 0;
  const ratio = totalStock / (reorderPoint * 2);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

/**
 * Blends live stock levels with recent sales velocity into one list, sorted
 * so the products that most need attention (out of stock, then low stock)
 * surface first — this powers the dashboard's "Product performance" table.
 */
export async function getProductPerformance(options?: {
  limit?: number;
  includeCosts?: boolean;
}): Promise<ProductPerformanceRow[]> {
  const { supabase } = await requireSupabaseContext();
  const limit = options?.limit ?? 6;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [items, { data: itemRows }] = await Promise.all([
    getInventoryOverview({ includeCosts: options?.includeCosts }),
    supabase
      .from("sale_items")
      .select("product_id, quantity, sale_id, sale:sale_id(created_at, status)")
      .returns<
        {
          product_id: string;
          quantity: number;
          sale_id: string;
          sale: { created_at: string; status: string } | null;
        }[]
      >(),
  ]);

  const unitsByProduct = new Map<string, number>();
  const salesByProduct = new Map<string, Set<string>>();

  for (const row of itemRows ?? []) {
    const sale = Array.isArray(row.sale) ? row.sale[0] : row.sale;
    if (!sale || sale.status !== "completed") continue;
    if (new Date(sale.created_at) < since) continue;

    unitsByProduct.set(row.product_id, (unitsByProduct.get(row.product_id) ?? 0) + row.quantity);
    const set = salesByProduct.get(row.product_id) ?? new Set<string>();
    set.add(row.sale_id);
    salesByProduct.set(row.product_id, set);
  }

  const maxUnits = Math.max(1, ...Array.from(unitsByProduct.values()));

  const rows: ProductPerformanceRow[] = items.map((item) => {
    const unitsSold = unitsByProduct.get(item.productId) ?? 0;
    return {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      department: item.department,
      unit: item.unit,
      totalStock: item.totalStock,
      status: item.status,
      healthScore: healthScore(item.totalStock, item.reorderPoint),
      ordersLast30d: salesByProduct.get(item.productId)?.size ?? 0,
      unitsSoldLast30d: unitsSold,
      demandPct: Math.round((unitsSold / maxUnits) * 100),
      locationCount: item.locationCount,
    };
  });

  const statusRank: Record<StockStatus, number> = { out: 0, low: 1, available: 2 };
  rows.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;
    return b.unitsSoldLast30d - a.unitsSoldLast30d;
  });

  return rows.slice(0, limit);
}
