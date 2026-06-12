import { NextResponse } from "next/server";

import { generateClientReport } from "@/lib/reports/client-report";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await generateClientReport(id);
  if (!report) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: { workspaceId: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const plan = await generateMarketingPlan(id, client.workspaceId);
  const report = await generateClientReport(id);
  return NextResponse.json({ plan, report });
}
