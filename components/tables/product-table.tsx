import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductRow {
  id: string;
  asin: string;
  title: string;
  revenue: number;
  orders: number;
  conversionRate: number;
}

export function ProductTable({ rows }: { rows: ProductRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Product Performance</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ASIN</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>CVR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.asin}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell>${row.revenue.toFixed(2)}</TableCell>
              <TableCell>{row.orders}</TableCell>
              <TableCell>{(row.conversionRate * 100).toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
