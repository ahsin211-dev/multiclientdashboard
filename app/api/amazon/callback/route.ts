import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveConnection } from "@/lib/amazon/oauth";
import { enqueueSync } from "@/lib/queue/queues";
import type { ConnectionType } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Amazon OAuth redirect callback. Amazon redirects here with ?code & ?state.
 * `state` encodes "clientId:type". We exchange the code for tokens, store them
 * encrypted, then trigger the first sync and redirect to the client dashboard.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const base = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${base}/connect/amazon?error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${base}/connect/amazon?error=missing_code`);
  }

  const [clientId, type] = state.split(":");
  if (!clientId) {
    return NextResponse.redirect(`${base}/connect/amazon?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveConnection(clientId, (type as ConnectionType) ?? "ADS", tokens);
    await enqueueSync(clientId, "FULL_SYNC");
    return NextResponse.redirect(`${base}/clients/${clientId}/dashboard`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange_failed";
    return NextResponse.redirect(`${base}/connect/amazon?error=${encodeURIComponent(msg)}`);
  }
}
