"use server";

import { revalidatePath } from "next/cache";
import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import type { ShipmentStatus } from "@/lib/supabase/types";

export interface ReceiveShipmentResult {
  error?: string;
  success?: boolean;
}

export interface CreateShipmentResult {
  error?: string;
  success?: boolean;
}

interface ShipmentItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

/**
 * Logs a new shipment entry by hand — this is a manual notebook, not a
 * courier/tracking integration. The owner records what was ordered and its
 * cost; status is then advanced manually as it physically progresses.
 */
export async function createShipmentAction(
  _prev: CreateShipmentResult,
  formData: FormData,
): Promise<CreateShipmentResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only owners can log shipments" };

  const referenceCode = String(formData.get("referenceCode") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const originCountry = String(formData.get("originCountry") ?? "").trim() || null;
  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const expectedArrival = String(formData.get("expectedArrival") ?? "") || null;
  const shippingCost = Number(formData.get("shippingCost") ?? 0) || 0;
  const customsCost = Number(formData.get("customsCost") ?? 0) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!referenceCode) return { error: "Enter a reference code (e.g. PO number)" };

  let items: ShipmentItemInput[] = [];
  try {
    items = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Could not read the item list" };
  }
  items = items.filter(
    (item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0,
  );
  if (items.length === 0) return { error: "Add at least one product line" };

  const { supabase } = await requireSupabaseContext();

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      supplier_id: supplierId,
      reference_code: referenceCode,
      origin_country: originCountry,
      status: "ordered",
      currency,
      shipping_cost: shippingCost,
      customs_cost: customsCost,
      expected_arrival: expectedArrival,
      notes,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (shipmentError || !shipment) {
    return { error: shipmentError?.message ?? "Could not create shipment" };
  }

  const { error: itemsError } = await supabase.from("shipment_items").insert(
    items.map((item) => ({
      shipment_id: shipment.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost || 0,
      currency,
    })),
  );

  if (itemsError) return { error: itemsError.message };

  await supabase.from("activity_log").insert({
    user_id: profile.id,
    action_type: "shipment.create",
    entity_type: "shipment",
    entity_id: shipment.id,
    description: `Logged shipment ${referenceCode} (${items.length} line item${items.length > 1 ? "s" : ""})`,
  });

  revalidatePath("/shipments");
  revalidatePath("/");

  return { success: true };
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
