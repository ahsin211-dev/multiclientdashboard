import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { exchangeAdsAuthCode } from "@/lib/amazon/ads-api";
import { encryptToken } from "@/lib/amazon/encryption";
import { enqueueSync } from "@/lib/queue/sync-queue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/connect/amazon?error=${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const { clientId } = JSON.parse(
      Buffer.from(state, "base64url").toString()
    ) as { clientId: string };

    const tokens = await exchangeAdsAuthCode(code);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    const existing = await prisma.amazonConnection.findFirst({
      where: { clientId, type: "AMAZON_ADS" },
    });

    const connectionData = {
      status: "CONNECTED" as const,
      accessToken: encryptToken(tokens.accessToken),
      refreshToken: encryptToken(tokens.refreshToken),
      tokenExpiresAt: expiresAt,
    };

    if (existing) {
      await prisma.amazonConnection.update({
        where: { id: existing.id },
        data: connectionData,
      });
    } else {
      await prisma.amazonConnection.create({
        data: { clientId, type: "AMAZON_ADS", ...connectionData },
      });
    }

    await enqueueSync(clientId);

    return NextResponse.redirect(
      new URL(`/clients/${clientId}/settings?connected=ads`, request.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/connect/amazon?error=oauth_failed", request.url)
    );
  }
}
