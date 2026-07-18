import type { BusinessSnapshot } from "@/lib/data/insights";

export const ATLAS_NAME = "Atlas";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

const eta = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "no ETA yet";

/**
 * Rule-based "insights" generated straight from the snapshot — a stand-in
 * for the real RAG + LLM pipeline that will replace this later. Every line
 * here is derived from live data, so the demo already feels grounded even
 * though nothing is actually inferred by a model yet.
 */
export function buildOpeningInsights(snapshot: BusinessSnapshot, showCosts: boolean): string[] {
  const lines: string[] = [];

  if (snapshot.outOfStockItems.length > 0) {
    const names = snapshot.outOfStockItems.slice(0, 3).map((i) => i.name).join(", ");
    lines.push(
      `${snapshot.outOfStockItems.length} product${snapshot.outOfStockItems.length > 1 ? "s are" : " is"} completely out of stock — ${names}${snapshot.outOfStockItems.length > 3 ? ", and more" : ""}. Worth reordering soon.`,
    );
  } else if (snapshot.lowStockItems.length > 0) {
    lines.push(
      `No products are fully out, but ${snapshot.lowStockItems.length} ${snapshot.lowStockItems.length > 1 ? "are" : "is"} running low — I'd keep an eye on ${snapshot.lowStockItems[0].name}.`,
    );
  } else {
    lines.push("Stock levels look healthy across the board — nothing low or out right now.");
  }

  if (snapshot.todaySales > 0) {
    const trend =
      snapshot.weekSales > 0 ? Math.round((snapshot.todaySales / (snapshot.weekSales / 7)) * 100) : null;
    lines.push(
      `You've sold ${currency(snapshot.todaySales)} today${
        trend ? `, about ${trend}% of your recent daily average` : ""
      }.`,
    );
  } else {
    lines.push("No sales logged yet today.");
  }

  if (snapshot.pendingShipments.length > 0) {
    const next = snapshot.pendingShipments[0];
    lines.push(
      `${snapshot.pendingShipments.length} shipment${snapshot.pendingShipments.length > 1 ? "s are" : " is"} in the pipeline — ${next.referenceCode} from ${next.supplierName ?? "an unlisted supplier"} is next, expected ${eta(next.expectedArrival)}.`,
    );
  }

  if (showCosts && snapshot.stockValue > 0) {
    lines.push(`Total stock on hand is worth about ${currency(snapshot.stockValue)} at cost.`);
  }

  return lines;
}

export function suggestedPrompts(snapshot: BusinessSnapshot): string[] {
  const prompts: string[] = [];
  if (snapshot.outOfStockItems.length > 0 || snapshot.lowStockItems.length > 0) {
    prompts.push("What should I reorder first?");
  }
  prompts.push("How were sales this week?");
  if (snapshot.pendingShipments.length > 0) {
    prompts.push("What's still in transit?");
  }
  prompts.push("Where are most of my sales coming from?");
  return prompts.slice(0, 4);
}
