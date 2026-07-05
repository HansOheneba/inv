import { getShipments } from "@/lib/data/shipments";
import { getLocations } from "@/lib/data/locations";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { ShipmentsView } from "@/components/shipments/shipments-view";

export default async function ShipmentsPage() {
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [shipments, locations] = await Promise.all([
    getShipments({ includeCosts: owner }),
    getLocations(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4">
        <h1 className="text-page-title font-semibold">Shipments</h1>
        <p className="text-meta text-muted-foreground">Track what&apos;s on the way from your suppliers.</p>
      </div>
      <ShipmentsView shipments={shipments} locations={locations} showCosts={owner} />
    </div>
  );
}
