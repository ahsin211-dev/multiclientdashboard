"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SpendSalesChart } from "@/components/charts/spend-sales-chart";
import { AcosChart } from "@/components/charts/acos-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import {
  generateMetricSummary,
  generateChartData,
  generateCampaigns,
  generateProducts,
  MOCK_CLIENTS,
} from "@/lib/mock-data";
import { MetricSummary, ChartDataPoint, CampaignPerformance, ProductPerformance } from "@/lib/types";
import {
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
  Package,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDashboardPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const [dateRange, setDateRange] = useState("last30");
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];

  useEffect(() => {
    setLoading(true);
    const days = dateRange === "last7" ? 7 : dateRange === "last14" ? 14 : dateRange === "last60" ? 60 : dateRange === "last90" ? 90 : 30;
    setTimeout(() => {
      setMetrics(generateMetricSummary());
      setChartData(generateChartData(days));
      setCampaigns(generateCampaigns());
      setProducts(generateProducts());
      setLoading(false);
    }, 400);
  }, [dateRange, clientId]);

  const handleSync = async () => {
    setSyncing(true);
    toast.info("Sync started", { description: "Fetching latest data from Amazon..." });
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(false);
    toast.success("Sync complete", { description: "Data updated successfully" });
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`${client.brandName} Dashboard`}
        subtitle={`Amazon ${client.marketplace} · ${dateRange === "last7" ? "Last 7 days" : dateRange === "last14" ? "Last 14 days" : dateRange === "last30" ? "Last 30 days" : dateRange === "last60" ? "Last 60 days" : "Last 90 days"}`}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showSyncButton
        onSync={handleSync}
        isSyncing={syncing}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-7 w-28" /></CardContent></Card>
            ))}
          </div>
        ) : metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Ad Spend" value={`$${metrics.spend.toLocaleString()}`} change={metrics.spendChange} changeLabel="vs prior" icon={<DollarSign className="w-4 h-4 text-primary" />} />
            <MetricCard title="Ad Sales" value={`$${metrics.sales.toLocaleString()}`} change={metrics.salesChange} changeLabel="vs prior" icon={<ShoppingCart className="w-4 h-4 text-primary" />} />
            <MetricCard title="ACOS" value={`${metrics.acos}%`} change={metrics.acosChange} changeLabel="vs prior" icon={<Target className="w-4 h-4 text-amber-500" />} highlight="bad" />
            <MetricCard title="ROAS" value={`${metrics.roas}x`} change={metrics.roasChange} changeLabel="vs prior" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
            <MetricCard title="Impressions" value={metrics.impressions.toLocaleString()} change={metrics.impressionsChange} changeLabel="vs prior" icon={<Eye className="w-4 h-4 text-primary" />} />
            <MetricCard title="Clicks" value={metrics.clicks.toLocaleString()} change={metrics.clicksChange} changeLabel="vs prior" icon={<MousePointer className="w-4 h-4 text-primary" />} />
            <MetricCard title="Orders" value={metrics.orders.toLocaleString()} change={metrics.ordersChange} changeLabel="vs prior" icon={<Package className="w-4 h-4 text-primary" />} />
            <MetricCard title="TACOS" value={`${metrics.tacos}%`} description="Total ad cost / total revenue" icon={<BarChart2 className="w-4 h-4 text-amber-500" />} highlight="bad" />
          </div>
        )}

        {/* Secondary Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: "CTR", value: `${metrics.ctr}%`, desc: "Click-through rate" },
              { label: "CPC", value: `$${metrics.cpc}`, desc: "Cost per click" },
              { label: "CVR", value: `${metrics.cvr}%`, desc: "Conversion rate" },
              { label: "Revenue", value: `$${metrics.revenue.toLocaleString()}`, desc: "Total revenue" },
              { label: "CPA", value: `$${(metrics.spend / metrics.orders).toFixed(2)}`, desc: "Cost per acquisition" },
              { label: "AOV", value: `$${(metrics.sales / metrics.orders).toFixed(2)}`, desc: "Avg. order value" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="text-lg font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpendSalesChart data={chartData} title={`${client.brandName} — Spend vs Sales`} />
          </div>
          <div>
            <AcosChart data={chartData} />
          </div>
        </div>

        {/* Campaign Table */}
        <CampaignTable campaigns={campaigns} title="Campaign Performance" />

        {/* Product Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Product Performance</CardTitle>
              <span className="text-sm text-muted-foreground">{products.length} ASINs</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs">Product</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Revenue</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Units</TableHead>
                    <TableHead className="font-semibold text-xs text-right">CVR</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Ad Spend</TableHead>
                    <TableHead className="font-semibold text-xs text-right">ACOS</TableHead>
                    <TableHead className="font-semibold text-xs text-right">TACOS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.asin} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium truncate max-w-72">{p.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.asin}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">${p.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{p.units}</TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={p.cvr > 10 ? "text-emerald-600 font-medium" : p.cvr < 5 ? "text-red-500 font-medium" : ""}>
                          {p.cvr}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">${p.adSpend.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={p.acos < 20 ? "text-emerald-600 font-medium" : p.acos > 40 ? "text-red-500 font-medium" : "text-amber-600 font-medium"}>
                          {p.acos}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{p.tacos}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
