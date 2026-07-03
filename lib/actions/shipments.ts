"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile } from "@/lib/auth";
import type { ShipmentStatus } from "@/lib/supabase/types";

export interface ReceiveShipmentResult {
  error?: string;
  success?: boolean;
}

const ADVANCE: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  ordered: "in_transit",
  in_transit: "customs",
  customs: "received",
};

/**
 * Advances a shipment to its next pipeline status. When it reaches
 * "received", every shipment_item is added into the destination location's
 * stock and logged as a stock movement.
 */
export async function advanceShipmentAction(formData: FormData): Promise<ReceiveShipmentResult> {
  const profile = await getCurrentProfile();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");

  if (!shipmentId) return { error: "Missing shipment" };

  const { supabase } = await requireSupabaseContext();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, status, reference_code")
    .eq("id", shipmentId)
    .single();

  if (!shipment) return { error: "Shipment not found" };

  const nextStatus = ADVANCE[shipment.status];
  if (!nextStatus) return { error: "Shipment is already at its final status" };

  if (nextStatus === "received") {
    if (!locationId) return { error: "Choose a location to receive stock into" };

    const { data: items } = await supabase
      .from("shipment_items")
      .select("product_id, quantity")
      .eq("shipment_id", shipmentId);

    for (const item of items ?? []) {
      const { data: existing } = await supabase
        .from("inventory_stock")
        .select("quantity")
        .eq("product_id", item.product_id)
        .eq("location_id", locationId)
        .maybeSingle();

      await supabase.from("inventory_stock").upsert(
        {
          product_id: item.product_id,
          location_id: locationId,
          quantity: (existing?.quantity ?? 0) + item.quantity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id,location_id" },
      );

      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        to_location_id: locationId,
        quantity: item.quantity,
        type: "receive",
        reference_type: "shipment",
        reference_id: shipmentId,
        created_by: profile.id,
      });
    }

    await supabase
      .from("shipments")
      .update({ status: "received", received_at: new Date().toISOString().slice(0, 10) })
      .eq("id", shipmentId);
  } else {
    await supabase.from("shipments").update({ status: nextStatus }).eq("id", shipmentId);
  }

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "shipment.advance",
    entity_type: "shipment",
    entity_id: shipmentId,
    description: `Moved shipment ${shipment.reference_code} to ${nextStatus.replace("_", " ")}`,
  });

  revalidatePath("/shipments");
  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true };
}
