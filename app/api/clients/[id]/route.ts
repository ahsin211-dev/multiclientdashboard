import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, workspaceId: session.workspaceId },
      include: {
        connections: true,
        adAccounts: true,
        syncJobs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
