import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getProductDetail, getProductFacets } from "@/lib/data/inventory";
import { getLocations } from "@/lib/data/locations";
import { ProductEditForm } from "@/components/inventory/product-edit-form";
import { Button } from "@/components/ui/button";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) redirect("/inventory");

  const { productId } = await params;
  const [product, locations, facets] = await Promise.all([
    getProductDetail(productId, { includeCosts: true }),
    getLocations(),
    getProductFacets(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2 gap-1 text-meta"
        nativeButton={false}
        render={<Link href="/inventory" />}
      >
        <ArrowLeft className="size-4" />
        Inventory
      </Button>
      <div className="mb-4">
        <h1 className="text-page-title font-semibold">Edit product</h1>
        <p className="text-meta text-muted-foreground">
          Update details, edit or archive variants, and add new ones.
        </p>
      </div>
      <ProductEditForm
        product={product}
        options={{ locations, brands: facets.brands, categories: facets.categories }}
      />
    </div>
  );
}
