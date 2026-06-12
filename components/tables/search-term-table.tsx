import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SearchTermRow {
  id: string;
  query: string;
  spend: number;
  sales: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
}

export function SearchTermTable({ rows }: { rows: SearchTermRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Search Terms</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>ACOS</TableHead>
            <TableHead>ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.query}</TableCell>
              <TableCell>${row.spend.toFixed(2)}</TableCell>
              <TableCell>${row.sales.toFixed(2)}</TableCell>
              <TableCell>{row.clicks}</TableCell>
              <TableCell>{row.orders}</TableCell>
              <TableCell>{(row.acos * 100).toFixed(2)}%</TableCell>
              <TableCell>{row.roas.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
