"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";
import { AdvanceShipmentButton } from "@/components/shipments/advance-shipment-button";
import type { ShipmentListItem } from "@/lib/data/shipments";
import type { Tables } from "@/lib/supabase/types";

const TABS = [
  { value: "active", label: "Active" },
  { value: "ordered", label: "Ordered" },
  { value: "in_transit", label: "In transit" },
  { value: "customs", label: "Customs" },
  { value: "received", label: "Received" },
] as const;

export function ShipmentsView({
  shipments,
  locations,
  showCosts,
}: {
  shipments: ShipmentListItem[];
  locations: Tables<"locations">[];
  showCosts: boolean;
}) {
  const [tab, setTab] = useState<string>("active");

  const filtered = useMemo(() => {
    if (tab === "active") return shipments.filter((s) => s.status !== "received" && s.status !== "cancelled");
    return shipments.filter((s) => s.status === tab);
  }, [shipments, tab]);

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-3 w-full overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-meta text-muted-foreground">No shipments here.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {filtered.map((shipment) => (
            <li key={shipment.id} className="flex items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-row-title font-medium">{shipment.referenceCode}</p>
                  <ShipmentStatusBadge status={shipment.status} />
                </div>
                <p className="truncate text-meta text-muted-foreground">
                  {shipment.supplierName ?? "Unknown supplier"}
                  {shipment.originCountry ? ` • ${shipment.originCountry}` : ""} •{" "}
                  {shipment.totalUnits} units
                  {shipment.expectedArrival
                    ? ` • ETA ${new Date(shipment.expectedArrival).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                    : ""}
                </p>
                {showCosts ? (
                  <p className="text-meta text-muted-foreground">
                    Freight + customs: {shipment.currency} {(shipment.shippingCost + shipment.customsCost).toFixed(2)}
                  </p>
                ) : null}
              </div>
              <AdvanceShipmentButton
                shipmentId={shipment.id}
                status={shipment.status}
                locations={locations}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
