import { AuditWorkflow } from "@/components/audit/audit-workflow";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardData } from "@/lib/analytics/dashboard";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";
import { generateAuditFindings } from "@/lib/reports/audit";

export default async function ClientAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, findings, plan] = await Promise.all([getDashboardData(id), generateAuditFindings(id), generateMarketingPlan(id)]);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Audit workflow</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{data.client.brandName} audit</h1>
          <p className="mt-2 text-slate-600">Connect Amazon data, run diagnostics, generate findings, and produce an action plan.</p>
        </div>
        <AuditWorkflow findings={findings} plan={plan} />
      </div>
    </AppShell>
  );
}
