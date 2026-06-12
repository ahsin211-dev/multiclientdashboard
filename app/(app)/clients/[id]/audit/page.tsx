import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/states/states";
import { RunAuditButton, GeneratePlanButton } from "@/components/audit/audit-actions";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ClipboardCheck, AlertTriangle, TrendingUp, MousePointerClick, PackageX } from "lucide-react";
import type { AuditFindings } from "@/lib/reports/audit";

export const dynamic = "force-dynamic";

export default async function AuditPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  const audit = await prisma.auditReport.findFirst({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    include: { marketingPlan: true },
  });

  const findings = (audit?.findings ?? null) as AuditFindings | null;

  return (
    <>
      <PageHeader
        title="Account Audit"
        description="Connect → Audit → Marketing Plan workflow."
        actions={<RunAuditButton clientId={client.id} />}
      />

      {!audit ? (
        <EmptyState
          title="No audit yet"
          description="Run an audit to surface wasted spend, high-ACOS campaigns, low-CTR keywords and SQP opportunities."
          icon={ClipboardCheck}
          action={<RunAuditButton clientId={client.id} />}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="success">{audit.status}</Badge>
            <span>
              {audit.title} · generated {format(audit.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {findings && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FindingCard
                icon={AlertTriangle}
                label="Wasted spend"
                value={formatCurrency(findings.totals.estimatedWastedSpend, client.currency)}
                detail={`${findings.totals.wastedSpendItems} search terms`}
                tone="destructive"
              />
              <FindingCard
                icon={TrendingUp}
                label="High-ACOS campaigns"
                value={String(findings.totals.highAcosCampaigns)}
                detail="Need restructuring"
                tone="warning"
              />
              <FindingCard
                icon={MousePointerClick}
                label="Low-CTR keywords"
                value={String(findings.lowCtrKeywords.length)}
                detail="Below 0.25% CTR"
                tone="warning"
              />
              <FindingCard
                icon={PackageX}
                label="Conversion issues"
                value={String(findings.productConversionIssues.length)}
                detail="Products under 8% CVR"
                tone="warning"
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Audit summary</CardTitle>
              <CardDescription>Findings narrative</CardDescription>
            </CardHeader>
            <CardContent>
              {audit.summary ? <Markdown content={audit.summary} /> : <p className="text-sm text-muted-foreground">No summary.</p>}
            </CardContent>
          </Card>

          {findings && (
            <div className="grid gap-4 lg:grid-cols-2">
              <DetailList
                title="Top wasted spend"
                items={findings.wastedSpend.slice(0, 8).map((w) => ({
                  primary: w.query,
                  secondary: w.reason,
                  value: formatCurrency(w.spend, client.currency),
                }))}
                empty="No wasted spend detected."
              />
              <DetailList
                title="Scaling opportunities"
                items={findings.strongCampaigns.slice(0, 8).map((s) => ({
                  primary: s.label,
                  secondary: s.reason,
                  value: "",
                }))}
                empty="No scaling opportunities found."
              />
            </div>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Marketing plan</CardTitle>
                <CardDescription>30-day roadmap generated from audit findings</CardDescription>
              </div>
              <GeneratePlanButton clientId={client.id} auditId={audit.id} />
            </CardHeader>
            <CardContent>
              {audit.marketingPlan?.summary ? (
                <Markdown content={audit.marketingPlan.summary} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No plan yet — generate one from this audit.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function FindingCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "destructive" | "warning" | "success";
}) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-success/10 text-success";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-semibold">{value}</p>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { primary: string; secondary: string; value: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((it, i) => (
            <div key={i} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
              <div>
                <p className="text-sm font-medium">{it.primary}</p>
                <p className="text-xs text-muted-foreground">{it.secondary}</p>
              </div>
              {it.value && <span className="shrink-0 text-sm font-semibold tabular-nums">{it.value}</span>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
