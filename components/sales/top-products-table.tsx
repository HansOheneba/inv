import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopProductRow } from "@/lib/data/sales";

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(
    value,
  );

export function TopProductsTable({ rows }: { rows: TopProductRow[] }) {
  return (
    <Card className="h-full gap-0 py-5">
      <CardContent className="px-5">
        <div className="mb-4">
          <p className="text-section-title">Top products</p>
          <p className="text-meta text-muted-foreground">By revenue · last 30 days</p>
        </div>

        {rows.length === 0 ? (
          <p className="text-meta text-muted-foreground">
            Nothing sold yet in this period. Deliver orders from the Orders board to build this list.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-meta">Product</TableHead>
                  <TableHead className="text-right text-meta">Units</TableHead>
                  <TableHead className="text-right text-meta">Orders</TableHead>
                  <TableHead className="text-right text-meta">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell className="row-py">
                      <p className="truncate text-row-title font-medium">{row.name}</p>
                      <p className="text-meta text-muted-foreground">
                        {[row.brand, row.category].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {row.unitsSold}
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value tabular-nums text-muted-foreground">
                      {row.orders}
                    </TableCell>
                    <TableCell className="row-py text-right text-row-value font-semibold tabular-nums">
                      {currency(row.revenue)}
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
