"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, PackageSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InventoryRow, type QuickAction } from "@/components/inventory/inventory-row";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { TransferStockDialog } from "@/components/inventory/transfer-stock-dialog";
import { ProductDetailSheet } from "@/components/inventory/product-detail-sheet";
import { getProductDetailAction } from "@/lib/actions/inventory";
import type { InventoryItem, ProductDetail } from "@/lib/data/inventory";
import type { Tables } from "@/lib/supabase/types";

export function InventoryList({
  items,
  locations,
  showCosts,
}: {
  items: InventoryItem[];
  locations: Tables<"locations">[];
  showCosts: boolean;
}) {
  const [query, setQuery] = useState("");
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ type: QuickAction; item: InventoryItem } | null>(
    null,
  );

  function openDetail(product: InventoryItem) {
    setDetailItem(product);
    setDetailOpen(true);
    setDetailLoading(true);
    getProductDetailAction(product.productId).then((result) => {
      setDetail(result);
      setDetailLoading(false);
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-12 z-30 border-b bg-background px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SKU, category…"
            className="h-9 pl-8 text-row-value"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-16 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="text-row-title font-medium">No products match &ldquo;{query}&rdquo;</p>
          <p className="text-meta text-muted-foreground">Try a different name, SKU, or category.</p>
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = filtered[virtualRow.index];
              return (
                <div
                  key={item.productId}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <InventoryRow
                    item={item}
                    onOpenDetail={openDetail}
                    onQuickAction={(action, product) => setActionDialog({ type: action, item: product })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ProductDetailSheet
        item={detailItem}
        detail={detail}
        loading={detailLoading}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        showCosts={showCosts}
      />
      <AdjustStockDialog
        item={actionDialog?.type === "adjust" ? actionDialog.item : null}
        locations={locations}
        open={actionDialog?.type === "adjust"}
        onOpenChange={(open) => !open && setActionDialog(null)}
      />
      <TransferStockDialog
        item={actionDialog?.type === "transfer" ? actionDialog.item : null}
        locations={locations}
        open={actionDialog?.type === "transfer"}
        onOpenChange={(open) => !open && setActionDialog(null)}
      />
    </div>
  );
}
