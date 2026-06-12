import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildAmazonAdsOAuthUrl } from "@/lib/amazon/advertising";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") ?? "unknown-client";
  const state = Buffer.from(JSON.stringify({ clientId, nonce: randomUUID() })).toString("base64url");

  if (!env.AMAZON_ADS_CLIENT_ID || !env.AMAZON_ADS_REDIRECT_URI) {
    return NextResponse.json({
      status: "configuration_required",
      message: "Set AMAZON_ADS_CLIENT_ID and AMAZON_ADS_REDIRECT_URI to enable OAuth redirects.",
      connectUrl: buildAmazonAdsOAuthUrl(state),
      clientId,
    });
  }

  return NextResponse.redirect(buildAmazonAdsOAuthUrl(state));
}
