export const amazonAdsConfig = {
  clientId: process.env.AMAZON_ADS_CLIENT_ID ?? "",
  clientSecret: process.env.AMAZON_ADS_CLIENT_SECRET ?? "",
  redirectUri: process.env.AMAZON_ADS_REDIRECT_URI ?? "",
  authUrl: "https://www.amazon.com/ap/oa",
  tokenUrl: "https://api.amazon.com/auth/o2/token",
  apiBaseUrl: "https://advertising-api.amazon.com",
};

export const spApiConfig = {
  clientId: process.env.AMAZON_SP_API_CLIENT_ID ?? "",
  clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET ?? "",
  refreshToken: process.env.AMAZON_REFRESH_TOKEN ?? "",
  tokenUrl: "https://api.amazon.com/auth/o2/token",
  apiBaseUrl: "https://sellingpartnerapi-na.amazon.com",
};

export function isAmazonAdsConfigured(): boolean {
  return Boolean(
    amazonAdsConfig.clientId &&
      amazonAdsConfig.clientSecret &&
      amazonAdsConfig.redirectUri
  );
}

export function isSpApiConfigured(): boolean {
  return Boolean(
    spApiConfig.clientId &&
      spApiConfig.clientSecret &&
      spApiConfig.refreshToken
  );
}
