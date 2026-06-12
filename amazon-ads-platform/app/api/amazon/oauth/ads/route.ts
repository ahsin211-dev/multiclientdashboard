import { NextRequest } from "next/server";
import { getOAuthUrl } from "@/lib/amazon/ads-api";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return Response.json({ error: "clientId required" }, { status: 400 });
  }

  if (!process.env.AMAZON_ADS_CLIENT_ID) {
    return Response.json(
      { error: "AMAZON_ADS_CLIENT_ID not configured. Add it to your environment variables." },
      { status: 500 }
    );
  }

  const state = Buffer.from(JSON.stringify({ clientId, ts: Date.now() })).toString("base64");
  const oauthUrl = getOAuthUrl(state);

  return Response.redirect(oauthUrl);
}
