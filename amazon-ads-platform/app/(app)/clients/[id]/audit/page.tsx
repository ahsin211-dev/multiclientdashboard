"use client";

import { useState } from "react";
import { use } from "react";
import { Header } from "@/components/layout/header";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { AuditFinding } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Zap,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Search,
  BarChart2,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  ACOS: <TrendingDown className="w-4 h-4" />,
  Conversion: <BarChart2 className="w-4 h-4" />,
  CTR: <Search className="w-4 h-4" />,
  SQP: <Search className="w-4 h-4" />,
  Budget: <DollarSign className="w-4 h-4" />,
  Opportunity: <TrendingUp className="w-4 h-4" />,
};

const severityConfig = {
  HIGH: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "destructive" as const },
  MEDIUM: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", badge: "secondary" as const },
  LOW: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", badge: "secondary" as const },
};

const MOCK_FINDINGS: AuditFinding[] = [
  {
    category: "ACOS",
    severity: "HIGH",
    title: "4 campaigns with ACOS > 40%",
    description: "These campaigns are spending significantly above target ACOS, draining budget without proportional returns.",
    impact: "$12,450 at risk monthly",
    recommendation: "Reduce bids by 20-30% on these campaigns and add negative keywords to filter irrelevant traffic.",
    affectedItems: ["SP - Auto - All Products", "SD - Competitor ASIN Targeting", "SP - Manual - Category Keywords", "SD - Remarketing"],
    estimatedWastedSpend: 4980,
  },
  {
    category: "Conversion",
    severity: "HIGH",
    title: "2 campaigns with clicks but zero orders in 14 days",
    description: "Significant click spend accumulating with no resulting orders — possible listing issue.",
    impact: "$3,200 in non-converting spend",
    recommendation: "Immediately audit product listings for these campaigns. Check main image, title, price competitiveness, and review count.",
    affectedItems: ["SP - Manual - Competitor Keywords", "SP - Auto - New Launches"],
    estimatedWastedSpend: 3200,
  },
  {
    category: "Budget",
    severity: "MEDIUM",
    title: "3 high-efficiency campaigns may be budget-capped daily",
    description: "These campaigns hit budget cap before end of day, losing impression share during peak hours.",
    impact: "Missing est. $18,000/mo in additional sales",
    recommendation: "Increase daily budgets by 25-35% for SP - Manual - Branded Keywords, SB - Brand Defense, and SP - Manual - High Intent Keywords.",
    affectedItems: ["SP - Manual - Branded Keywords", "SB - Brand Defense", "SP - Manual - High Intent Keywords"],
  },
  {
    category: "SQP",
    severity: "MEDIUM",
    title: "5 high-converting search queries underinvested in PPC",
    description: "Queries with >8% purchase share but less than $300/mo PPC spend — strong organic performers with no paid coverage.",
    impact: "Est. $22,000/mo in missed paid sales",
    recommendation: "Create exact match campaigns for these queries immediately. Start at $1.50-2.00 CPC and scale based on ACoS.",
    affectedItems: [
      "wireless headphones noise canceling",
      "premium wireless headphones",
      "noise canceling headphones office",
      "headphones microphone zoom",
      "usb c charging cable fast",
    ],
  },
  {
    category: "CTR",
    severity: "MEDIUM",
    title: "3 campaigns with CTR below 0.15%",
    description: "Very low click-through rates indicate poor ad relevance, creative, or targeting.",
    impact: "Missing potential traffic volume",
    recommendation: "Review and refresh main images, titles, and ad copy. Add negative keywords to reduce irrelevant impressions.",
    affectedItems: ["SD - Remarketing - Cart Abandoners", "SD - Competitor ASIN Targeting", "SP - Auto - New Launches"],
  },
  {
    category: "Opportunity",
    severity: "LOW",
    title: "2 campaigns with exceptional ROAS (>7x) — scale immediately",
    description: "These campaigns are generating outstanding returns and appear to have room to scale.",
    impact: "$45,000 in high-efficiency monthly sales",
    recommendation: "Increase daily budgets by 30-50% and consider duplicating campaign structure to new keyword sets.",
    affectedItems: ["SP - Manual - Branded Keywords", "SB - Brand Defense"],
  },
];

