import type { BusinessSnapshot } from "@/lib/data/insights";

export const ATLAS_NAME = "Atlas";

/** Small randomized delay so the demo "typing" indicator feels natural. */
export function randomThinkingDelay() {
  return 500 + Math.random() * 500;
}

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

/**
 * Very small keyword router standing in for a real model. It only ever
 * talks about numbers already in `snapshot`, so it can't hallucinate —
 * it just can't answer anything outside that scope yet either.
 */
export function answerAtlas(question: string, snapshot: BusinessSnapshot, showCosts: boolean): string {
  const q = question.toLowerCase();

  if (/(out of stock|out\b|reorder|restock|low stock|running low)/.test(q)) {
    if (snapshot.outOfStockItems.length === 0 && snapshot.lowStockItems.length === 0) {
      return "Nothing needs attention right now — every product is above its reorder point.";
    }
    const parts: string[] = [];
    if (snapshot.outOfStockItems.length > 0) {
      parts.push(
        `Out of stock: ${snapshot.outOfStockItems.map((i) => i.name).join(", ")}.`,
      );
    }
    if (snapshot.lowStockItems.length > 0) {
      parts.push(
        `Running low: ${snapshot.lowStockItems
          .map((i) => `${i.name} (${i.totalStock} ${i.unit} left, reorder at ${i.reorderPoint})`)
          .join("; ")}.`,
      );
    }
    return `${parts.join(" ")} I'd start a shipment for these on the Shipments tab.`;
  }

  if (/(sale|sold|revenue|today|this week|week)/.test(q)) {
    return `Today: ${currency(snapshot.todaySales)}. Last 7 days: ${currency(snapshot.weekSales)}, across ${snapshot.recentSalesCount} completed orders.`;
  }

  if (/(shipment|transit|customs|incoming|import|arriving|eta)/.test(q)) {
    if (snapshot.pendingShipments.length === 0) {
      return "Nothing in the pipeline right now — every logged shipment has already been received.";
    }
    return snapshot.pendingShipments
      .map(
        (s) =>
          `${s.referenceCode} from ${s.supplierName ?? "an unlisted supplier"} — ${s.status.replace("_", " ")}, ${eta(s.expectedArrival)}.`,
      )
      .join(" ");
  }

  if (/(channel|where|instagram|whatsapp|facebook|online|store)/.test(q)) {
    if (!snapshot.topChannel) return "I don't have enough recent sales yet to tell where they're coming from.";
    return `Most of your recent orders (${snapshot.topChannel.count} of the last ${snapshot.recentSalesCount}) came through ${snapshot.topChannel.name}.`;
  }

  if (/(worth|value|stock value)/.test(q)) {
    if (!showCosts) return "Stock value is only visible to the business owner.";
    return `Everything on the shelf right now is worth about ${currency(snapshot.stockValue)} at cost, across ${snapshot.totalProducts} products.`;
  }

  if (/(hello|hi|hey|sup|yo)\b/.test(q)) {
    return `Hey! Ask me about stock levels, sales, or shipments — I'm working from your live numbers.`;
  }

  return "I can only talk about stock, sales, and shipments for now — the fuller assistant (with real reasoning over your whole history) is coming soon.";
}
