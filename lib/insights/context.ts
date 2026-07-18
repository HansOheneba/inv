import {
  getChannelSplit,
  getDashboardStats,
  getOrderPipeline,
  getPendingShipments,
  getWeeklyRevenueTrend,
} from "@/lib/data/dashboard";
import { getInventoryOverview } from "@/lib/data/inventory";
import { getProductPerformance } from "@/lib/data/product-performance";

const ghs = (value: number) => `GHS ${Math.round(value).toLocaleString("en-GH")}`;

interface CategoryRollup {
  category: string;
  products: number;
  stock: number;
  low: number;
  out: number;
  stockValue: number;
}

/**
 * Assembles a compact, owner-only snapshot of the whole business — collections,
 * stock health, sales velocity, revenue trend, channels, orders and imports —
 * as plain text for Atlas's system prompt. Everything here is live data, so the
 * model reasons over real numbers rather than guessing. Lists are capped to keep
 * the prompt bounded even with a large catalogue.
 */
export async function buildAtlasContext(): Promise<string> {
  const [stats, items, performance, revenue, channel, pipeline, shipments] = await Promise.all([
    getDashboardStats({ includeStockValue: true }),
    getInventoryOverview({ includeCosts: true }),
    getProductPerformance({ limit: 250, includeCosts: true }),
    getWeeklyRevenueTrend(),
    getChannelSplit(),
    getOrderPipeline(),
    getPendingShipments(8),
  ]);

  const categories = new Map<string, CategoryRollup>();
  for (const item of items) {
    const key = item.category ?? "Uncategorised";
    const roll = categories.get(key) ?? {
      category: key,
      products: 0,
      stock: 0,
      low: 0,
      out: 0,
      stockValue: 0,
    };
    roll.products += 1;
    roll.stock += item.totalStock;
    if (item.status === "low") roll.low += 1;
    if (item.status === "out") roll.out += 1;
    roll.stockValue += item.totalStock * item.costPrice;
    categories.set(key, roll);
  }

  const categoryLines = [...categories.values()]
    .sort((a, b) => b.stockValue - a.stockValue)
    .map(
      (c) =>
        `- ${c.category}: ${c.products} products, ${c.stock} units on hand (${ghs(c.stockValue)} at cost)` +
        `${c.low ? `, ${c.low} low` : ""}${c.out ? `, ${c.out} out of stock` : ""}`,
    );

  const topSellers = [...performance]
    .filter((p) => p.unitsSoldLast30d > 0)
    .sort((a, b) => b.unitsSoldLast30d - a.unitsSoldLast30d)
    .slice(0, 10)
    .map((p) => `- ${p.name}: ${p.unitsSoldLast30d} sold in 30d, ${p.totalStock} left`);

  const deadStock = performance
    .filter((p) => p.unitsSoldLast30d === 0 && p.totalStock > 0)
    .slice(0, 10)
    .map((p) => `- ${p.name}: ${p.totalStock} sitting unsold (no sales in 30d)`);

  const lowStock = items
    .filter((i) => i.status === "low")
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 20)
    .map((i) => `- ${i.name}: ${i.totalStock} ${i.unit} left (reorder at ${i.reorderPoint})`);

  const outOfStock = items
    .filter((i) => i.status === "out")
    .slice(0, 20)
    .map((i) => `- ${i.name}`);

  const shipmentLines = shipments.map(
    (s) =>
      `- ${s.referenceCode} from ${s.supplierName ?? "an unlisted supplier"} — ${s.status.replace(/_/g, " ")}` +
      `${s.expectedArrival ? `, ETA ${s.expectedArrival}` : ""}`,
  );

  const revenueLine = revenue.map((d) => `${d.label} ${ghs(d.value)}`).join(", ");

  const channelLine = channel.hasData
    ? `Physical store ${channel.inStorePct}%, online ${channel.onlinePct}% of all-time revenue`
    : "Not enough sales yet to split channels";

  return [
    "BUSINESS: RAJ Kollections — a Ghana-based retail business selling fashion, beauty, home goods, bags, shoes, accessories and gifts. Customers order via Instagram/WhatsApp; staff confirm stock, take payment off-system, and deliver. All money is in Ghana Cedis (GHS).",
    "",
    "HEADLINE NUMBERS:",
    `- Products in catalogue: ${stats.totalProducts}`,
    `- Stock on hand value (at cost): ${ghs(stats.stockValue)}`,
    `- Sales today: ${ghs(stats.todaySales)} across ${stats.todayOrders} orders`,
    `- Sales last 7 days: ${ghs(stats.weekSales)} across ${stats.weekOrders} orders`,
    `- Low stock items: ${stats.lowStockCount} | Out of stock items: ${stats.outOfStockCount}`,
    `- Shipments in the pipeline: ${stats.pendingShipments}`,
    "",
    "DAILY REVENUE (last 7 days): " + (revenueLine || "no sales recorded"),
    "SALES CHANNELS: " + channelLine,
    "",
    "ORDER PIPELINE (WhatsApp orders being fulfilled):",
    `- Confirmed: ${pipeline.confirmed}, Packed: ${pipeline.packed}, Out for delivery: ${pipeline.outForDelivery}`,
    `- Delivered today: ${pipeline.deliveredToday}, delivered this week: ${pipeline.deliveredWeek}`,
    pipeline.avgFulfilmentHours != null
      ? `- Avg time from order to delivery: ${pipeline.avgFulfilmentHours.toFixed(1)} hours`
      : "- Not enough deliveries yet to gauge fulfilment speed",
    "",
    "COLLECTIONS / CATEGORIES:",
    ...(categoryLines.length ? categoryLines : ["- No products yet"]),
    "",
    "BEST SELLERS (last 30 days):",
    ...(topSellers.length ? topSellers : ["- No sales in the last 30 days"]),
    "",
    "DEAD / SLOW STOCK (no sales in 30 days, still in stock):",
    ...(deadStock.length ? deadStock : ["- Nothing sitting idle"]),
    "",
    "LOW STOCK (needs reordering soon):",
    ...(lowStock.length ? lowStock : ["- Nothing low right now"]),
    "",
    "OUT OF STOCK:",
    ...(outOfStock.length ? outOfStock : ["- Nothing fully out"]),
    "",
    "INCOMING SHIPMENTS:",
    ...(shipmentLines.length ? shipmentLines : ["- Nothing in transit"]),
  ].join("\n");
}
