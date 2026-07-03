"use client";

import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, RotateCcw, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/inventory/status-badge";
import type { InventoryItem, ProductDetail } from "@/lib/data/inventory";

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
}: {
  item: InventoryItem | null;
  detail: ProductDetail | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showCosts: boolean;
}) {
  // Ignore stale detail left over from a previously opened product.
  const visibleDetail = detail && item && detail.productId === item.productId ? detail : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        {item ? (
          <>
            <SheetHeader className="pb-2">
              <SheetTitle className="text-row-title">{item.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-meta">
                {item.sku ? <span>SKU {item.sku}</span> : null}
                <StatusBadge status={item.status} />
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2 px-4">
              <StatTile label="In stock" value={`${item.totalStock} ${item.unit}`} />
              <StatTile label="Reorder at" value={`${item.reorderPoint} ${item.unit}`} />
              {showCosts ? (
                <StatTile label="Margin" value={`GHS ${(item.salePrice - item.costPrice).toFixed(2)}`} />
              ) : (
                <StatTile label="Price" value={`GHS ${item.salePrice.toFixed(2)}`} />
              )}
            </div>

            <Separator className="my-3" />

            <div className="px-4 pb-2">
              <h3 className="mb-2 text-meta font-medium text-muted-foreground">Stock by location</h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visibleDetail?.stockByLocation.length ? (
                    visibleDetail.stockByLocation.map((loc) => (
                      <div
                        key={loc.locationId}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-row-value"
                      >
                        <span className="text-row-title font-normal">{loc.locationName}</span>
                        <span className="font-semibold tabular-nums">{loc.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-meta text-muted-foreground">No stock recorded anywhere yet.</p>
                  )}
                </div>
              )}
            </div>

            <Separator className="my-3" />

            <div className="px-4 pb-8">
              <h3 className="mb-2 text-meta font-medium text-muted-foreground">Recent activity</h3>
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
                      <li key={movement.id} className="flex items-start gap-2.5">
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
                            {[movement.fromLocation, movement.toLocation].filter(Boolean).join(" → ") ||
                              movement.note ||
                              "—"}
                          </p>
                        </div>
                        <span className="shrink-0 text-caption text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-meta text-muted-foreground">No movements logged yet.</p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
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
