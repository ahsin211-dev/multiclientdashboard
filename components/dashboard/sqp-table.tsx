import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { SQPInsight } from "@/lib/types";

const actionVariant: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  SCALE: "success",
  CUT: "destructive",
  TEST: "warning",
  DEFEND: "default",
  MONITOR: "secondary",
};

interface SQPTableProps {
  insights: SQPInsight[];
}

export function SQPTable({ insights }: SQPTableProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Query Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No SQP data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Query Performance Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Imp Share</TableHead>
              <TableHead className="text-right">Click Share</TableHead>
              <TableHead className="text-right">Purchase Share</TableHead>
              <TableHead className="text-right">PPC Spend</TableHead>
              <TableHead className="text-right">PPC Sales</TableHead>
              <TableHead className="text-right">ACOS</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((s) => (
              <TableRow key={s.query}>
                <TableCell className="font-medium">{s.query}</TableCell>
                <TableCell className="text-right">{formatPercent(s.impressionShare)}</TableCell>
                <TableCell className="text-right">{formatPercent(s.clickShare)}</TableCell>
                <TableCell className="text-right">{formatPercent(s.purchaseShare)}</TableCell>
                <TableCell className="text-right">{formatCurrency(s.ppcSpend)}</TableCell>
                <TableCell className="text-right">{formatCurrency(s.ppcSales)}</TableCell>
                <TableCell className="text-right">{formatPercent(s.acos)}</TableCell>
                <TableCell>
                  <Badge variant={actionVariant[s.recommendedAction] ?? "secondary"}>
                    {s.recommendedAction}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {s.reason}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
