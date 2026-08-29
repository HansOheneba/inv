import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getProductFacets } from "@/lib/data/inventory";
import { getLocations } from "@/lib/data/locations";
import { NewProductForm } from "@/components/inventory/new-product-form";
import { PageShell } from "@/components/app-shell/page-shell";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) redirect("/inventory");

  const [locations, facets] = await Promise.all([getLocations(), getProductFacets()]);

  return (
    <PageShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <Button
            variant="ghost"
            className="mb-2 -ml-2 gap-1.5 text-meta"
            nativeButton={false}
            render={<Link href="/inventory" />}
          >
            <ArrowLeft className="size-4" />
            Inventory
          </Button>
          <h1 className="text-page-title font-semibold">Add product</h1>
          <p className="text-meta text-muted-foreground">
            Create a catalogue entry, its variants, and an optional opening stock count.
          </p>
        </div>
        <NewProductForm options={{ locations, brands: facets.brands, departments: facets.departments }} />
      </div>
    </PageShell>
  );
}
