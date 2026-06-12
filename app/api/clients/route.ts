import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getActiveWorkspaceId } from "@/lib/workspace";
import { createClientSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return NextResponse.json([]);
  const clients = await prisma.client.findMany({
    where: { workspaceId },
    orderBy: { brandName: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      workspaceId,
      brandName: parsed.data.brandName,
      marketplace: parsed.data.marketplace,
      currency: parsed.data.currency,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
