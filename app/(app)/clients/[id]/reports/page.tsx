import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ReportGenerator } from "@/components/reports/report-generator";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { period?: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  return (
    <>
      <PageHeader
        title="Client Reports"
        description={`Executive performance report for ${client.brandName}.`}
      />
      <ReportGenerator clientId={client.id} period={searchParams.period ?? "30d"} />
    </>
  );
}
