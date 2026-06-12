import { amazonConfig, isAdsConfigured } from "./config";
import { getValidAccessToken } from "./oauth";

/**
 * Thin Amazon Advertising API client. Methods are placeholders that show the
 * real request shape; when credentials/connection are missing they throw so the
 * sync layer can fall back to mock data.
 *
 * Reference: https://advertising.amazon.com/API/docs/
 */
export class AmazonAdsClient {
  constructor(
    private readonly connectionId: string,
    private readonly profileId: string
  ) {}

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await getValidAccessToken(this.connectionId);
    if (!token || !isAdsConfigured()) {
      throw new Error("Amazon Ads not configured / no valid token");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Amazon-Advertising-API-ClientId": amazonConfig.ads.clientId,
      "Amazon-Advertising-API-Scope": this.profileId,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${amazonConfig.ads.apiBase}${path}`, {
      ...init,
      headers: { ...(await this.authHeaders()), ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(`Ads API ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  listCampaigns() {
    return this.request<unknown[]>("/sp/campaigns/list", { method: "POST", body: "{}" });
  }
  listAdGroups() {
    return this.request<unknown[]>("/sp/adGroups/list", { method: "POST", body: "{}" });
  }
  listKeywords() {
    return this.request<unknown[]>("/sp/keywords/list", { method: "POST", body: "{}" });
  }
  // Reports (search terms, metrics) are async report requests in v3.
  requestReport(body: unknown) {
    return this.request<{ reportId: string }>("/reporting/reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

/** Lists the ad profiles available to the authenticated user. */
export async function listProfiles(connectionId: string) {
  const token = await getValidAccessToken(connectionId);
  if (!token || !isAdsConfigured()) {
    throw new Error("Amazon Ads not configured");
  }
  const res = await fetch(`${amazonConfig.ads.apiBase}/v2/profiles`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Amazon-Advertising-API-ClientId": amazonConfig.ads.clientId,
    },
  });
  if (!res.ok) throw new Error(`profiles failed: ${res.status}`);
  return res.json();
}
