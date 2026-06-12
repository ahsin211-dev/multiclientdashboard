import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAuditReport } from "@/lib/reports/audit";
import { getPresetDateRange } from "@/lib/analytics/date-ranges";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const clientId = formData.get("clientId") as string;

  if (!clientId) {
    return NextResponse.json({ error: "Client ID required" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const range = getPresetDateRange("30d").current;
  await createAuditReport(clientId, range);

  return NextResponse.redirect(
    new URL(`/clients/${clientId}/audit`, request.url)
  );
}
