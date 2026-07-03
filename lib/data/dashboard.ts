import { requireSupabaseContext } from "@/lib/supabase/context";

export interface DashboardStats {
  stockValue: number;
  todaySales: number;
  weekSales: number;
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
    todaySales: (salesTodayRes.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0),
    weekSales: (salesWeekRes.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0),
    pendingShipments: shipmentsRes.data?.length ?? 0,
    lowStockCount,
    outOfStockCount,
    totalProducts: overview.length,
  };
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
