import { prisma } from "@/lib/db/prisma";
import { amazonConfig, isAdsConfigured } from "./config";
import { encryptToken, decryptToken } from "./crypto";
import type { ConnectionType } from "@prisma/client";

/**
 * Placeholder OAuth flow for Amazon Advertising (Login With Amazon).
 *
 * The real flow:
 *   1. buildAuthUrl() -> redirect the user to Amazon's consent screen.
 *   2. Amazon redirects back to AMAZON_ADS_REDIRECT_URI with ?code=...&state=...
 *   3. exchangeCodeForTokens(code) -> swap the code for access/refresh tokens.
 *   4. Store encrypted tokens on the AmazonConnection row.
 *   5. Trigger the first sync.
 *
 * When credentials are not configured we still create a "connected" record so
 * the demo works end-to-end against mock data.
 */

export function buildAuthUrl(state: string): string {
  const { ads } = amazonConfig;
  const params = new URLSearchParams({
    client_id: ads.clientId,
    scope: ads.scope,
    response_type: "code",
    redirect_uri: ads.redirectUri,
    state,
  });
  return `${ads.authUrl}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  if (!isAdsConfigured()) {
    // Demo mode: synthesize tokens so the connection can be stored.
    return {
      access_token: `demo-access-${code}`,
      refresh_token: `demo-refresh-${code}`,
      expires_in: 3600,
    };
  }
  const { ads } = amazonConfig;
  const res = await fetch(ads.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ads.redirectUri,
      client_id: ads.clientId,
      client_secret: ads.clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  if (!isAdsConfigured()) {
    return {
      access_token: `demo-access-${Date.now()}`,
      refresh_token: refreshToken,
      expires_in: 3600,
    };
  }
  const { ads } = amazonConfig;
  const res = await fetch(ads.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ads.clientId,
      client_secret: ads.clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

/** Persists a connection with encrypted tokens. */
export async function saveConnection(
  clientId: string,
  type: ConnectionType,
  tokens: TokenResponse,
  profileId?: string
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  return prisma.amazonConnection.upsert({
    where: { clientId_type: { clientId, type } },
    create: {
      clientId,
      type,
      status: "CONNECTED",
      profileId,
      accessTokenEnc: encryptToken(tokens.access_token),
      refreshTokenEnc: encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
      scope: amazonConfig.ads.scope,
    },
    update: {
      status: "CONNECTED",
      profileId,
      accessTokenEnc: encryptToken(tokens.access_token),
      refreshTokenEnc: encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
      lastError: null,
    },
  });
}

/**
 * Returns a valid access token for a connection, refreshing it if expired.
 * Returns null if the connection has no stored token (demo data only).
 */
export async function getValidAccessToken(
  connectionId: string
): Promise<string | null> {
  const conn = await prisma.amazonConnection.findUnique({
    where: { id: connectionId },
  });
  if (!conn?.accessTokenEnc || !conn.refreshTokenEnc) return null;

  const isExpired =
    !conn.tokenExpiresAt || conn.tokenExpiresAt.getTime() < Date.now() + 60_000;

  if (!isExpired) {
    return decryptToken(conn.accessTokenEnc);
  }

  const refreshed = await refreshAccessToken(decryptToken(conn.refreshTokenEnc));
  await prisma.amazonConnection.update({
    where: { id: connectionId },
    data: {
      accessTokenEnc: encryptToken(refreshed.access_token),
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      status: "CONNECTED",
    },
  });
  return refreshed.access_token;
}
