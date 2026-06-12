import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseDateRange } from "@/lib/analytics/date-ranges";
import { createAuditReport } from "@/lib/reports/audit";
import { z } from "zod";

const auditSchema = z.object({
  clientId: z.string().cuid(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { clientId, from, to } = auditSchema.parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const range = parseDateRange(from, to);
    const report = await createAuditReport(clientId, range);

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const reports = await prisma.auditReport.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(reports);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch audits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
