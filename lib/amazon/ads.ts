import { AmazonConnectionType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/amazon/token-vault";

interface OAuthCallbackPayload {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export function getAmazonAdsOAuthUrl(state: string) {
  const params = new URLSearchParams({
    application_id: env.AMAZON_ADS_CLIENT_ID ?? "",
    state,
    redirect_uri: env.AMAZON_ADS_REDIRECT_URI ?? "",
    response_type: "code"
  });
  return `https://www.amazon.com/ap/oa?${params.toString()}`;
}

export async function saveAmazonAdsConnection(payload: OAuthCallbackPayload) {
  return prisma.amazonConnection.upsert({
    where: {
      clientId_connectionType: {
        clientId: payload.clientId,
        connectionType: AmazonConnectionType.ADS
      }
    },
    update: {
      encryptedAccessToken: encryptToken(payload.accessToken),
      encryptedRefreshToken: encryptToken(payload.refreshToken),
      tokenExpiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000)
    },
    create: {
      clientId: payload.clientId,
      connectionType: AmazonConnectionType.ADS,
      encryptedAccessToken: encryptToken(payload.accessToken),
      encryptedRefreshToken: encryptToken(payload.refreshToken),
      tokenExpiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000)
    }
  });
}

export async function refreshAmazonAdsToken(clientId: string) {
  const connection = await prisma.amazonConnection.findUnique({
    where: {
      clientId_connectionType: {
        clientId,
        connectionType: AmazonConnectionType.ADS
      }
    }
  });

  if (!connection) {
    throw new Error("Amazon Ads connection not found");
  }

  // Placeholder refresh flow. Replace with real token exchange endpoint.
  const existingRefreshToken = decryptToken(connection.encryptedRefreshToken);
  const refreshedAccessToken = `${existingRefreshToken}-refreshed-${Date.now()}`;

  return prisma.amazonConnection.update({
    where: { id: connection.id },
    data: {
      encryptedAccessToken: encryptToken(refreshedAccessToken),
      tokenExpiresAt: new Date(Date.now() + 45 * 60 * 1000)
    }
  });
}

export async function fetchAmazonAdsCampaigns(clientId: string) {
  // Placeholder integration point for Amazon Advertising API campaign endpoint.
  void clientId;
  return [];
}
