import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseDateRange } from "@/lib/analytics/date-ranges";
import { generateClientReport } from "@/lib/reports/client-report";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";
import { z } from "zod";

const reportSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum(["client", "marketing-plan"]),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { clientId, type, from, to } = reportSchema.parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const range = parseDateRange(from, to);

    if (type === "marketing-plan") {
      const plan = await generateMarketingPlan(clientId, range);
      return NextResponse.json(plan);
    }

    const report = await generateClientReport(clientId, range);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
