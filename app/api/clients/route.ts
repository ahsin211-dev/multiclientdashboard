import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireSession();
    const clients = await prisma.client.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { brandName: "asc" },
      include: {
        connections: true,
        _count: { select: { campaigns: true } },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch clients";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = clientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        workspaceId: session.workspaceId,
        brandName: data.brandName,
        marketplace: data.marketplace,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
