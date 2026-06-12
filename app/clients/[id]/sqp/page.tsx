import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients, parseDateRange } from "@/lib/clients";
import { getSQPInsights } from "@/lib/analytics/sqp";
import { AppShell } from "@/components/layout/app-shell";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function SQPAnalyzerPage({
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
  const sqpInsights = await getSQPInsights(id, range);

  const actionVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
    SCALE: "success",
    CUT: "destructive",
    TEST: "warning",
    DEFEND: "secondary",
    MONITOR: "secondary",
  };

  return (
    <AppShell
      title={`${client.brandName} — SQP Analyzer`}
      clientId={id}
      clients={clients}
      actions={<DateRangePicker />}
    >
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Search Query Performance analysis combining Amazon Brand Analytics SQP data
          with PPC metrics to surface scale, cut, test, and defend actions.
        </p>

        <DataTable
          title="SQP Analysis"
          data={sqpInsights}
          emptyMessage="No SQP data available. Connect SP-API and run a sync."
          columns={[
            { key: "query", header: "Query" },
            {
              key: "impressionShare",
              header: "Imp. Share",
              render: (row) => formatPercent(row.impressionShare as number),
              className: "text-right",
            },
            {
              key: "clickShare",
              header: "Click Share",
              render: (row) => formatPercent(row.clickShare as number),
              className: "text-right",
            },
            {
              key: "purchaseShare",
              header: "Purchase Share",
              render: (row) => formatPercent(row.purchaseShare as number),
              className: "text-right",
            },
            {
              key: "ppcSpend",
              header: "PPC Spend",
              render: (row) => formatCurrency(row.ppcSpend as number),
              className: "text-right",
            },
            {
              key: "ppcSales",
              header: "PPC Sales",
              render: (row) => formatCurrency(row.ppcSales as number),
              className: "text-right",
            },
            {
              key: "ppcAcos",
              header: "ACOS",
              render: (row) => formatPercent(row.ppcAcos as number),
              className: "text-right",
            },
            {
              key: "recommendedAction",
              header: "Action",
              render: (row) => (
                <Badge variant={actionVariant[String(row.recommendedAction)] ?? "secondary"}>
                  {String(row.recommendedAction)}
                </Badge>
              ),
            },
            {
              key: "actionReason",
              header: "Reason",
              render: (row) => (
                <span className="text-xs text-muted-foreground max-w-[200px] block">
                  {String(row.actionReason)}
                </span>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
