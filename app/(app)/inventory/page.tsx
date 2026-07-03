import { cookies } from "next/headers";
import { getInventoryOverview } from "@/lib/data/inventory";
import { getLocations } from "@/lib/data/locations";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { InventoryList } from "@/components/inventory/inventory-list";
import { DensityToggle } from "@/components/inventory/density-toggle";
import { DENSITY_COOKIE, parseDensity } from "@/lib/density";

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const density = parseDensity(cookieStore.get(DENSITY_COOKIE)?.value);
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);

  const [items, locations] = await Promise.all([
    getInventoryOverview({ includeCosts: owner }),
    getLocations(),
  ]);

  const lowCount = items.filter((item) => item.status === "low").length;
  const outCount = items.filter((item) => item.status === "out").length;

  return (
    <div className="flex h-[calc(100dvh-3rem-3.5rem)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
        <div>
          <h1 className="text-page-title font-semibold">Inventory</h1>
          <p className="text-meta text-muted-foreground">
            {items.length} products
            {lowCount ? ` • ${lowCount} low` : ""}
            {outCount ? ` • ${outCount} out` : ""}
          </p>
        </div>
        <DensityToggle initial={density} />
      </div>

      <InventoryList items={items} locations={locations} showCosts={owner} />
    </div>
  );
}
