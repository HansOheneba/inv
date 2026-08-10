import { getShipments, getShipmentFormOptions } from "@/lib/data/shipments";
import { getLocations } from "@/lib/data/locations";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { ShipmentsView } from "@/components/shipments/shipments-view";
import { NewShipmentDialog } from "@/components/shipments/new-shipment-dialog";
import { PageHeader, PageShell } from "@/components/app-shell/page-shell";

export default async function ShipmentsPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [shipments, locations, formOptions] = await Promise.all([
    getShipments({ includeCosts: owner }),
    getLocations(),
    owner ? getShipmentFormOptions() : Promise.resolve(null),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Shipments"
        description="Your own manual log of what's on order — no courier tracking, just notes you keep up to date."
        actions={owner && formOptions ? <NewShipmentDialog options={formOptions} /> : null}
      />
      <ShipmentsView shipments={shipments} locations={locations} showCosts={owner} />
    </PageShell>
  );
}
