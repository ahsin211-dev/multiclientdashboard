import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditFinding, MarketingPlan } from "@/lib/analytics/types";

const steps = ["Connect Amazon account", "Run audit", "Generate findings", "Generate marketing plan", "Generate client report"];

export function AuditWorkflow({ findings, plan }: { findings: AuditFinding[]; plan: MarketingPlan }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit workflow</CardTitle>
          <CardDescription>Production workflow from account connection to client-ready report.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                {index < 4 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Loader2 className="h-5 w-5 text-blue-600" />}
              </div>
              <p className="text-sm font-semibold text-slate-950">{step}</p>
              <p className="mt-1 text-xs text-slate-500">Step {index + 1}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated findings</CardTitle>
          <CardDescription>Prioritized issues and opportunities found from account data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {findings.length ? (
            findings.map((finding) => (
              <div key={`${finding.category}-${finding.finding}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={finding.severity === "high" ? "danger" : finding.severity === "medium" ? "warning" : "neutral"}>
                    {finding.severity}
                  </Badge>
                  <p className="font-semibold text-slate-950">{finding.category}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{finding.finding}</p>
                <p className="mt-2 text-sm font-medium text-slate-950">Recommendation</p>
                <p className="text-sm text-slate-600">{finding.recommendation}</p>
                <p className="mt-2 text-xs text-slate-500">{finding.impact}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
              <Circle className="h-4 w-4" />
              No material findings in the supplied data.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing plan</CardTitle>
          <CardDescription>Immediate fixes, restructuring, SQP strategy, and 30-day roadmap.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Object.entries(plan).map(([section, items]) => (
            <div key={section} className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-2 font-semibold capitalize text-slate-950">{section.replace(/([A-Z])/g, " $1")}</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
