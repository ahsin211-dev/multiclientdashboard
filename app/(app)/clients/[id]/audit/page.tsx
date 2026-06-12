import { notFound } from "next/navigation";

import { ClientNav } from "@/components/layout/client-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAudit, generateMarketingPlan } from "@/lib/reports/generator";
import { getClient } from "@/lib/db/repository";
import { parseDateRange } from "@/lib/utils";

type ClientAuditPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientAuditPage({ params, searchParams }: ClientAuditPageProps) {
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const range = parseDateRange(resolvedParams);

  const client = await getClient(id);
  const [audit, plan] = await Promise.all([generateAudit(id, range), generateMarketingPlan(id)]);

  if (!client || !audit || !plan) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ClientNav clientId={client.id} current="audit" />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Audit workflow</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{audit.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{audit.summary}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {audit.findings.map((finding) => (
          <Card key={`${finding.category}-${finding.insight}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{finding.category}</CardTitle>
                <Badge variant={finding.severity === "high" ? "danger" : finding.severity === "medium" ? "warning" : "secondary"}>
                  {finding.severity}
                </Badge>
              </div>
              <CardDescription>{finding.insight}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>30-day marketing plan</CardTitle>
          <CardDescription>{plan.title}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Immediate fixes</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {plan.immediateFixes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Campaign restructuring</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {plan.campaignRestructuring.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Budget reallocation</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {plan.budgetReallocation.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">SQP strategy</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {plan.sqpStrategy.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
