import { amazonConfig, isSpApiConfigured } from "./config";

/**
 * Amazon Selling Partner API (SP-API) client placeholder. Handles the LWA token
 * exchange via the configured refresh token and exposes the report endpoints
 * used for sales + traffic data. Throws when not configured so callers fall back
 * to mock data.
 *
 * Reference: https://developer-docs.amazon.com/sp-api/
 */
export class AmazonSpApiClient {
  private accessToken: string | null = null;
  private expiresAt = 0;

  private async getAccessToken(): Promise<string> {
    if (!isSpApiConfigured()) throw new Error("SP-API not configured");
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) {
      return this.accessToken;
    }
    const res = await fetch(amazonConfig.spApi.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: amazonConfig.spApi.refreshToken,
        client_id: amazonConfig.spApi.clientId,
        client_secret: amazonConfig.spApi.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`SP-API token failed: ${res.status}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = json.access_token;
    this.expiresAt = Date.now() + json.expires_in * 1000;
    return this.accessToken;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${amazonConfig.spApi.apiBase}${path}`, {
      ...init,
      headers: {
        "x-amz-access-token": token,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`SP-API ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  /** Sales & Traffic report (GET_SALES_AND_TRAFFIC_REPORT). */
  requestSalesAndTrafficReport(body: unknown) {
    return this.request<{ reportId: string }>("/reports/2021-06-30/reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getCatalogItem(asin: string) {
    return this.request<unknown>(`/catalog/2022-04-01/items/${asin}`);
  }
}
