import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CampaignRow {
  id: string;
  name: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  orders: number;
}

export function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Campaign Performance</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>ACOS</TableHead>
            <TableHead>ROAS</TableHead>
            <TableHead>Impr.</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>CTR</TableHead>
            <TableHead>Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>${row.spend.toFixed(2)}</TableCell>
              <TableCell>${row.sales.toFixed(2)}</TableCell>
              <TableCell>{(row.acos * 100).toFixed(1)}%</TableCell>
              <TableCell>{row.roas.toFixed(2)}</TableCell>
              <TableCell>{row.impressions.toLocaleString()}</TableCell>
              <TableCell>{row.clicks.toLocaleString()}</TableCell>
              <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
              <TableCell>{row.orders.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
