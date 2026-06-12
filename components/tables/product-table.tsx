import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states/states";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { ProductPerformanceRow } from "@/lib/analytics/types";

export function ProductTable({
  rows,
  currency = "USD",
}: {
  rows: ProductPerformanceRow[];
  currency?: string;
}) {
  if (!rows.length) {
    return <EmptyState title="No products" description="Run a sync to pull catalog + sales data." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>ASIN</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Units</TableHead>
          <TableHead className="text-right">Sessions</TableHead>
          <TableHead className="text-right">CVR</TableHead>
          <TableHead className="text-right">Buy Box</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="max-w-[260px] truncate font-medium">{r.title}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{r.asin}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.price, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.revenue, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(r.units)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(r.sessions)}</TableCell>
            <TableCell className="text-right tabular-nums">
              <span className={r.conversionRate < 0.08 ? "text-warning" : ""}>
                {formatPercent(r.conversionRate)}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.buyBoxPct)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
