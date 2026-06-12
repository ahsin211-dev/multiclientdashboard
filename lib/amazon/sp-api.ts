import { AmazonConnectionType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { decryptToken, encryptToken } from "@/lib/amazon/token-vault";

interface SPApiConnectionPayload {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export async function saveSPAPIConnection(payload: SPApiConnectionPayload) {
  return prisma.amazonConnection.upsert({
    where: {
      clientId_connectionType: {
        clientId: payload.clientId,
        connectionType: AmazonConnectionType.SP_API
      }
    },
    update: {
      encryptedAccessToken: encryptToken(payload.accessToken),
      encryptedRefreshToken: encryptToken(payload.refreshToken),
      tokenExpiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000)
    },
    create: {
      clientId: payload.clientId,
      connectionType: AmazonConnectionType.SP_API,
      encryptedAccessToken: encryptToken(payload.accessToken),
      encryptedRefreshToken: encryptToken(payload.refreshToken),
      tokenExpiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000)
    }
  });
}

export async function refreshSPAPIToken(clientId: string) {
  const connection = await prisma.amazonConnection.findUnique({
    where: {
      clientId_connectionType: {
        clientId,
        connectionType: AmazonConnectionType.SP_API
      }
    }
  });

  if (!connection) {
    throw new Error("SP-API connection not found");
  }

  const existingRefreshToken = decryptToken(connection.encryptedRefreshToken);
  const refreshedAccessToken = `${existingRefreshToken}-sp-refresh-${Date.now()}`;

  return prisma.amazonConnection.update({
    where: { id: connection.id },
    data: {
      encryptedAccessToken: encryptToken(refreshedAccessToken),
      tokenExpiresAt: new Date(Date.now() + 45 * 60 * 1000)
    }
  });
}

export async function fetchSPAPISalesMetrics(clientId: string) {
  // Placeholder integration point for SP-API reports/order endpoints.
  void clientId;
  return [];
}
