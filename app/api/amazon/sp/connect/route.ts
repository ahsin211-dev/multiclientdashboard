import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { encryptToken } from "@/lib/amazon/encryption";
import { isSpApiConfigured } from "@/lib/amazon/config";
import { enqueueSync } from "@/lib/queue/sync-queue";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isSpApiConfigured()) {
    return NextResponse.json(
      { error: "SP-API not configured" },
      { status: 503 }
    );
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

  const refreshToken = process.env.AMAZON_REFRESH_TOKEN!;
  const encrypted = encryptToken(refreshToken);

  const existing = await prisma.amazonConnection.findFirst({
    where: { clientId, type: "SP_API" },
  });

  if (existing) {
    await prisma.amazonConnection.update({
      where: { id: existing.id },
      data: {
        status: "CONNECTED",
        refreshToken: encrypted,
        sellerId: "DEMO_SELLER",
      },
    });
  } else {
    await prisma.amazonConnection.create({
      data: {
        clientId,
        type: "SP_API",
        status: "CONNECTED",
        refreshToken: encrypted,
        sellerId: "DEMO_SELLER",
      },
    });
  }

  await enqueueSync(clientId);

  return NextResponse.redirect(
    new URL(`/clients/${clientId}/settings?connected=sp`, request.url)
  );
}
