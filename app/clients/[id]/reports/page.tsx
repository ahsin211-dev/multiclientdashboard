import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/reports/report-view";
import { getDashboardData } from "@/lib/analytics/dashboard";
import { generateClientReport } from "@/lib/reports/client-report";

export default async function ClientReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, report] = await Promise.all([getDashboardData(id), generateClientReport(id)]);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Client report</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{data.client.brandName} weekly report</h1>
          <p className="mt-2 text-slate-600">Executive summary, key metrics, problems found, recommended actions, and next steps.</p>
        </div>
        <ReportView report={report} />
      </div>
    </AppShell>
  );
}
