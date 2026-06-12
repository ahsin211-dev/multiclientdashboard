import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients, parseDateRange } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { generateClientReport } from "@/lib/reports/client-report";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function ClientReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const client = await getClientById(id);
  if (!client) notFound();

  const clients = await getWorkspaceClients();
  const range = parseDateRange(sp.range);

  const [report, marketingPlans, auditReports] = await Promise.all([
    generateClientReport(id, range),
    prisma.marketingPlan.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditReport.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <AppShell
      title={`${client.brandName} — Reports`}
      clientId={id}
      clients={clients}
      actions={
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button asChild size="sm">
            <Link href={`/api/marketing-plan?clientId=${id}`}>Generate Marketing Plan</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(report.keyMetrics).map(([key, value]) => (
                <div key={key}>
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problems Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.problemsFound.length === 0 ? (
              <p className="text-muted-foreground">No critical problems identified.</p>
            ) : (
              report.problemsFound.map((problem, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <Badge
                    variant={
                      problem.severity === "critical" ? "destructive" : "warning"
                    }
                  >
                    {problem.severity}
                  </Badge>
                  <div>
                    <div className="font-medium">{problem.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {problem.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {report.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {report.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {marketingPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Marketing Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {marketingPlans.map((plan) => (
                <div key={plan.id} className="rounded-lg border p-3">
                  <div className="font-medium">{plan.title}</div>
                  <p className="text-sm text-muted-foreground">{plan.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {auditReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditReports.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{audit.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {audit.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <Badge>{audit.score?.toFixed(0)}/100</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
