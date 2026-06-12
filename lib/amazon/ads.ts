import { encryptToken } from "@/lib/security/encryption";

const AMAZON_ADS_CLIENT_ID = process.env.AMAZON_ADS_CLIENT_ID;
const AMAZON_ADS_CLIENT_SECRET = process.env.AMAZON_ADS_CLIENT_SECRET;
const AMAZON_ADS_REDIRECT_URI = process.env.AMAZON_ADS_REDIRECT_URI;

export function getAmazonAdsAuthUrl(state: string) {
  if (!AMAZON_ADS_CLIENT_ID || !AMAZON_ADS_REDIRECT_URI) {
    return null;
  }

  const searchParams = new URLSearchParams({
    client_id: AMAZON_ADS_CLIENT_ID,
    scope: "advertising::campaign_management",
    response_type: "code",
    redirect_uri: AMAZON_ADS_REDIRECT_URI,
    state,
  });

  return `https://www.amazon.com/ap/oa?${searchParams.toString()}`;
}

export async function exchangeAdsCodeForTokens(code: string) {
  if (!AMAZON_ADS_CLIENT_ID || !AMAZON_ADS_CLIENT_SECRET || !AMAZON_ADS_REDIRECT_URI) {
    throw new Error("Amazon Ads OAuth env vars are missing.");
  }

  return {
    accessTokenEncrypted: encryptToken(`ads-access-token:${code}`),
    refreshTokenEncrypted: encryptToken(`ads-refresh-token:${code}`),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };
}

export async function refreshAdsToken(refreshToken: string) {
  if (!AMAZON_ADS_CLIENT_ID || !AMAZON_ADS_CLIENT_SECRET) {
    throw new Error("Amazon Ads refresh configuration is incomplete.");
  }

  return {
    accessTokenEncrypted: encryptToken(`refreshed-ads-token:${refreshToken}`),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };
}

export async function syncCampaigns(clientId: string) {
  return {
    clientId,
    resource: "campaigns",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}

export async function syncAdGroups(clientId: string) {
  return {
    clientId,
    resource: "adGroups",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}

export async function syncKeywords(clientId: string) {
  return {
    clientId,
    resource: "keywords",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}

export async function syncSearchTerms(clientId: string) {
  return {
    clientId,
    resource: "searchTerms",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}
