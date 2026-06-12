"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignPerformance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CampaignTableProps {
  campaigns: CampaignPerformance[];
  title?: string;
}

function AcosCell({ acos }: { acos: number }) {
  const isGood = acos < 20;
  const isBad = acos > 40;
  return (
    <span
      className={cn(
        "font-medium",
        isGood && "text-emerald-600",
        isBad && "text-red-500",
        !isGood && !isBad && "text-amber-600"
      )}
    >
      {acos}%
    </span>
  );
}

function CampaignTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    SPONSORED_PRODUCTS: "SP",
    SPONSORED_BRANDS: "SB",
    SPONSORED_DISPLAY: "SD",
  };
  const colors: Record<string, string> = {
    SPONSORED_PRODUCTS: "bg-blue-100 text-blue-700",
    SPONSORED_BRANDS: "bg-purple-100 text-purple-700",
    SPONSORED_DISPLAY: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", colors[type] ?? "bg-gray-100 text-gray-600")}>
      {labels[type] ?? type}
    </span>
  );
}

export function CampaignTable({ campaigns, title = "Campaign Performance" }: CampaignTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">{campaigns.length} campaigns</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs">Campaign</TableHead>
                <TableHead className="font-semibold text-xs text-right">Spend</TableHead>
                <TableHead className="font-semibold text-xs text-right">Sales</TableHead>
                <TableHead className="font-semibold text-xs text-right">ACOS</TableHead>
                <TableHead className="font-semibold text-xs text-right">ROAS</TableHead>
                <TableHead className="font-semibold text-xs text-right">CTR</TableHead>
                <TableHead className="font-semibold text-xs text-right">CVR</TableHead>
                <TableHead className="font-semibold text-xs text-right">Orders</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-muted/30">
                  <TableCell className="max-w-64">
                    <div className="flex items-center gap-2">
                      <CampaignTypeBadge type={campaign.type} />
                      <span className="text-sm font-medium truncate">{campaign.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${campaign.spend.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${campaign.sales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <AcosCell acos={campaign.acos} />
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={cn("font-medium", campaign.roas >= 4 ? "text-emerald-600" : campaign.roas < 2 ? "text-red-500" : "")}>
                      {campaign.roas}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {campaign.ctr}%
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {campaign.cvr}%
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {campaign.orders.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={campaign.state === "ENABLED" ? "default" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {campaign.state.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
