import { NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/amazon/ads-api";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return Response.redirect(new URL("/connect/amazon?error=" + error, req.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL("/connect/amazon?error=missing_params", req.url));
  }

  try {
    const { clientId } = JSON.parse(Buffer.from(state, "base64").toString());
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForTokens(code);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.amazonConnection.upsert({
      where: { clientId },
      create: {
        clientId,
        adsAccessToken: accessToken,
        adsRefreshToken: refreshToken,
        adsTokenExpiresAt: expiresAt,
        syncStatus: "connected",
      },
      update: {
        adsAccessToken: accessToken,
        adsRefreshToken: refreshToken,
        adsTokenExpiresAt: expiresAt,
        syncStatus: "connected",
      },
    });

    return Response.redirect(new URL(`/clients/${clientId}/settings?connected=ads`, req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth error";
    return Response.redirect(new URL("/connect/amazon?error=" + encodeURIComponent(message), req.url));
  }
}
