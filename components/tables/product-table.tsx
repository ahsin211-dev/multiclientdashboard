import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ProductTableRow } from "@/lib/analytics/service";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/utils";

type ProductTableProps = {
  rows: ProductTableRow[];
  currency: string;
};

export function ProductTable({ rows, currency }: ProductTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>ASIN</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>CVR</TableHead>
              <TableHead>TACOS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{row.product}</p>
                    <p className="text-xs text-slate-500">{row.category}</p>
                  </div>
                </TableCell>
                <TableCell>{row.asin}</TableCell>
                <TableCell>{formatCurrency(row.revenue, currency)}</TableCell>
                <TableCell>{formatCompactNumber(row.orders)}</TableCell>
                <TableCell>{formatCompactNumber(row.sessions)}</TableCell>
                <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                <TableCell>{formatPercent(row.tacos)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
