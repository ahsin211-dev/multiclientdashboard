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
import type { CampaignPerformanceRow } from "@/lib/analytics/types";

const typeLabel: Record<string, string> = {
  SPONSORED_PRODUCTS: "SP",
  SPONSORED_BRANDS: "SB",
  SPONSORED_DISPLAY: "SD",
};

export function CampaignTable({
  rows,
  currency = "USD",
  targetAcos = 0.3,
}: {
  rows: CampaignPerformanceRow[];
  currency?: string;
  targetAcos?: number;
}) {
  if (!rows.length) {
    return <EmptyState title="No campaigns" description="Run a sync to pull campaign data." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Spend</TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="text-right">ACOS</TableHead>
          <TableHead className="text-right">ROAS</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">CPC</TableHead>
          <TableHead className="text-right">Orders</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="max-w-[220px] truncate font-medium">{r.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{typeLabel[r.type] ?? r.type}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(r.spend, currency)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(r.sales, currency)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <span className={r.acos > targetAcos && r.acos > 0 ? "text-destructive" : r.acos > 0 ? "text-success" : ""}>
                {r.acos > 0 ? formatPercent(r.acos) : "—"}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.roas > 0 ? `${r.roas.toFixed(1)}x` : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.ctr, 2)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.cpc, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(r.orders)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
