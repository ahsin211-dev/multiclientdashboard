import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { SpendSalesChart, RevenueChart } from "@/components/charts/trend-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { SyncButton } from "@/components/sync/sync-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db/prisma";
import {
  getMetricsWithComparison,
  getTrend,
  getCampaignPerformance,
  getProductPerformance,
  getSearchTerms,
} from "@/lib/analytics/service";
import { parseRange } from "@/lib/analytics/date-ranges";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ClientDashboard({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  const range = parseRange(searchParams.from, searchParams.to, (searchParams.period as any) ?? "30d");

  const [metrics, trend, campaigns, products, searchTerms] = await Promise.all([
    getMetricsWithComparison(client.id, range),
    getTrend(client.id, range),
    getCampaignPerformance(client.id, range),
    getProductPerformance(client.id, range),
    getSearchTerms(client.id, range, 50),
  ]);

  return (
    <>
      <PageHeader
        title={client.brandName}
        description={
          client.lastSyncedAt
            ? `Last synced ${format(client.lastSyncedAt, "MMM d, yyyy 'at' h:mm a")} · ${client.marketplace}`
            : `${client.marketplace} · not yet synced`
        }
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelector />
            <SyncButton clientId={client.id} variant="outline" />
          </div>
        }
      />

      <MetricGrid metrics={metrics} currency={client.currency} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Spend vs Sales</CardTitle>
            <Badge variant="secondary">ACOS overlay</Badge>
          </CardHeader>
          <CardContent>
            <SpendSalesChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="campaigns">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="search-terms">Search Terms</TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns">
              <CampaignTable rows={campaigns} currency={client.currency} />
            </TabsContent>
            <TabsContent value="products">
              <ProductTable rows={products} currency={client.currency} />
            </TabsContent>
            <TabsContent value="search-terms">
              <SearchTermTable rows={searchTerms} currency={client.currency} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
