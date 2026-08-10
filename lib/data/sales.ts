import { requireSupabaseContext } from "@/lib/supabase/context";

export interface SaleRow {
  id: string;
  channelName: string | null;
  customerName: string | null;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

export interface SalesPeriodStats {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  avgOrderValue: number;
}

export interface ChannelBreakdownRow {
  channelId: string;
  name: string;
  type: string;
  revenue: number;
  orders: number;
  sharePct: number;
}

export interface TopProductRow {
  productId: string;
  name: string;
  brand: string | null;
  category: string | null;
  unitsSold: number;
  revenue: number;
  orders: number;
}

export interface RevenueDay {
  label: string;
  value: number;
  dateKey: string;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Headline sales numbers for the analytics page. Sourced from completed sales
 * rows — which Orders writes when a WhatsApp order is marked delivered.
 */
export async function getSalesPeriodStats(): Promise<SalesPeriodStats> {
  const { supabase } = await requireSupabaseContext();

  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(today);
  monthStart.setDate(monthStart.getDate() - 29);

  const { data } = await supabase
    .from("sales")
    .select("total_amount, created_at")
    .eq("status", "completed")
    .gte("created_at", monthStart.toISOString());

  const rows = data ?? [];
  let todayRevenue = 0;
  let todayOrders = 0;
  let weekRevenue = 0;
  let weekOrders = 0;
  let monthRevenue = 0;
  let monthOrders = 0;

  for (const row of rows) {
    const created = new Date(row.created_at);
    const amount = Number(row.total_amount);
    monthRevenue += amount;
    monthOrders += 1;
    if (created >= weekStart) {
      weekRevenue += amount;
      weekOrders += 1;
    }
    if (created >= today) {
      todayRevenue += amount;
      todayOrders += 1;
    }
  }

  return {
    todayRevenue,
    todayOrders,
    weekRevenue,
    weekOrders,
    monthRevenue,
    monthOrders,
    avgOrderValue: monthOrders > 0 ? monthRevenue / monthOrders : 0,
  };
}

/** Daily completed revenue for the last `days` days, oldest first. */
export async function getSalesRevenueTrend(days = 14): Promise<RevenueDay[]> {
  const { supabase } = await requireSupabaseContext();

  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (days - 1));

  const { data } = await supabase
    .from("sales")
    .select("total_amount, created_at")
    .eq("status", "completed")
    .gte("created_at", start.toISOString());

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const key = dateKey(new Date(row.created_at));
    totals.set(key, (totals.get(key) ?? 0) + Number(row.total_amount));
  }

  const trend: RevenueDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = dateKey(day);
    trend.push({
      dateKey: key,
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: totals.get(key) ?? 0,
    });
  }
  return trend;
}

/** Revenue and order count per sales channel over the last 30 days. */
export async function getChannelBreakdown(): Promise<ChannelBreakdownRow[]> {
  const { supabase } = await requireSupabaseContext();

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from("sales")
    .select("total_amount, channel_id, channel:channel_id(id, name, type)")
    .eq("status", "completed")
    .gte("created_at", since.toISOString())
    .returns<
      {
        total_amount: number;
        channel_id: string | null;
        channel: { id: string; name: string; type: string } | null;
      }[]
    >();

  const byChannel = new Map<string, ChannelBreakdownRow>();
  let totalRevenue = 0;

  for (const row of data ?? []) {
    const channel = Array.isArray(row.channel) ? row.channel[0] : row.channel;
    const id = channel?.id ?? "unknown";
    const amount = Number(row.total_amount);
    totalRevenue += amount;
    const existing = byChannel.get(id);
    if (existing) {
      existing.revenue += amount;
      existing.orders += 1;
    } else {
      byChannel.set(id, {
        channelId: id,
        name: channel?.name ?? "Unassigned",
        type: channel?.type ?? "unknown",
        revenue: amount,
        orders: 1,
        sharePct: 0,
      });
    }
  }

  const rows = [...byChannel.values()].sort((a, b) => b.revenue - a.revenue);
  for (const row of rows) {
    row.sharePct = totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0;
  }
  return rows;
}

/** Top products by revenue from completed sale lines over the last 30 days. */
export async function getTopSellingProducts(limit = 8): Promise<TopProductRow[]> {
  const { supabase } = await requireSupabaseContext();

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from("sale_items")
    .select(
      "product_id, quantity, unit_price, sale_id, sale:sale_id(created_at, status), product:product_id(name, brand, category)",
    )
    .returns<
      {
        product_id: string;
        quantity: number;
        unit_price: number;
        sale_id: string;
        sale: { created_at: string; status: string } | null;
        product: { name: string; brand: string | null; category: string | null } | null;
      }[]
    >();

  const byProduct = new Map<
    string,
    TopProductRow & { saleIds: Set<string> }
  >();

  for (const row of data ?? []) {
    const sale = Array.isArray(row.sale) ? row.sale[0] : row.sale;
    if (!sale || sale.status !== "completed") continue;
    if (new Date(sale.created_at) < since) continue;

    const product = Array.isArray(row.product) ? row.product[0] : row.product;
    const existing = byProduct.get(row.product_id);
    const lineRevenue = row.quantity * Number(row.unit_price);
    if (existing) {
      existing.unitsSold += row.quantity;
      existing.revenue += lineRevenue;
      existing.saleIds.add(row.sale_id);
    } else {
      byProduct.set(row.product_id, {
        productId: row.product_id,
        name: product?.name ?? "Unknown product",
        brand: product?.brand ?? null,
        category: product?.category ?? null,
        unitsSold: row.quantity,
        revenue: lineRevenue,
        orders: 0,
        saleIds: new Set([row.sale_id]),
      });
    }
  }

  return [...byProduct.values()]
    .map(({ saleIds, ...row }) => ({ ...row, orders: saleIds.size }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Recent completed sales for a read-only activity feed on the analytics page. */
export async function getRecentSales(limit = 12): Promise<SaleRow[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("sales")
    .select(
      "id, total_amount, currency, created_at, customer_name, channel:channel_id(name), sale_items(id)",
    )
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        id: string;
        total_amount: number;
        currency: string;
        created_at: string;
        customer_name: string | null;
        channel: { name: string } | null;
        sale_items: { id: string }[];
      }[]
    >();

  return (data ?? []).map((row) => {
    const channel = Array.isArray(row.channel) ? row.channel[0] : row.channel;
    return {
      id: row.id,
      channelName: channel?.name ?? null,
      customerName: row.customer_name,
      totalAmount: Number(row.total_amount),
      currency: row.currency,
      itemCount: Array.isArray(row.sale_items) ? row.sale_items.length : 0,
      createdAt: row.created_at,
    };
  });
}
