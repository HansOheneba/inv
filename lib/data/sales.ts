import { requireSupabaseContext } from "@/lib/supabase/context";

export interface SaleRow {
  id: string;
  channelName: string | null;
  locationName: string | null;
  customerName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  itemCount: number;
}

export async function getSales(limit = 50): Promise<SaleRow[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("sales")
    .select(
      "id, total_amount, currency, status, created_at, customer_name, channel:channel_id(name), location:location_id(name), sale_items(id)",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        id: string;
        total_amount: number;
        currency: string;
        status: string;
        created_at: string;
        customer_name: string | null;
        channel: { name: string } | null;
        location: { name: string } | null;
        sale_items: { id: string }[];
      }[]
    >();

  return (data ?? []).map((row) => {
    const channel = Array.isArray(row.channel) ? row.channel[0] : row.channel;
    const location = Array.isArray(row.location) ? row.location[0] : row.location;
    return {
      id: row.id,
      channelName: channel?.name ?? null,
      locationName: location?.name ?? null,
      customerName: row.customer_name,
      totalAmount: Number(row.total_amount),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
      itemCount: Array.isArray(row.sale_items) ? row.sale_items.length : 0,
    };
  });
}

export interface SaleFormOptions {
  channels: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  products: { id: string; name: string; salePrice: number }[];
}

export async function getSaleFormOptions(): Promise<SaleFormOptions> {
  const { supabase } = await requireSupabaseContext();
  const [{ data: channels }, { data: locations }, { data: products }] = await Promise.all([
    supabase.from("sales_channels").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("products").select("id, name, sale_price").order("name"),
  ]);

  return {
    channels: channels ?? [],
    locations: locations ?? [],
    products: (products ?? []).map((p) => ({ id: p.id, name: p.name, salePrice: Number(p.sale_price) })),
  };
}
