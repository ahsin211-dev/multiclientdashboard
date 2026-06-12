"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SpendSalesChart } from "@/components/charts/spend-sales-chart";
import { AcosChart } from "@/components/charts/acos-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import {
  generateMetricSummary,
  generateChartData,
  generateCampaigns,
  MOCK_CLIENTS,
} from "@/lib/mock-data";
import { MetricSummary, ChartDataPoint, CampaignPerformance } from "@/lib/types";
import {
  DollarSign,
  ShoppingCart,
  BarChart2,
  TrendingUp,
  Eye,
  MousePointer,
  Package,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("last30");
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const days = dateRange === "last7" ? 7 : dateRange === "last14" ? 14 : dateRange === "last60" ? 60 : dateRange === "last90" ? 90 : 30;
    // Simulate async data fetch
    setTimeout(() => {
      setMetrics(generateMetricSummary());
      setChartData(generateChartData(days));
      setCampaigns(generateCampaigns());
      setLoading(false);
    }, 400);
  }, [dateRange]);

  const activeClients = MOCK_CLIENTS.filter((c) => c.isActive);
  const totalSpendAllClients = metrics ? Math.round(metrics.spend * activeClients.length * 0.7) : 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Agency Overview"
        subtitle={`${activeClients.length} active clients`}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Client Cards */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Client Accounts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_CLIENTS.map((client) => {
              const m = generateMetricSummary();
              return (
                <Link key={client.id} href={`/clients/${client.id}/dashboard`}>
                  <Card className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${client.isActive ? "border-l-primary" : "border-l-muted"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">{client.brandName}</p>
                          <p className="text-xs text-muted-foreground">{client.marketplace} Marketplace</p>
                        </div>
                        <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Ad Spend</p>
                          <p className="text-sm font-bold">${m.spend.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ACOS</p>
                          <p className={`text-sm font-bold ${m.acos < 25 ? "text-emerald-600" : m.acos > 40 ? "text-red-500" : "text-amber-600"}`}>
                            {m.acos}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sales</p>
                          <p className="text-sm font-bold">${m.sales.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ROAS</p>
                          <p className="text-sm font-bold">{m.roas}x</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Aggregate Metrics */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Aggregate Performance (All Clients)
          </h2>
          {loading ? (
            <MetricsSkeleton />
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Ad Spend"
                value={`$${metrics.spend.toLocaleString()}`}
                change={metrics.spendChange}
                changeLabel="vs prior period"
                icon={<DollarSign className="w-4 h-4 text-primary" />}
              />
              <MetricCard
                title="Total Ad Sales"
                value={`$${metrics.sales.toLocaleString()}`}
                change={metrics.salesChange}
                changeLabel="vs prior period"
                icon={<ShoppingCart className="w-4 h-4 text-primary" />}
              />
              <MetricCard
                title="Avg. ACOS"
                value={`${metrics.acos}%`}
                change={metrics.acosChange}
                changeLabel="vs prior period"
                icon={<Target className="w-4 h-4 text-amber-500" />}
                highlight="bad"
              />
              <MetricCard
                title="Avg. ROAS"
                value={`${metrics.roas}x`}
                change={metrics.roasChange}
                changeLabel="vs prior period"
                icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
              />
              <MetricCard
                title="Impressions"
                value={metrics.impressions.toLocaleString()}
                change={metrics.impressionsChange}
                changeLabel="vs prior period"
                icon={<Eye className="w-4 h-4 text-primary" />}
              />
              <MetricCard
                title="Clicks"
                value={metrics.clicks.toLocaleString()}
                change={metrics.clicksChange}
                changeLabel="vs prior period"
                icon={<MousePointer className="w-4 h-4 text-primary" />}
              />
              <MetricCard
                title="Total Orders"
                value={metrics.orders.toLocaleString()}
                change={metrics.ordersChange}
                changeLabel="vs prior period"
                icon={<Package className="w-4 h-4 text-primary" />}
              />
              <MetricCard
                title="TACOS"
                value={`${metrics.tacos}%`}
                icon={<BarChart2 className="w-4 h-4 text-amber-500" />}
                highlight="bad"
                description="Total Advertising Cost of Sale"
              />
            </div>
          ) : null}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpendSalesChart data={chartData} />
          </div>
          <div>
            <AcosChart data={chartData} />
          </div>
        </div>

        {/* Campaign Table */}
        <CampaignTable campaigns={campaigns} title="Top Campaign Performance" />
      </div>
    </div>
  );
}
