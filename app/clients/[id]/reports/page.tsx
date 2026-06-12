import { notFound } from "next/navigation";

import { GenerateButton } from "@/components/dashboard/generate-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateClientReport } from "@/lib/reports/client-report";
import { prisma } from "@/lib/db/prisma";

export default async function ClientReportsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      marketingPlans: {
        orderBy: { createdAt: "desc" },
        take: 3
      }
    }
  });
  if (!client) notFound();

  const report = await generateClientReport(id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{client.brandName} · Reports & Marketing Plan</CardTitle>
          <GenerateButton endpoint={`/api/clients/${id}/reports`} label="Generate Plan + Report" />
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Executive summary, key metrics, detected issues, and recommended actions.
        </CardContent>
      </Card>

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Client Report Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>{report.executiveSummary}</p>
            <div>
              <h4 className="font-semibold">Problems Found</h4>
              <ul className="list-disc pl-5">
                {report.problemsFound.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Recommended Actions</h4>
              <ul className="list-disc pl-5">
                {report.recommendedActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Next Steps</h4>
              <ul className="list-disc pl-5">
                {report.nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {client.marketingPlans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle className="text-base">{plan.title}</CardTitle>
            <p className="text-xs text-slate-500">{plan.createdAt.toLocaleString()}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">{plan.executiveSummary}</p>
            <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(
                {
                  actions: plan.actions,
                  roadmap: plan.roadmap
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
