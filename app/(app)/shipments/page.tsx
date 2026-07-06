import { getShipments, getShipmentFormOptions } from "@/lib/data/shipments";
import { getLocations } from "@/lib/data/locations";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { ShipmentsView } from "@/components/shipments/shipments-view";
import { NewShipmentDialog } from "@/components/shipments/new-shipment-dialog";

export default async function ShipmentsPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [shipments, locations, formOptions] = await Promise.all([
    getShipments({ includeCosts: owner }),
    getLocations(),
    owner ? getShipmentFormOptions() : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title font-semibold">Shipments</h1>
          <p className="text-meta text-muted-foreground">
            Your own manual log of what&apos;s on order — no courier tracking, just notes you keep
            up to date.
          </p>
        </div>
        {owner && formOptions ? <NewShipmentDialog options={formOptions} /> : null}
      </div>
      <ShipmentsView shipments={shipments} locations={locations} showCosts={owner} />
    </div>
  );
}
