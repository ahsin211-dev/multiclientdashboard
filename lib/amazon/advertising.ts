import { env } from "@/lib/env";

const ADS_AUTH_URL = "https://www.amazon.com/ap/oa";

export function buildAmazonAdsOAuthUrl(state: string) {
  const url = new URL(ADS_AUTH_URL);
  url.searchParams.set("client_id", env.AMAZON_ADS_CLIENT_ID ?? "");
  url.searchParams.set("scope", "advertising::campaign_management advertising::reporting");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env.AMAZON_ADS_REDIRECT_URI ?? "");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function refreshAmazonAdsToken(refreshToken: string) {
  if (!env.AMAZON_ADS_CLIENT_ID || !env.AMAZON_ADS_CLIENT_SECRET) {
    throw new Error("Amazon Ads OAuth credentials are not configured.");
  }

  return {
    accessToken: `mock-access-token-for-${refreshToken.slice(0, 6)}`,
    refreshToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };
}

export async function syncCampaigns(clientId: string) {
  return { clientId, entity: "campaigns", synced: true, records: 3 };
}

export async function syncAdGroups(clientId: string) {
  return { clientId, entity: "adGroups", synced: true, records: 3 };
}

export async function syncKeywords(clientId: string) {
  return { clientId, entity: "keywords", synced: true, records: 6 };
}

export async function syncSearchTerms(clientId: string) {
  return { clientId, entity: "searchTerms", synced: true, records: 25 };
}
