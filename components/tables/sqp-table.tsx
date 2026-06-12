import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/states";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { SqpAnalyzedRow } from "@/lib/sqp/analyzer";

const actionVariant: Record<string, BadgeProps["variant"]> = {
  SCALE: "success",
  CUT: "destructive",
  TEST: "warning",
  DEFEND: "default",
  MAINTAIN: "secondary",
};

export function SqpTable({
  rows,
  currency = "USD",
}: {
  rows: SqpAnalyzedRow[];
  currency?: string;
}) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No SQP data"
        description="Connect Brand Analytics / run a sync to analyze Search Query Performance."
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Query</TableHead>
          <TableHead className="text-right">Impr. share</TableHead>
          <TableHead className="text-right">Click share</TableHead>
          <TableHead className="text-right">Purch. share</TableHead>
          <TableHead className="text-right">PPC spend</TableHead>
          <TableHead className="text-right">PPC sales</TableHead>
          <TableHead className="text-right">ACOS</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.query}-${i}`}>
            <TableCell className="max-w-[180px] truncate font-medium">{r.query}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.impressionShare)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.clickShare)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(r.purchaseShare)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.ppcSpend, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.ppcSales, currency)}</TableCell>
            <TableCell className="text-right tabular-nums">{r.acos > 0 ? formatPercent(r.acos) : "—"}</TableCell>
            <TableCell>
              <Badge variant={actionVariant[r.action] ?? "secondary"}>{r.action}</Badge>
            </TableCell>
            <TableCell className="max-w-[280px] text-xs text-muted-foreground">{r.reason}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
