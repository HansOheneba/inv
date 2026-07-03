import { requireSupabaseContext } from "@/lib/supabase/context";
import type { ShipmentStatus } from "@/lib/supabase/types";

export interface ShipmentListItem {
  id: string;
  referenceCode: string;
  supplierName: string | null;
  originCountry: string | null;
  status: ShipmentStatus;
  currency: string;
  shippingCost: number;
  customsCost: number;
  orderedAt: string;
  expectedArrival: string | null;
  receivedAt: string | null;
  itemCount: number;
  totalUnits: number;
}

export async function getShipments(options?: { includeCosts?: boolean }): Promise<ShipmentListItem[]> {
  const { supabase } = await requireSupabaseContext();
  const { data } = await supabase
    .from("shipments")
    .select(
      "id, reference_code, origin_country, status, currency, shipping_cost, customs_cost, ordered_at, expected_arrival, received_at, supplier:supplier_id(name), shipment_items(quantity)",
    )
    .order("ordered_at", { ascending: false })
    .returns<
      {
        id: string;
        reference_code: string;
        origin_country: string | null;
        status: ShipmentStatus;
        currency: string;
        shipping_cost: number;
        customs_cost: number;
        ordered_at: string;
        expected_arrival: string | null;
        received_at: string | null;
        supplier: { name: string } | null;
        shipment_items: { quantity: number }[];
      }[]
    >();

  return (data ?? []).map((row) => {
    const supplier = Array.isArray(row.supplier) ? row.supplier[0] : row.supplier;
    const items = row.shipment_items ?? [];
    return {
      id: row.id,
      referenceCode: row.reference_code,
      supplierName: supplier?.name ?? null,
      originCountry: row.origin_country,
      status: row.status,
      currency: row.currency,
      shippingCost: options?.includeCosts === false ? 0 : Number(row.shipping_cost),
      customsCost: options?.includeCosts === false ? 0 : Number(row.customs_cost),
      orderedAt: row.ordered_at,
      expectedArrival: row.expected_arrival,
      receivedAt: row.received_at,
      itemCount: items.length,
      totalUnits: items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
    };
  });
}
