"use client";

import { MoreVertical, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/inventory/status-badge";
import type { InventoryItem } from "@/lib/data/inventory";

export type QuickAction = "adjust" | "transfer";

export function InventoryRow({
  item,
  onOpenDetail,
  onQuickAction,
}: {
  item: InventoryItem;
  onOpenDetail: (item: InventoryItem) => void;
  onQuickAction: (action: QuickAction, item: InventoryItem) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpenDetail(item);
      }}
      className="row-h row-px flex w-full items-center gap-3 border-b bg-background text-left transition-colors active:bg-muted/60"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-row-title font-medium">{item.name}</p>
          {item.locationCount > 1 ? (
            <span className="shrink-0 text-meta text-muted-foreground">
              +{item.locationCount - 1}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 truncate text-meta text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{item.primaryLocation ?? "Unassigned"}</span>
          <span aria-hidden>•</span>
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-row-value font-semibold tabular-nums">{item.totalStock}</p>
        <p className="text-meta text-muted-foreground">{item.unit}</p>
      </div>

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
        <DropdownMenuContent
          align="end"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem onSelect={() => onOpenDetail(item)}>View details</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onQuickAction("adjust", item)}>
            Adjust stock
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onQuickAction("transfer", item)}>
            Transfer stock
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
