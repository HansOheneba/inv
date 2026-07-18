import { requireSupabaseContext } from "@/lib/supabase/context";

export interface DashboardStats {
  stockValue: number;
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  pendingShipments: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
}

export interface ActivityItem {
  id: string;
  actorName: string;
  description: string;
  createdAt: string;
}

export interface ShipmentSummary {
  id: string;
  referenceCode: string;
  supplierName: string | null;
  status: string;
  expectedArrival: string | null;
}

export async function getDashboardStats(options?: { includeStockValue?: boolean }): Promise<DashboardStats> {
  const { supabase } = await requireSupabaseContext();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [overviewRes, salesTodayRes, salesWeekRes, shipmentsRes] = await Promise.all([
    supabase.from("product_stock_overview").select("total_stock, reorder_point, cost_price"),
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", startOfWeek.toISOString()),
    supabase.from("shipments").select("id").not("status", "in", "(received,cancelled)"),
  ]);

  const salesToday = salesTodayRes.data ?? [];
  const salesWeek = salesWeekRes.data ?? [];

  const overview = overviewRes.data ?? [];
  const lowStockCount = overview.filter(
    (row) => row.total_stock > 0 && row.total_stock <= row.reorder_point,
  ).length;
  const outOfStockCount = overview.filter((row) => row.total_stock <= 0).length;
  const stockValue = options?.includeStockValue === false
    ? 0
    : overview.reduce((sum, row) => sum + row.total_stock * row.cost_price, 0);

  return {
    stockValue,
    todaySales: salesToday.reduce((sum, row) => sum + Number(row.total_amount), 0),
    todayOrders: salesToday.length,
    weekSales: salesWeek.reduce((sum, row) => sum + Number(row.total_amount), 0),
    weekOrders: salesWeek.length,
    pendingShipments: shipmentsRes.data?.length ?? 0,
    lowStockCount,
    outOfStockCount,
    totalProducts: overview.length,
  };
}

export interface OrderPipeline {
  confirmed: number;
  packed: number;
  outForDelivery: number;
  openTotal: number;
  deliveredToday: number;
  deliveredWeek: number;
  /** Average hours from an order being locked in to it being delivered, over the last 7 days. */
  avgFulfilmentHours: number | null;
}

/**
 * Snapshot of the WhatsApp-order fulfilment pipeline for the dashboard: how
 * many orders sit at each open stage, plus delivery throughput and speed.
 */
export async function getOrderPipeline(): Promise<OrderPipeline> {
  const { supabase } = await requireSupabaseContext();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [openRes, deliveredRes] = await Promise.all([
    supabase.from("orders").select("status").in("status", ["confirmed", "packed", "out_for_delivery"]),
    supabase
      .from("orders")
      .select("created_at, delivered_at")
      .eq("status", "delivered")
      .gte("delivered_at", startOfWeek.toISOString()),
  ]);

  const open = openRes.data ?? [];
  const delivered = deliveredRes.data ?? [];

  const durations = delivered
    .filter((row) => row.delivered_at)
    .map(
      (row) =>
        (new Date(row.delivered_at as string).getTime() - new Date(row.created_at).getTime()) /
        3_600_000,
    )
    .filter((hours) => hours >= 0);

  return {
    confirmed: open.filter((row) => row.status === "confirmed").length,
    packed: open.filter((row) => row.status === "packed").length,
    outForDelivery: open.filter((row) => row.status === "out_for_delivery").length,
    openTotal: open.length,
    deliveredToday: delivered.filter(
      (row) => row.delivered_at && new Date(row.delivered_at) >= startOfToday,
    ).length,
    deliveredWeek: delivered.length,
    avgFulfilmentHours: durations.length
      ? durations.reduce((sum, hours) => sum + hours, 0) / durations.length
      : null,
  };
}

export interface RevenueTrendPoint {
  label: string;
  value: number;
}

/** Daily completed-sales revenue for the last 7 days, oldest first — powers the dashboard bar chart. */
export async function getWeeklyRevenueTrend(): Promise<RevenueTrendPoint[]> {
  const { supabase } = await requireSupabaseContext();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const { data } = await supabase
    .from("sales")
    .select("total_amount, created_at")
    .eq("status", "completed")
    .gte("created_at", start.toISOString());

  const days: RevenueTrendPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const label = day.toLocaleDateString(undefined, { weekday: "short" });
    const total = (data ?? [])
      .filter((row) => new Date(row.created_at).toDateString() === day.toDateString())
      .reduce((sum, row) => sum + Number(row.total_amount), 0);
    days.push({ label, value: total });
  }
  return days;
}

export interface ChannelSplit {
  inStorePct: number;
  onlinePct: number;
  hasData: boolean;
}

/** Splits all-time completed revenue between the physical store and every online channel. */
export async function getChannelSplit(): Promise<ChannelSplit> {
  const { supabase } = await requireSupabaseContext();

  const { data } = await supabase
    .from("sales")
    .select("total_amount, channel:channel_id(type)")
    .eq("status", "completed")
    .returns<{ total_amount: number; channel: { type: string } | null }[]>();

  const rows = data ?? [];
  let inStore = 0;
  let online = 0;
  for (const row of rows) {
    const channel = Array.isArray(row.channel) ? row.channel[0] : row.channel;
    if (channel?.type === "physical_store") inStore += Number(row.total_amount);
    else online += Number(row.total_amount);
  }

  const total = inStore + online;
  if (total <= 0) return { inStorePct: 0, onlinePct: 0, hasData: false };

  const inStorePct = Math.round((inStore / total) * 100);
  return { inStorePct, onlinePct: 100 - inStorePct, hasData: true };
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("activity_log")
    .select("id, description, created_at, actor:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; description: string; created_at: string; actor: { full_name: string } | null }[]
    >();

  return (data ?? []).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    return {
      id: row.id,
      actorName: actor?.full_name || "Someone",
      description: row.description,
      createdAt: row.created_at,
    };
  });
}

export async function getPendingShipments(limit = 5): Promise<ShipmentSummary[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("shipments")
    .select("id, reference_code, status, expected_arrival, supplier:supplier_id(name)")
    .not("status", "in", "(received,cancelled)")
    .order("expected_arrival", { ascending: true })
    .limit(limit)
    .returns<
      {
        id: string;
        reference_code: string;
        status: string;
        expected_arrival: string | null;
        supplier: { name: string } | null;
      }[]
    >();

  return (data ?? []).map((row) => {
    const supplier = Array.isArray(row.supplier) ? row.supplier[0] : row.supplier;
    return {
      id: row.id,
      referenceCode: row.reference_code,
      supplierName: supplier?.name ?? null,
      status: row.status,
      expectedArrival: row.expected_arrival,
    };
  });
}
