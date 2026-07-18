import Link from "next/link";
import { cookies } from "next/headers";
import { Plus } from "lucide-react";
import { getInventoryOverview } from "@/lib/data/inventory";
import { getLocations } from "@/lib/data/locations";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { DensityToggle } from "@/components/inventory/density-toggle";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title font-semibold">Inventory</h1>
          <p className="text-meta text-muted-foreground">
            {items.length} products
            {lowCount ? ` • ${lowCount} low` : ""}
            {outCount ? ` • ${outCount} out` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DensityToggle initial={density} />
          {owner ? (
            <Button size="sm" className="gap-1.5" nativeButton={false} render={<Link href="/inventory/new" />}>
              <Plus className="size-4" />
              Add product
            </Button>
          ) : null}
        </div>
      </div>

      <InventoryTable items={items} locations={locations} showCosts={owner} canEdit={owner} />
    </div>
  );
}
