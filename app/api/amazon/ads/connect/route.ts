import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAmazonAdsAuthUrl } from "@/lib/amazon/ads-api";
import { isAmazonAdsConfigured } from "@/lib/amazon/config";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isAmazonAdsConfigured()) {
    return NextResponse.json(
      { error: "Amazon Ads API not configured" },
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

  const state = Buffer.from(JSON.stringify({ clientId })).toString("base64url");
  const authUrl = getAmazonAdsAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
