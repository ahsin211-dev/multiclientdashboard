import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  let auditId: string | undefined = body?.auditId;

  // Fall back to the latest audit for the client.
  if (!auditId) {
    const latest = await prisma.auditReport.findFirst({
      where: { clientId: params.id },
      orderBy: { createdAt: "desc" },
    });
    auditId = latest?.id;
  }
  if (!auditId) {
    return NextResponse.json({ error: "No audit found. Run an audit first." }, { status: 400 });
  }

  const plan = await generateMarketingPlan(params.id, auditId);
  return NextResponse.json({ id: plan.id });
}
