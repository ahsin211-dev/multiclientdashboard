import { NextResponse } from "next/server";

import { generateAudit } from "@/lib/reports/audit";
import { prisma } from "@/lib/db/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: { workspaceId: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const report = await generateAudit(id, client.workspaceId);
  return NextResponse.json({ report });
}
