/**
 * Amazon Selling Partner API (SP-API) integration layer.
 * Handles orders, inventory, catalog, and brand analytics.
 */

const SP_API_BASE = "https://sellingpartnerapi-na.amazon.com";
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

export async function getSPAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch(LWA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_SP_API_CLIENT_ID ?? "",
      client_secret: process.env.AMAZON_SP_API_CLIENT_SECRET ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error(`SP-API token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

async function spRequest(path: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(`${SP_API_BASE}${path}`, {
    ...options,
    headers: {
      "x-amz-access-token": accessToken,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SP-API error ${response.status}: ${error}`);
  }

  return response.json();
}

export async function syncSalesMetrics(
  accessToken: string,
  startDate: string,
  endDate: string,
  marketplaceId = "ATVPDKIKX0DER"
) {
  const params = new URLSearchParams({
    marketplaceIds: marketplaceId,
    interval: `${startDate}T00:00:00-07:00--${endDate}T23:59:59-07:00`,
    granularity: "DAY",
  });

  return spRequest(`/sales/v1/orderMetrics?${params}`, accessToken);
}

export async function syncProducts(
  accessToken: string,
  marketplaceId = "ATVPDKIKX0DER"
) {
  const params = new URLSearchParams({
    marketplaceIds: marketplaceId,
  });

  return spRequest(`/catalog/2022-04-01/items?${params}`, accessToken);
}

export async function syncInventory(
  accessToken: string,
  marketplaceId = "ATVPDKIKX0DER"
) {
  const params = new URLSearchParams({
    marketplaceIds: marketplaceId,
    details: "true",
  });

  return spRequest(`/fba/inventory/v1/summaries?${params}`, accessToken);
}

export async function syncSQPData(
  accessToken: string,
  reportingDateStart: string,
  reportingDateEnd: string,
  marketplaceId = "ATVPDKIKX0DER"
) {
  // Brand Analytics: Search Query Performance report
  const body = {
    reportType: "GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT",
    reportOptions: {
      reportPeriod: "WEEK",
    },
    dataStartTime: reportingDateStart,
    dataEndTime: reportingDateEnd,
    marketplaceIds: [marketplaceId],
  };

  return spRequest("/reports/2021-06-30/reports", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getReportStatus(accessToken: string, reportId: string) {
  return spRequest(`/reports/2021-06-30/reports/${reportId}`, accessToken);
}

export async function downloadReport(accessToken: string, documentId: string) {
  const docInfo = await spRequest(
    `/reports/2021-06-30/documents/${documentId}`,
    accessToken
  );
  const response = await fetch(docInfo.url);
  return response.text();
}

export function normalizeMetrics(rawData: Record<string, unknown>[]) {
  return rawData.map((row) => ({
    date: row.date,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.cost ?? row.spend ?? 0),
    sales: Number(row.attributedSales30d ?? row.sales ?? 0),
    orders: Number(row.attributedOrdersNewToBrand30d ?? row.orders ?? 0),
    acos: Number(row.sales) > 0
      ? (Number(row.cost) / Number(row.sales)) * 100
      : null,
    roas: Number(row.cost) > 0
      ? Number(row.sales) / Number(row.cost)
      : null,
  }));
}
