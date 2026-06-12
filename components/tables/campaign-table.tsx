import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignPerformance } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

export function CampaignTable({ campaigns }: { campaigns: CampaignPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign performance</CardTitle>
        <CardDescription>Top campaigns by selected-period activity.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>ACOS</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="font-medium text-slate-950">{campaign.name}</div>
                  <Badge variant="success">{campaign.state}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                <TableCell>{formatCurrency(campaign.sales)}</TableCell>
                <TableCell>{formatPercent(campaign.acos)}</TableCell>
                <TableCell>{formatRatio(campaign.roas)}</TableCell>
                <TableCell>{formatNumber(campaign.clicks)}</TableCell>
                <TableCell>{formatNumber(campaign.orders)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
