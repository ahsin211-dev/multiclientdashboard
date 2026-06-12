import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateAudit } from "@/lib/reports/audit";
import { parseRange } from "@/lib/analytics/date-ranges";
import { auditRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = auditRequestSchema.safeParse({ ...body, clientId: params.id });
  const range = parseRange(
    parsed.success ? parsed.data.from : undefined,
    parsed.success ? parsed.data.to : undefined,
    (parsed.success ? parsed.data.period : "30d") as any
  );

  const report = await generateAudit(client.id, range, {
    targetAcos: parsed.success ? parsed.data.targetAcos : undefined,
  });

  return NextResponse.json({ id: report.id, status: report.status });
}
