import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients, parseDateRange } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { prisma } from "@/lib/db/prisma";
import { generateAuditFindings } from "@/lib/reports/audit";
import Link from "next/link";

export default async function ClientAuditPage({
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

  const [findings, latestAudit] = await Promise.all([
    generateAuditFindings(id, range),
    prisma.auditReport.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const severityVariant = {
    critical: "destructive" as const,
    warning: "warning" as const,
    info: "secondary" as const,
    positive: "success" as const,
  };

  return (
    <AppShell
      title={`${client.brandName} — Audit`}
      clientId={id}
      clients={clients}
      actions={
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <form action={`/api/audit`} method="POST">
            <input type="hidden" name="clientId" value={id} />
            <Button type="submit" size="sm">
              Run Audit
            </Button>
          </form>
        </div>
      }
    >
      <div className="space-y-6">
        {latestAudit && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Audit Score</CardTitle>
                <div className="text-3xl font-bold">
                  {latestAudit.score?.toFixed(0)}/100
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{latestAudit.summary}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {findings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No audit findings for this period. Run an audit to generate insights.
              </CardContent>
            </Card>
          ) : (
            findings.map((finding, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base">{finding.title}</CardTitle>
                    <Badge variant={severityVariant[finding.severity]}>
                      {finding.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                  <p className="text-sm">
                    <span className="font-medium">Recommendation: </span>
                    {finding.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/clients/${id}/reports`}>Generate Report</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
