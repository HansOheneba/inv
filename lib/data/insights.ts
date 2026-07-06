import { getDashboardStats, getPendingShipments } from "@/lib/data/dashboard";
import { getInventoryOverview } from "@/lib/data/inventory";
import { getSales } from "@/lib/data/sales";

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
 * Pulls together a snapshot of live business data. This is the "context"
 * that would be handed to a real RAG pipeline later — for now Kofi's demo
 * answers are generated from this object with simple rules instead of an
 * LLM call.
 */
export async function getBusinessSnapshot(options?: { includeCosts?: boolean }): Promise<BusinessSnapshot> {
  const [stats, items, pendingShipments, recentSales] = await Promise.all([
    getDashboardStats({ includeStockValue: options?.includeCosts }),
    getInventoryOverview({ includeCosts: options?.includeCosts }),
    getPendingShipments(5),
    getSales(50),
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

  const channelCounts = new Map<string, number>();
  for (const sale of recentSales) {
    if (sale.status !== "completed") continue;
    const name = sale.channelName ?? "Direct";
    channelCounts.set(name, (channelCounts.get(name) ?? 0) + 1);
  }
  let topChannel: { name: string; count: number } | null = null;
  for (const [name, count] of channelCounts) {
    if (!topChannel || count > topChannel.count) topChannel = { name, count };
  }

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
    recentSalesCount: recentSales.filter((s) => s.status === "completed").length,
    topChannel,
  };
}
