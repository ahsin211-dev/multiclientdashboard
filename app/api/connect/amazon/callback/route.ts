import { NextResponse } from "next/server";
import { encryptToken } from "@/lib/amazon/crypto";
import { enqueueSyncJob } from "@/lib/queue/sync-queue";

function parseState(state: string | null) {
  if (!state) return { clientId: "unknown-client" };
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { clientId: string };
  } catch {
    return { clientId: "unknown-client" };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = parseState(url.searchParams.get("state"));

  if (!code) {
    return NextResponse.json({ error: "Missing Amazon OAuth authorization code" }, { status: 400 });
  }

  const encryptedAccessToken = encryptToken(`mock-access-token-from-${code.slice(0, 6)}`);
  const encryptedRefreshToken = encryptToken(`mock-refresh-token-from-${code.slice(0, 6)}`);
  const syncJob = await enqueueSyncJob({ clientId: state.clientId, reason: "oauth-connected" });

  return NextResponse.json({
    status: "connected",
    clientId: state.clientId,
    encryptedAccessTokenPreview: encryptedAccessToken.slice(0, 16),
    encryptedRefreshTokenPreview: encryptedRefreshToken.slice(0, 16),
    syncJob,
  });
}
