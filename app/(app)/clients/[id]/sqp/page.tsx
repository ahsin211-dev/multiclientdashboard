import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { SqpTable } from "@/components/tables/sqp-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { analyzeSqp } from "@/lib/sqp/analyzer";
import { parseRange } from "@/lib/analytics/date-ranges";

export const dynamic = "force-dynamic";

export default async function SqpPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  const range = parseRange(searchParams.from, searchParams.to, (searchParams.period as any) ?? "30d");
  const rows = await analyzeSqp(client.id, range);

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="SQP Analyzer"
        description="Search Query Performance joined with PPC data — with prioritized actions."
        actions={<PeriodSelector />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Scale" value={String(counts.SCALE ?? 0)} hint="Efficient, grow it" />
        <MetricCard label="Cut" value={String(counts.CUT ?? 0)} hint="Wasteful spend" higherIsBetter={false} />
        <MetricCard label="Test" value={String(counts.TEST ?? 0)} hint="Fix listing/creative" />
        <MetricCard label="Defend" value={String(counts.DEFEND ?? 0)} hint="Protect share" />
        <MetricCard label="Maintain" value={String(counts.MAINTAIN ?? 0)} hint="Monitor" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search query opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <SqpTable rows={rows} currency={client.currency} />
        </CardContent>
      </Card>
    </>
  );
}
