import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SqpInsight } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const variants = {
  Scale: "success",
  Cut: "danger",
  Test: "warning",
  Defend: "default",
} as const;

export function SqpTable({ insights }: { insights: SqpInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SQP analyzer</CardTitle>
        <CardDescription>Joins Search Query Performance with PPC investment and recommends action.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Impr. share</TableHead>
              <TableHead>Click share</TableHead>
              <TableHead>Purchase share</TableHead>
              <TableHead>PPC spend</TableHead>
              <TableHead>PPC sales</TableHead>
              <TableHead>ACOS</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((insight) => (
              <TableRow key={insight.query}>
                <TableCell className="font-medium text-slate-950">{insight.query}</TableCell>
                <TableCell>{formatPercent(insight.impressionShare)}</TableCell>
                <TableCell>{formatPercent(insight.clickShare)}</TableCell>
                <TableCell>{formatPercent(insight.purchaseShare)}</TableCell>
                <TableCell>{formatCurrency(insight.ppcSpend)}</TableCell>
                <TableCell>{formatCurrency(insight.ppcSales)}</TableCell>
                <TableCell>{formatPercent(insight.acos)}</TableCell>
                <TableCell>
                  <Badge variant={variants[insight.recommendedAction]}>{insight.recommendedAction}</Badge>
                </TableCell>
                <TableCell className="min-w-64 text-slate-600">
                  {insight.reason}
                  <div className="mt-1 text-xs text-slate-400">
                    {formatNumber(insight.ppcClicks)} clicks, {formatNumber(insight.ppcOrders)} orders
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
