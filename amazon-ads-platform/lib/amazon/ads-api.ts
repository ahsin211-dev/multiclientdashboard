/**
 * Amazon Advertising API integration layer.
 * Uses environment variables — never hardcoded credentials.
 * Production: replace placeholder functions with real API calls.
 */

const ADS_API_BASE = "https://advertising-api.amazon.com";
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";

export interface AmazonAdsConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  profileId: string;
}

function getConfig(): Partial<AmazonAdsConfig> {
  return {
    clientId: process.env.AMAZON_ADS_CLIENT_ID,
    clientSecret: process.env.AMAZON_ADS_CLIENT_SECRET,
  };
}

export async function getAdsAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Amazon Ads API credentials not configured");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export function getOAuthUrl(state: string): string {
  const { clientId } = getConfig();
  const redirectUri = process.env.AMAZON_ADS_REDIRECT_URI;
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    scope: "advertising::campaign_management",
    response_type: "code",
    redirect_uri: redirectUri ?? "",
    state,
  });
  return `https://www.amazon.com/ap/oa?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getConfig();
  const redirectUri = process.env.AMAZON_ADS_REDIRECT_URI;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      redirect_uri: redirectUri ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function adsRequest(
  path: string,
  accessToken: string,
  profileId: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${ADS_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Amazon-Advertising-API-ClientId": getConfig().clientId ?? "",
      "Amazon-Advertising-API-Scope": profileId,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Amazon Ads API error ${response.status}: ${error}`);
  }

  return response.json();
}

export async function syncCampaigns(
  accessToken: string,
  profileId: string,
  clientId: string
) {
  // Production: fetch from /v2/sp/campaigns, /v2/sb/campaigns, /v2/sd/campaigns
  const data = await adsRequest("/v2/sp/campaigns", accessToken, profileId, {
    method: "GET",
  });
  return data;
}

export async function syncAdGroups(
  accessToken: string,
  profileId: string,
  clientId: string
) {
  const data = await adsRequest("/v2/sp/adGroups", accessToken, profileId, {
    method: "GET",
  });
  return data;
}

export async function syncKeywords(
  accessToken: string,
  profileId: string,
  clientId: string
) {
  const data = await adsRequest("/v2/sp/keywords", accessToken, profileId, {
    method: "GET",
  });
  return data;
}

export async function syncSearchTerms(
  accessToken: string,
  profileId: string,
  clientId: string,
  startDate: string,
  endDate: string
) {
  // Requires creating a report request and polling for completion
  const reportRequest = await adsRequest(
    "/v2/sp/targets/report",
    accessToken,
    profileId,
    {
      method: "POST",
      body: JSON.stringify({
        reportDate: startDate,
        metrics: "impressions,clicks,cost,attributedSales30d,attributedOrdersNewToBrand30d",
        segment: "query",
      }),
    }
  );
  return reportRequest;
}

export async function getAdMetricsReport(
  accessToken: string,
  profileId: string,
  startDate: string,
  endDate: string
) {
  const body = {
    startDate,
    endDate,
    configuration: {
      adProduct: "SPONSORED_PRODUCTS",
      groupBy: ["campaign", "date"],
      columns: [
        "campaignId",
        "campaignName",
        "date",
        "impressions",
        "clicks",
        "cost",
        "purchases1d",
        "purchases7d",
        "purchases14d",
        "purchases30d",
        "sales1d",
        "sales7d",
        "sales14d",
        "sales30d",
      ],
      reportTypeId: "spCampaigns",
      timeUnit: "DAILY",
      format: "GZIP_JSON",
    },
  };

  const reportRequest = await adsRequest(
    "/reporting/reports",
    accessToken,
    profileId,
    { method: "POST", body: JSON.stringify(body) }
  );
  return reportRequest;
}
