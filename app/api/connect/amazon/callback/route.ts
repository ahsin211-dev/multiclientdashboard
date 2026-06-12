import { NextResponse } from "next/server";

import { exchangeAdsCodeForTokens } from "@/lib/amazon/ads";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      {
        error: "Missing Amazon authorization code.",
      },
      { status: 400 },
    );
  }

  const tokens = await exchangeAdsCodeForTokens(code);

  return NextResponse.json({
    status: "connected",
    state,
    message: "Store these encrypted tokens against the client connection record, then trigger the first sync job.",
    tokens,
  });
}
