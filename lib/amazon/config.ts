/**
 * Centralized Amazon API configuration sourced from environment variables.
 * Credentials are NEVER hardcoded. `isAdsConfigured` / `isSpApiConfigured`
 * let the rest of the app gracefully fall back to mock data when creds are
 * absent (e.g. local dev, demo mode).
 */

export const amazonConfig = {
  ads: {
    clientId: process.env.AMAZON_ADS_CLIENT_ID ?? "",
    clientSecret: process.env.AMAZON_ADS_CLIENT_SECRET ?? "",
    redirectUri: process.env.AMAZON_ADS_REDIRECT_URI ?? "",
    // Amazon Ads OAuth (LWA) endpoints.
    authUrl: "https://www.amazon.com/ap/oa",
    tokenUrl: "https://api.amazon.com/auth/o2/token",
    scope: "advertising::campaign_management",
    apiBase: "https://advertising-api.amazon.com",
  },
  spApi: {
    clientId: process.env.AMAZON_SP_API_CLIENT_ID ?? "",
    clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET ?? "",
    refreshToken: process.env.AMAZON_REFRESH_TOKEN ?? "",
    tokenUrl: "https://api.amazon.com/auth/o2/token",
    apiBase: "https://sellingpartnerapi-na.amazon.com",
  },
};

export function isAdsConfigured(): boolean {
  return Boolean(amazonConfig.ads.clientId && amazonConfig.ads.clientSecret);
}

export function isSpApiConfigured(): boolean {
  return Boolean(
    amazonConfig.spApi.clientId && amazonConfig.spApi.clientSecret
  );
}
