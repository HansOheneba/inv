"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical, PackageSearch, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/inventory/status-badge";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { TransferStockDialog } from "@/components/inventory/transfer-stock-dialog";
import { ProductDetailSheet } from "@/components/inventory/product-detail-sheet";
import { getProductDetailAction } from "@/lib/actions/inventory";
import { cn } from "@/lib/utils";
import type { InventoryItem, ProductDetail } from "@/lib/data/inventory";
import type { Tables } from "@/lib/supabase/types";

type QuickAction = "adjust" | "transfer";
type SortField = "name" | "sku" | "category" | "location" | "stock" | "status" | "price";
type SortDir = "asc" | "desc";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    value,
  );

const STATUS_ORDER: Record<InventoryItem["status"], number> = { out: 0, low: 1, available: 2 };

function compare(a: InventoryItem, b: InventoryItem, field: SortField): number {
  switch (field) {
    case "name":
      return a.name.localeCompare(b.name);
    case "sku":
      return (a.sku ?? "").localeCompare(b.sku ?? "");
    case "category":
      return (a.category ?? "").localeCompare(b.category ?? "");
    case "location":
      return (a.primaryLocation ?? "").localeCompare(b.primaryLocation ?? "");
    case "stock":
      return a.totalStock - b.totalStock;
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "price":
      return a.salePrice - b.salePrice;
    default:
      return 0;
  }
}

export function InventoryTable({
  items,
  locations,
  showCosts,
}: {
  items: InventoryItem[];
  locations: Tables<"locations">[];
  showCosts: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "name", dir: "asc" });
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

  function toggleSort(field: SortField) {
    setSort((current) =>
      current.field === field
        ? { field, dir: current.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" },
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q),
        )
      : items;

    return [...base].sort((a, b) => {
      const result = compare(a, b, sort.field);
      return sort.dir === "asc" ? result : -result;
    });
  }, [items, query, sort]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, SKU, category…"
          className="h-9 pl-8 text-row-value"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border px-8 py-16 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="text-row-title font-medium">No products match &ldquo;{query}&rdquo;</p>
          <p className="text-meta text-muted-foreground">Try a different name, SKU, or category.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="name" sort={sort} onSort={toggleSort}>
                  Name
                </SortableHead>
                <SortableHead field="sku" sort={sort} onSort={toggleSort}>
                  SKU
                </SortableHead>
                <SortableHead field="category" sort={sort} onSort={toggleSort}>
                  Category
                </SortableHead>
                <SortableHead field="location" sort={sort} onSort={toggleSort}>
                  Location
                </SortableHead>
                <SortableHead field="stock" sort={sort} onSort={toggleSort} align="right">
                  Stock
                </SortableHead>
                <SortableHead field="status" sort={sort} onSort={toggleSort}>
                  Status
                </SortableHead>
                {showCosts ? (
                  <SortableHead field="price" sort={sort} onSort={toggleSort} align="right">
                    Margin
                  </SortableHead>
                ) : (
                  <SortableHead field="price" sort={sort} onSort={toggleSort} align="right">
                    Price
                  </SortableHead>
                )}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.productId}
                  className="cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <TableCell className="row-py">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-row-title font-medium">{item.name}</span>
                      {item.locationCount > 1 ? (
                        <span className="shrink-0 text-meta text-muted-foreground">
                          +{item.locationCount - 1}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="row-py text-meta text-muted-foreground">
                    {item.sku ?? "—"}
                  </TableCell>
                  <TableCell className="row-py text-meta text-muted-foreground">
                    {item.category ?? "—"}
                  </TableCell>
                  <TableCell className="row-py text-meta text-muted-foreground">
                    {item.primaryLocation ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                    {item.totalStock}
                    <span className="ml-1 text-meta font-normal text-muted-foreground">{item.unit}</span>
                  </TableCell>
                  <TableCell className="row-py">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  {showCosts ? (
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {currency(item.salePrice - item.costPrice)}
                    </TableCell>
                  ) : (
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {currency(item.salePrice)}
                    </TableCell>
                  )}
                  <TableCell className="row-py">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Quick actions for ${item.name}`}
                          />
                        }
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => openDetail(item)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActionDialog({ type: "adjust", item })}>
                          Adjust stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActionDialog({ type: "transfer", item })}>
                          Transfer stock
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

function SortableHead({
  field,
  sort,
  onSort,
  align = "left",
  children,
}: {
  field: SortField;
  sort: { field: SortField; dir: SortDir };
  onSort: (field: SortField) => void;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const active = sort.field === field;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 text-meta font-medium text-muted-foreground transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {children}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}
