import { getCatalogClient } from "@/lib/catalog/client";
import { externalId, normalizePhone, isValidGhanaPhone } from "@/lib/storefront/utils";
import type { AddressInput, CustomerAddress, SavedItem } from "@/lib/storefront/types";

interface AddressRow {
  id: string;
  external_id: string;
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  maps_url: string | null;
  is_default: boolean;
}

interface SavedRow {
  product_external_id: string;
  variant_external_id: string | null;
  snapshot: SavedItem["snapshot"];
  saved_at: string;
}

function mapAddress(row: AddressRow): CustomerAddress {
  const address: CustomerAddress = {
    id: row.external_id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    region: row.region,
    city: row.city,
    line: row.line,
    isDefault: row.is_default,
  };
  if (row.maps_url) address.mapsUrl = row.maps_url;
  return address;
}

function mapSaved(row: SavedRow): SavedItem {
  const item: SavedItem = {
    productId: row.product_external_id,
    snapshot: row.snapshot,
    savedAt: row.saved_at,
  };
  if (row.variant_external_id) item.variantId = row.variant_external_id;
  return item;
}

async function clearDefaultAddress(customerUuid: string): Promise<void> {
  const supabase = getCatalogClient();
  await supabase
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", customerUuid)
    .eq("is_default", true);
}

export async function listAddresses(customerUuid: string): Promise<CustomerAddress[]> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, external_id, label, name, phone, region, city, line, maps_url, is_default")
    .eq("customer_id", customerUuid)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapAddress);
}

export async function createAddress(
  customerUuid: string,
  input: AddressInput,
): Promise<CustomerAddress> {
  const phone = normalizePhone(input.phone);
  if (!isValidGhanaPhone(phone)) throw new Error("Enter a valid Ghana phone number");

  if (input.isDefault) await clearDefaultAddress(customerUuid);

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      external_id: externalId("addr"),
      customer_id: customerUuid,
      label: input.label.trim() || "Home",
      name: input.name.trim(),
      phone,
      region: input.region.trim(),
      city: input.city.trim(),
      line: input.line.trim(),
      maps_url: input.mapsUrl ?? null,
      is_default: input.isDefault ?? false,
    })
    .select("id, external_id, label, name, phone, region, city, line, maps_url, is_default")
    .single();

  if (error || !data) throw error ?? new Error("Could not save address");
  return mapAddress(data);
}

export async function updateAddress(
  customerUuid: string,
  addressExternalId: string,
  input: Partial<AddressInput>,
): Promise<CustomerAddress> {
  const supabase = getCatalogClient();
  const { data: existing } = await supabase
    .from("customer_addresses")
    .select("id")
    .eq("customer_id", customerUuid)
    .eq("external_id", addressExternalId)
    .maybeSingle();

  if (!existing) throw new Error("Address not found");
  if (input.isDefault) await clearDefaultAddress(customerUuid);

  const patch: Partial<{
    label: string;
    name: string;
    phone: string;
    region: string;
    city: string;
    line: string;
    maps_url: string | null;
    is_default: boolean;
  }> = {};
  if (input.label != null) patch.label = input.label.trim() || "Home";
  if (input.name != null) patch.name = input.name.trim();
  if (input.phone != null) {
    const phone = normalizePhone(input.phone);
    if (!isValidGhanaPhone(phone)) throw new Error("Enter a valid Ghana phone number");
    patch.phone = phone;
  }
  if (input.region != null) patch.region = input.region.trim();
  if (input.city != null) patch.city = input.city.trim();
  if (input.line != null) patch.line = input.line.trim();
  if (input.mapsUrl !== undefined) patch.maps_url = input.mapsUrl ?? null;
  if (input.isDefault != null) patch.is_default = input.isDefault;

  const { data, error } = await supabase
    .from("customer_addresses")
    .update(patch)
    .eq("id", existing.id)
    .select("id, external_id, label, name, phone, region, city, line, maps_url, is_default")
    .single();

  if (error || !data) throw error ?? new Error("Could not update address");
  return mapAddress(data);
}

export async function deleteAddress(
  customerUuid: string,
  addressExternalId: string,
): Promise<void> {
  const supabase = getCatalogClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("customer_id", customerUuid)
    .eq("external_id", addressExternalId);

  if (error) throw error;
}

export async function listSavedItems(customerUuid: string): Promise<SavedItem[]> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("customer_saved_items")
    .select("product_external_id, variant_external_id, snapshot, saved_at")
    .eq("customer_id", customerUuid)
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapSaved(row as unknown as SavedRow));
}

export async function replaceSavedItems(
  customerUuid: string,
  items: SavedItem[],
): Promise<SavedItem[]> {
  const supabase = getCatalogClient();
  await supabase.from("customer_saved_items").delete().eq("customer_id", customerUuid);

  if (items.length) {
    const rows = items.map((item) => ({
      customer_id: customerUuid,
      product_external_id: item.productId,
      variant_external_id: item.variantId ?? null,
      snapshot: item.snapshot as unknown as Record<string, unknown>,
      saved_at: item.savedAt ?? new Date().toISOString(),
    }));
    const { error } = await supabase.from("customer_saved_items").insert(rows);
    if (error) throw error;
  }

  return listSavedItems(customerUuid);
}

export async function addSavedItem(
  customerUuid: string,
  item: SavedItem,
): Promise<SavedItem[]> {
  const supabase = getCatalogClient();
  const { error } = await supabase.from("customer_saved_items").upsert(
    {
      customer_id: customerUuid,
      product_external_id: item.productId,
      variant_external_id: item.variantId ?? null,
      snapshot: item.snapshot as unknown as Record<string, unknown>,
      saved_at: item.savedAt ?? new Date().toISOString(),
    },
    { onConflict: "customer_id,product_external_id,variant_external_id" },
  );

  if (error) throw error;
  return listSavedItems(customerUuid);
}

export async function removeSavedItem(
  customerUuid: string,
  productExternalId: string,
  variantExternalId?: string | null,
): Promise<void> {
  const supabase = getCatalogClient();
  let query = supabase
    .from("customer_saved_items")
    .delete()
    .eq("customer_id", customerUuid)
    .eq("product_external_id", productExternalId);

  if (variantExternalId) {
    query = query.eq("variant_external_id", variantExternalId);
  } else {
    query = query.is("variant_external_id", null);
  }

  const { error } = await query;
  if (error) throw error;
}