export default function AuditPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];
  const [isRunning, setIsRunning] = useState(false);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [step, setStep] = useState<"idle" | "running" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const runAudit = async () => {
    setIsRunning(true);
    setStep("running");
    setProgress(0);

    const steps = [
      "Fetching campaign data...",
      "Analyzing ACOS and ROAS...",
      "Checking budget utilization...",
      "Scanning SQP data for gaps...",
      "Identifying wasted spend...",
      "Generating findings...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setProgress(Math.round(((i + 1) / steps.length) * 100));
    }

    setFindings(MOCK_FINDINGS);
    setStep("complete");
    setIsRunning(false);
  };

  const totalWastedSpend = findings
    .filter((f) => f.estimatedWastedSpend)
    .reduce((s, f) => s + (f.estimatedWastedSpend ?? 0), 0);

  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = findings.filter((f) => f.severity === "LOW").length;

  const toggleExpand = (i: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Account Audit" subtitle={`${client.brandName} — Performance Audit & Recommendations`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {step === "idle" && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="p-5 rounded-full bg-primary/10 inline-flex mb-6">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Run Account Audit</h2>
            <p className="text-muted-foreground mb-2">
              Analyze <strong>{client.brandName}</strong>&apos;s entire Amazon Ads account to surface:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-8 text-left inline-block">
              {[
                "Wasted spend and high-ACOS campaigns",
                "Zero-conversion campaigns burning budget",
                "Budget-capped high-performing campaigns",
                "SQP gaps — underinvested high-converting queries",
                "Low CTR campaigns needing creative refresh",
                "Scaling opportunities with strong ROAS",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button onClick={runAudit} size="lg" className="gap-2">
              <Zap className="w-4 h-4" />
              Run Full Audit
            </Button>
          </div>
        )}

        {step === "running" && (
          <div className="max-w-md mx-auto text-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Analyzing Account...</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Scanning campaigns, keywords, SQP data, and metrics.
            </p>
            <Progress value={progress} className="mb-2" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        )}

        {step === "complete" && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Wasted Spend</p>
                  <p className="text-2xl font-bold text-red-600">${totalWastedSpend.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">High Priority</p>
                  <p className="text-2xl font-bold">{highCount} issues</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Medium Priority</p>
                  <p className="text-2xl font-bold">{mediumCount} issues</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-400">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Opportunities</p>
                  <p className="text-2xl font-bold">{lowCount} found</p>
                </CardContent>
              </Card>
            </div>

            {/* Findings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{findings.length} Findings</h2>
                <Button variant="outline" size="sm" onClick={runAudit} className="gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Re-run Audit
                </Button>
              </div>

              {findings.map((finding, i) => {
                const sev = severityConfig[finding.severity];
                const SevIcon = sev.icon;
                const isExpanded = expandedIds.has(i);

                return (
                  <Card
                    key={i}
                    className={`border ${sev.bg} cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => toggleExpand(i)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${sev.color}`}>
                          <SevIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{finding.title}</span>
                            <Badge variant={sev.badge} className="text-xs">{finding.severity}</Badge>
                            <span className="text-xs text-muted-foreground">· {finding.category}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>

                          {isExpanded && (
                            <div className="mt-3 space-y-3">
                              <div className="flex items-start gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Impact</p>
                                  <p className="text-sm font-medium">{finding.impact}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Recommendation</p>
                                  <p className="text-sm">{finding.recommendation}</p>
                                </div>
                              </div>
                              {finding.affectedItems && finding.affectedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Affected Items</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {finding.affectedItems.map((item) => (
                                      <span key={item} className="text-xs px-2 py-0.5 rounded-full bg-background border">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {isExpanded ? "▲" : "▼"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
