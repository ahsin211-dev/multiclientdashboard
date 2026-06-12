import { spApiConfig } from "./config";
import { decryptToken, encryptToken } from "./encryption";
import { prisma } from "@/lib/db/prisma";

export async function refreshSpApiToken(
  connectionId: string
): Promise<string> {
  const connection = await prisma.amazonConnection.findUnique({
    where: { id: connectionId },
  });

  const refreshToken = connection?.refreshToken
    ? decryptToken(connection.refreshToken)
    : spApiConfig.refreshToken;

  if (!refreshToken) {
    throw new Error("No SP-API refresh token available");
  }

  const response = await fetch(spApiConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: spApiConfig.clientId,
      client_secret: spApiConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    if (connection) {
      await prisma.amazonConnection.update({
        where: { id: connectionId },
        data: { status: "EXPIRED" },
      });
    }
    throw new Error("Failed to refresh SP-API token");
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  if (connection) {
    await prisma.amazonConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: encryptToken(data.access_token),
        tokenExpiresAt: expiresAt,
        status: "CONNECTED",
      },
    });
  }

  return data.access_token;
}

// Placeholder SP-API methods
export async function fetchOrdersFromApi(
  _accessToken: string
): Promise<unknown[]> {
  return [];
}

export async function fetchSalesMetricsFromApi(
  _accessToken: string
): Promise<unknown[]> {
  return [];
}

export async function fetchBrandAnalyticsSQP(
  _accessToken: string
): Promise<unknown[]> {
  return [];
}
