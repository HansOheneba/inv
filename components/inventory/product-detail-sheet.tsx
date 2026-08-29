"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Pencil,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/inventory/status-badge";
import { ProductImage } from "@/components/inventory/product-image";
import type { InventoryItem, ProductDetail, VariantStockLocation } from "@/lib/data/inventory";
import { variantSummary } from "@/lib/inventory/variant-attributes";

const MOVEMENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  receive: ArrowDownToLine,
  transfer: ArrowLeftRight,
  sale: ShoppingBag,
  adjustment: RotateCcw,
  return: ArrowUpFromLine,
};

export function ProductDetailSheet({
  item,
  detail,
  loading,
  open,
  onOpenChange,
  showCosts,
  canEdit,
}: {
  item: InventoryItem | null;
  detail: ProductDetail | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showCosts: boolean;
  canEdit: boolean;
}) {
  // Ignore stale detail left over from a previously opened product.
  const visibleDetail = detail && item && detail.productId === item.productId ? detail : null;
  const isSingleDefault =
    visibleDetail?.variants.length === 1 && visibleDetail.variants[0].isDefault;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl sm:top-1/2! sm:left-1/2! sm:right-auto! sm:bottom-auto! sm:-translate-x-1/2! sm:-translate-y-1/2! sm:w-full sm:max-w-xl sm:rounded-2xl sm:border"
      >
        {item ? (
          <>
            <SheetHeader className="pb-2">
              <div className="flex items-start gap-3 pr-10">
                <ProductImage
                  src={visibleDetail?.imageUrls[0] ?? item.imageUrl}
                  alt={item.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <SheetTitle className="text-row-title">{item.name}</SheetTitle>
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        nativeButton={false}
                        render={<Link href={`/inventory/${item.productId}/edit`} />}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                  <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta">
                    {item.brand ? (
                      <span className="font-medium text-foreground">
                        {item.brand}
                      </span>
                    ) : null}
                    {item.department ? <span>{item.department}</span> : null}
                    {item.sku ? <span>SKU {item.sku}</span> : null}
                    <StatusBadge status={item.status} />
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2 px-4">
              <StatTile
                label="In stock"
                value={`${item.totalStock} ${item.unit}`}
              />
              <StatTile
                label="Reorder at"
                value={`${item.reorderPoint} ${item.unit}`}
              />
              {showCosts ? (
                <StatTile
                  label="Margin"
                  value={`GHS ${(item.salePrice - item.costPrice).toFixed(2)}`}
                />
              ) : (
                <StatTile
                  label="Price"
                  value={`GHS ${item.salePrice.toFixed(2)}`}
                />
              )}
            </div>

            <Separator className="my-3" />

            <div className="px-4 pb-2">
              <h3 className="mb-2 text-meta font-medium text-muted-foreground">
                {isSingleDefault ? "Stock by location" : "Stock by variant"}
              </h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : visibleDetail?.variants.length ? (
                isSingleDefault ? (
                  <LocationList
                    locations={visibleDetail.variants[0].stockByLocation}
                    unit={item.unit}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {visibleDetail.variants.map((variant) => (
                      <div
                        key={variant.variantId}
                        className="rounded-md border p-2.5"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <ProductImage
                              src={variant.imageUrls[0] ?? visibleDetail.imageUrls[0] ?? item.imageUrl}
                              alt={variant.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <span className="text-row-title font-medium">
                                {variant.name}
                              </span>
                              {variantSummary(variant.attributes) ? (
                                <p className="truncate text-caption text-muted-foreground">
                                  {variantSummary(variant.attributes)}
                                </p>
                              ) : null}
                            </div>
                            <StatusBadge status={variant.status} />
                          </div>
                          <span className="shrink-0 text-row-value font-semibold tabular-nums">
                            {variant.totalStock}
                            <span className="ml-1 text-meta font-normal text-muted-foreground">
                              {item.unit}
                            </span>
                          </span>
                        </div>
                        <LocationList
                          locations={variant.stockByLocation}
                          unit={item.unit}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-meta text-muted-foreground">
                  No stock recorded anywhere yet.
                </p>
              )}
            </div>

            <Separator className="my-3" />

            <div className="px-4 pb-8">
              <h3 className="mb-2 text-meta font-medium text-muted-foreground">
                Recent activity
              </h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : visibleDetail?.recentMovements.length ? (
                <ul className="space-y-2">
                  {visibleDetail.recentMovements.map((movement) => {
                    const Icon = MOVEMENT_ICON[movement.type] ?? RotateCcw;
                    return (
                      <li
                        key={movement.id}
                        className="flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-row-value font-normal capitalize">
                            {movement.type}
                            <span className="ml-1 font-semibold tabular-nums">
                              {movement.quantity}
                            </span>
                          </p>
                          <p className="truncate text-meta text-muted-foreground">
                            {[movement.fromLocation, movement.toLocation]
                              .filter(Boolean)
                              .join(" → ") ||
                              movement.note ||
                              "—"}
                          </p>
                        </div>
                        <span className="shrink-0 text-caption text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-meta text-muted-foreground">
                  No movements logged yet.
                </p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function LocationList({
  locations,
  unit,
  compact = false,
}: {
  locations: VariantStockLocation[];
  unit: string;
  compact?: boolean;
}) {
  if (locations.length === 0) {
    return <p className="text-meta text-muted-foreground">No stock in any location.</p>;
  }
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {locations.map((loc) => (
        <div
          key={loc.locationId}
          className={
            compact
              ? "flex items-center justify-between text-meta"
              : "flex items-center justify-between rounded-md border px-3 py-2 text-row-value"
          }
        >
          <span className={compact ? "text-muted-foreground" : "text-row-title font-normal"}>
            {loc.locationName}
          </span>
          <span className="font-semibold tabular-nums">
            {loc.quantity}
            {compact ? <span className="ml-1 font-normal text-muted-foreground">{unit}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-2.5 py-2">
      <p className="text-meta text-muted-foreground">{label}</p>
      <p className="text-row-value font-semibold tabular-nums">{value}</p>
    </div>
  );
}
