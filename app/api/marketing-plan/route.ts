import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateMarketingPlan } from "@/lib/reports/marketing-plan";
import { getPresetDateRange } from "@/lib/analytics/date-ranges";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

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
  await generateMarketingPlan(clientId, range);

  return NextResponse.redirect(
    new URL(`/clients/${clientId}/reports`, request.url)
  );
}
