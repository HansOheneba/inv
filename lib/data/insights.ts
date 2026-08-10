import { getDashboardStats, getPendingShipments } from "@/lib/data/dashboard";
import { getInventoryOverview } from "@/lib/data/inventory";
import { getChannelBreakdown, getRecentSales } from "@/lib/data/sales";

export interface BusinessSnapshot {
  stockValue: number;
  todaySales: number;
  weekSales: number;
  totalProducts: number;
  lowStockItems: { name: string; totalStock: number; reorderPoint: number; unit: string }[];
  outOfStockItems: { name: string; unit: string }[];
  pendingShipments: {
    referenceCode: string;
    supplierName: string | null;
    status: string;
    expectedArrival: string | null;
  }[];
  recentSalesCount: number;
  topChannel: { name: string; count: number } | null;
}

/**
 * Pulls together a snapshot of live business data for Atlas opening insights.
 */
export async function getBusinessSnapshot(options?: { includeCosts?: boolean }): Promise<BusinessSnapshot> {
  const [stats, items, pendingShipments, recentSales, channels] = await Promise.all([
    getDashboardStats({ includeStockValue: options?.includeCosts }),
    getInventoryOverview({ includeCosts: options?.includeCosts }),
    getPendingShipments(5),
    getRecentSales(50),
    getChannelBreakdown(),
  ]);

  const lowStockItems = items
    .filter((item) => item.status === "low")
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      totalStock: item.totalStock,
      reorderPoint: item.reorderPoint,
      unit: item.unit,
    }));

  const outOfStockItems = items
    .filter((item) => item.status === "out")
    .slice(0, 8)
    .map((item) => ({ name: item.name, unit: item.unit }));

  const leading = channels[0] ?? null;

  return {
    stockValue: stats.stockValue,
    todaySales: stats.todaySales,
    weekSales: stats.weekSales,
    totalProducts: stats.totalProducts,
    lowStockItems,
    outOfStockItems,
    pendingShipments: pendingShipments.map((s) => ({
      referenceCode: s.referenceCode,
      supplierName: s.supplierName,
      status: s.status,
      expectedArrival: s.expectedArrival,
    })),
    recentSalesCount: recentSales.length,
    topChannel: leading ? { name: leading.name, count: leading.orders } : null,
  };
}
