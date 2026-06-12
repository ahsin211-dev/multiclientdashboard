import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SQPInsightRow } from "@/lib/analytics/service";
import { formatCurrency, formatPercent } from "@/lib/utils";

type SQPTableProps = {
  rows: SQPInsightRow[];
  currency: string;
};

function actionVariant(action: SQPInsightRow["recommendedAction"]) {
  switch (action) {
    case "Scale":
      return "success";
    case "Cut":
      return "danger";
    case "Test":
      return "warning";
    default:
      return "secondary";
  }
}

export function SQPTable({ rows, currency }: SQPTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SQP analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Impression share</TableHead>
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
            {rows.map((row) => (
              <TableRow key={row.query}>
                <TableCell className="font-medium text-slate-900">{row.query}</TableCell>
                <TableCell>{formatPercent(row.impressionShare)}</TableCell>
                <TableCell>{formatPercent(row.clickShare)}</TableCell>
                <TableCell>{formatPercent(row.purchaseShare)}</TableCell>
                <TableCell>{formatCurrency(row.spend, currency)}</TableCell>
                <TableCell>{formatCurrency(row.sales, currency)}</TableCell>
                <TableCell>{formatPercent(row.acos)}</TableCell>
                <TableCell>
                  <Badge variant={actionVariant(row.recommendedAction)}>{row.recommendedAction}</Badge>
                </TableCell>
                <TableCell className="max-w-[320px] text-sm text-slate-500">{row.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
