import { notFound } from "next/navigation";

import { GenerateButton } from "@/components/dashboard/generate-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function ClientAuditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      auditReports: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!client) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{client.brandName} · Audit Workflow</CardTitle>
          <GenerateButton endpoint={`/api/clients/${client.id}/audit`} label="Run Audit" />
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Connect Amazon account</li>
            <li>Run audit</li>
            <li>Generate findings (waste, ACOS, CTR, ROAS, SQP, conversion)</li>
            <li>Generate marketing plan</li>
            <li>Generate client report</li>
          </ol>
        </CardContent>
      </Card>

      {client.auditReports.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-slate-600">
            No audit reports yet. Run your first audit to generate insights.
          </CardContent>
        </Card>
      ) : (
        client.auditReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-base">{report.title}</CardTitle>
              <p className="text-xs text-slate-500">{report.createdAt.toLocaleString()}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">{report.summary}</p>
              <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(report.findings, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
