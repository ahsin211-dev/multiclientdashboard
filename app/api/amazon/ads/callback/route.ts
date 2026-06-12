import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/auth/crypto";
import { amazonAdsConfig } from "@/lib/amazon/config";
import { createSyncJob } from "@/lib/amazon/sync";
import { enqueueSyncJob } from "@/lib/queue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/connect/amazon?error=missing_params", request.url));
  }

  try {
    const { connectionId } = JSON.parse(Buffer.from(state, "base64").toString());

    const response = await fetch(amazonAdsConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: amazonAdsConfig.clientId,
        client_secret: amazonAdsConfig.clientSecret,
        redirect_uri: amazonAdsConfig.redirectUri,
      }),
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/connect/amazon?error=token_exchange", request.url));
    }

    const data = await response.json();

    const connection = await prisma.amazonConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: data.refresh_token ? encrypt(data.refresh_token) : undefined,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        status: "CONNECTED",
      },
    });

    const job = await createSyncJob(connection.clientId);
    await enqueueSyncJob(job.id);

    return NextResponse.redirect(
      new URL(`/clients/${connection.clientId}/settings?connected=true`, request.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/connect/amazon?error=callback_failed", request.url));
  }
}
