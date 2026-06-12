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
import { SQPRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Eye, Shield, Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SQPTableProps {
  data: SQPRow[];
  title?: string;
}

const actionConfig = {
  SCALE: { label: "Scale", color: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  CUT: { label: "Cut", color: "bg-red-100 text-red-700", icon: TrendingDown },
  TEST: { label: "Test", color: "bg-amber-100 text-amber-700", icon: Activity },
  DEFEND: { label: "Defend", color: "bg-blue-100 text-blue-700", icon: Shield },
  MONITOR: { label: "Monitor", color: "bg-gray-100 text-gray-600", icon: Eye },
};

function ShareBar({ value, max = 50 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">{value}%</span>
    </div>
  );
}

export function SQPTable({ data, title = "Search Query Performance" }: SQPTableProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <span className="text-sm text-muted-foreground">{data.length} queries</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs min-w-48">Search Query</TableHead>
                  <TableHead className="font-semibold text-xs">Imp. Share</TableHead>
                  <TableHead className="font-semibold text-xs">Click Share</TableHead>
                  <TableHead className="font-semibold text-xs">Purchase Share</TableHead>
                  <TableHead className="font-semibold text-xs text-right">PPC Spend</TableHead>
                  <TableHead className="font-semibold text-xs text-right">PPC Sales</TableHead>
                  <TableHead className="font-semibold text-xs text-right">ACOS</TableHead>
                  <TableHead className="font-semibold text-xs text-right">ROAS</TableHead>
                  <TableHead className="font-semibold text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const cfg = actionConfig[row.action];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-52">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-sm font-medium truncate block max-w-48">
                              {row.query}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-64">{row.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <ShareBar value={row.impressionShare} />
                      </TableCell>
                      <TableCell>
                        <ShareBar value={row.clickShare} />
                      </TableCell>
                      <TableCell>
                        <ShareBar value={row.purchaseShare} max={20} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${row.ppcSpend.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${row.ppcSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={cn("font-medium", row.acos > 40 ? "text-red-500" : row.acos < 20 ? "text-emerald-600" : "text-amber-600")}>
                          {row.acos}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {row.roas}x
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", cfg.color)}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
