import { amazonAdsConfig } from "./config";
import { decryptToken, encryptToken } from "./encryption";
import { prisma } from "@/lib/db/prisma";

export function getAmazonAdsAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: amazonAdsConfig.clientId,
    scope: "advertising::campaign_management",
    response_type: "code",
    redirect_uri: amazonAdsConfig.redirectUri,
    state,
  });
  return `${amazonAdsConfig.authUrl}?${params.toString()}`;
}

export async function exchangeAdsAuthCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
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
    throw new Error(`Amazon Ads token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAdsToken(
  connectionId: string
): Promise<string> {
  const connection = await prisma.amazonConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const refreshToken = decryptToken(connection.refreshToken);

  const response = await fetch(amazonAdsConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: amazonAdsConfig.clientId,
      client_secret: amazonAdsConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    await prisma.amazonConnection.update({
      where: { id: connectionId },
      data: { status: "EXPIRED" },
    });
    throw new Error("Failed to refresh Amazon Ads token");
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.amazonConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: encryptToken(data.access_token),
      refreshToken: data.refresh_token
        ? encryptToken(data.refresh_token)
        : connection.refreshToken,
      tokenExpiresAt: expiresAt,
      status: "CONNECTED",
    },
  });

  return data.access_token;
}

export async function getValidAdsAccessToken(
  connectionId: string
): Promise<string> {
  const connection = await prisma.amazonConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection?.accessToken) {
    throw new Error("Amazon Ads not connected");
  }

  const isExpired =
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() < Date.now() + 60000;

  if (isExpired) {
    return refreshAdsToken(connectionId);
  }

  return decryptToken(connection.accessToken);
}

// Placeholder API methods — replace with real Amazon Advertising API calls
export async function fetchCampaignsFromApi(
  _accessToken: string,
  _profileId: string
): Promise<unknown[]> {
  // TODO: Implement real Amazon Advertising API v3 campaigns endpoint
  return [];
}

export async function fetchAdGroupsFromApi(
  _accessToken: string,
  _profileId: string
): Promise<unknown[]> {
  return [];
}

export async function fetchKeywordsFromApi(
  _accessToken: string,
  _profileId: string
): Promise<unknown[]> {
  return [];
}
