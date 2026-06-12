import { env } from "@/lib/env";

export async function refreshSellingPartnerToken(refreshToken = env.AMAZON_REFRESH_TOKEN) {
  if (!env.AMAZON_SP_API_CLIENT_ID || !env.AMAZON_SP_API_CLIENT_SECRET || !refreshToken) {
    throw new Error("Amazon SP-API credentials are not configured.");
  }

  return {
    accessToken: `mock-sp-access-token-for-${refreshToken.slice(0, 6)}`,
    refreshToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };
}

export async function syncProducts(clientId: string) {
  return { clientId, entity: "products", synced: true, records: 3 };
}

export async function syncSalesMetrics(clientId: string) {
  return { clientId, entity: "salesMetrics", synced: true, records: 30 };
}
