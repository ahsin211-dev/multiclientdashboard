import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAuditFindings } from "@/lib/reports/audit";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";

const auditSchema = z.object({
  clientId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = auditSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid audit payload", issues: body.error.flatten() }, { status: 400 });
  }

  const [findings, marketingPlan] = await Promise.all([
    generateAuditFindings(body.data.clientId),
    generateMarketingPlan(body.data.clientId),
  ]);

  return NextResponse.json({ findings, marketingPlan });
}
