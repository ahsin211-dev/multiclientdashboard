import { notFound } from "next/navigation";

import { ClientNav } from "@/components/layout/client-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateClientReport } from "@/lib/reports/generator";
import { getClient } from "@/lib/db/repository";
import { formatCurrency, formatPercent, parseDateRange } from "@/lib/utils";

type ClientReportsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientReportsPage({ params, searchParams }: ClientReportsPageProps) {
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const range = parseDateRange(resolvedParams);

  const client = await getClient(id);
  const report = await generateClientReport(id, range);

  if (!client || !report) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ClientNav clientId={client.id} current="reports" />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Client report</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{report.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Executive summary, key metrics, risks, and next steps for stakeholder-ready reporting.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {report.executiveSummary.map((summary) => (
          <Card key={summary}>
            <CardHeader>
              <CardTitle>Executive summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{summary}</CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Key metrics</CardTitle>
          <CardDescription>Selected period compared against the previous matching window.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {report.keyMetrics.map((metric) => (
            <div key={metric.key} className="rounded-lg border border-slate-100 p-4">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {metric.key === "roas"
                  ? `${metric.value.toFixed(2)}x`
                  : ["tacos", "acos", "ctr", "cvr"].includes(metric.key)
                    ? formatPercent(metric.value)
                    : ["spend", "sales", "revenue", "cpc"].includes(metric.key)
                      ? formatCurrency(metric.value, client.currency)
                      : metric.value.toFixed(0)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Problems found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.problemsFound.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                <p className="mt-2 text-sm font-medium text-rose-600">{item.metric}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.recommendedActions.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                <p className="mt-2 text-sm font-medium text-emerald-600">{item.metric}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Next steps roadmap</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {report.nextSteps.map((step) => (
            <div key={step.week} className="rounded-lg border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-950">{step.week}</p>
              <p className="mt-2 text-sm text-slate-600">{step.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
