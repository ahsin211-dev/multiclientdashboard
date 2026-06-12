import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ClientSearchTerm } from "@/lib/data/demo";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/utils";

type SearchTermTableProps = {
  rows: ClientSearchTerm[];
  currency: string;
};

export function SearchTermTable({ rows, currency }: SearchTermTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search term performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Search term</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>CVR</TableHead>
              <TableHead>ACOS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-slate-900">{row.term}</TableCell>
                <TableCell>{formatCurrency(row.spend, currency)}</TableCell>
                <TableCell>{formatCurrency(row.sales, currency)}</TableCell>
                <TableCell>{formatCompactNumber(row.clicks)}</TableCell>
                <TableCell>{formatCompactNumber(row.orders)}</TableCell>
                <TableCell>{formatPercent(row.ctr)}</TableCell>
                <TableCell>{formatPercent(row.cvr)}</TableCell>
                <TableCell>{formatPercent(row.acos)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
