import { getSales, getSaleFormOptions } from "@/lib/data/sales";
import { RecordSaleDialog } from "@/components/sales/record-sale-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const currency = (value: number, code: string) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(
    value,
  );

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-status-available/15 text-status-available",
  pending: "bg-status-low/25 text-status-low",
  refunded: "bg-status-out/15 text-status-out",
};

export default async function SalesPage() {
  const [sales, options] = await Promise.all([getSales(), getSaleFormOptions()]);
  const todayTotal = sales
    .filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title font-semibold">Sales</h1>
          <p className="text-meta text-muted-foreground">
            {currency(todayTotal, "GHS")} sold today • {sales.length} recent orders
          </p>
        </div>
        <RecordSaleDialog options={options} />
      </div>

      {sales.length === 0 ? (
        <p className="py-12 text-center text-meta text-muted-foreground">
          No sales recorded yet. Tap &ldquo;Record sale&rdquo; to log your first one.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-meta">Customer</TableHead>
                <TableHead className="text-meta">Channel</TableHead>
                <TableHead className="text-meta">Status</TableHead>
                <TableHead className="text-right text-meta">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-row-value">
                    <div className="font-medium">{sale.customerName ?? "Walk-in"}</div>
                    <div className="text-meta text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-row-value text-muted-foreground">
                    {sale.channelName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("border-transparent text-meta capitalize", STATUS_STYLE[sale.status])}
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-row-value font-semibold tabular-nums">
                    {currency(sale.totalAmount, sale.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
