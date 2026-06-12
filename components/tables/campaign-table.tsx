import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type CampaignTableRow } from "@/lib/analytics/service";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/utils";

type CampaignTableProps = {
  rows: CampaignTableRow[];
  currency: string;
};

export function CampaignTable({ rows, currency }: CampaignTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>ACOS</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{row.campaign}</p>
                    <p className="text-xs text-slate-500">{row.channel}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.status}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(row.spend, currency)}</TableCell>
                <TableCell>{formatCurrency(row.sales, currency)}</TableCell>
                <TableCell>{formatPercent(row.acos)}</TableCell>
                <TableCell>{row.roas.toFixed(2)}x</TableCell>
                <TableCell>{formatCompactNumber(row.clicks)}</TableCell>
                <TableCell>{formatCompactNumber(row.orders)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
