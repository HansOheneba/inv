import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { StatusBadge } from "@/components/inventory/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ProductPerformanceRow } from "@/lib/data/product-performance";

const RING_COLOR: Record<ProductPerformanceRow["status"], string> = {
  available: "stroke-status-available",
  low: "stroke-status-low",
  out: "stroke-status-out",
};

export function ProductPerformanceTable({ rows }: { rows: ProductPerformanceRow[] }) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-section-title">Product performance</p>
          <Button variant="outline" nativeButton={false} render={<Link href="/inventory" />}>
            View inventory
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 text-meta text-muted-foreground">Add products to see performance here.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Demand (30d)</TableHead>
                  <TableHead className="text-right">Orders (30d)</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell className="row-py">
                      <span className="truncate text-row-title font-medium">{row.name}</span>
                      <p className="text-meta text-muted-foreground">
                        {row.sku ?? "No SKU"} • {row.category ?? "Uncategorized"}
                      </p>
                    </TableCell>
                    <TableCell className="row-py">
                      <CircularProgress value={row.healthScore} size={34} className={RING_COLOR[row.status]}>
                        <span className="text-caption font-medium tabular-nums">{row.healthScore}</span>
                      </CircularProgress>
                    </TableCell>
                    <TableCell className="row-py">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              row.demandPct > 0 ? "bg-accent-teal" : "bg-transparent",
                            )}
                            style={{ width: `${row.demandPct}%` }}
                          />
                        </div>
                        <span className="text-meta text-muted-foreground tabular-nums">{row.demandPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {row.ordersLast30d}
                    </TableCell>
                    <TableCell className="row-py">
                      {row.status === "available" ? (
                        <span className="text-meta text-muted-foreground">No alerts</span>
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </TableCell>
                    <TableCell className="row-py">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href="/inventory" />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
