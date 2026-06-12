import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientReport } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

export function ReportView({ report }: { report: ClientReport }) {
  const metrics = [
    ["Ad spend", formatCurrency(report.keyMetrics.spend)],
    ["Ad sales", formatCurrency(report.keyMetrics.sales)],
    ["Revenue", formatCurrency(report.keyMetrics.revenue)],
    ["ACOS", formatPercent(report.keyMetrics.acos)],
    ["TACOS", formatPercent(report.keyMetrics.tacos)],
    ["ROAS", formatRatio(report.keyMetrics.roas)],
    ["Orders", formatNumber(report.keyMetrics.orders)],
    ["Clicks", formatNumber(report.keyMetrics.clicks)],
  ];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Executive summary</CardTitle>
          <CardDescription>Client-ready weekly performance narrative.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="leading-7 text-slate-700">{report.executiveSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key metrics</CardTitle>
          <CardDescription>Selected period performance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <ReportList title="Problems found" items={report.problemsFound} />
        <ReportList title="Recommended actions" items={report.recommendedActions} />
        <ReportList title="Next steps" items={report.nextSteps} />
      </div>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
