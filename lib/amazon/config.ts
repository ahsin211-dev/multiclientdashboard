export const amazonAdsConfig = {
  clientId: process.env.AMAZON_ADS_CLIENT_ID ?? "",
  clientSecret: process.env.AMAZON_ADS_CLIENT_SECRET ?? "",
  redirectUri: process.env.AMAZON_ADS_REDIRECT_URI ?? "http://localhost:3000/api/amazon/ads/callback",
  authUrl: "https://www.amazon.com/ap/oa",
  tokenUrl: "https://api.amazon.com/auth/o2/token",
  apiBaseUrl: "https://advertising-api.amazon.com",
};

export const spApiConfig = {
  clientId: process.env.AMAZON_SP_API_CLIENT_ID ?? "",
  clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET ?? "",
  refreshToken: process.env.AMAZON_SP_API_REFRESH_TOKEN ?? "",
  tokenUrl: "https://api.amazon.com/auth/o2/token",
  apiBaseUrl: "https://sellingpartnerapi-na.amazon.com",
};

export function isAmazonAdsConfigured(): boolean {
  return Boolean(amazonAdsConfig.clientId && amazonAdsConfig.clientSecret);
}

export function isSpApiConfigured(): boolean {
  return Boolean(spApiConfig.clientId && spApiConfig.clientSecret);
}
