import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/states";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { SearchTermRow } from "@/lib/analytics/types";

export function SearchTermTable({
  rows,
  currency = "USD",
  targetAcos = 0.3,
}: {
  rows: SearchTermRow[];
  currency?: string;
  targetAcos?: number;
}) {
  if (!rows.length) {
    return <EmptyState title="No search terms" description="Run a sync to pull search-term reports." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Search term</TableHead>
          <TableHead>Match</TableHead>
          <TableHead className="text-right">Impr.</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Spend</TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="text-right">ACOS</TableHead>
          <TableHead className="text-right">CVR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.query}-${i}`}>
            <TableCell className="max-w-[260px] truncate font-medium">{r.query}</TableCell>
            <TableCell>
              <Badge variant="secondary">{r.matchType}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(r.impressions)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(r.clicks)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.spend, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.sales, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">
              <span className={r.orders === 0 ? "text-destructive" : r.acos > targetAcos ? "text-warning" : "text-success"}>
                {r.orders === 0 ? "No sales" : formatPercent(r.acos)}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.cvr)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
