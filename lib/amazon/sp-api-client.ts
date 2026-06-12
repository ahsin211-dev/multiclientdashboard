import { spApiConfig } from "./config";

export class SpApiClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    const response = await fetch(spApiConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: spApiConfig.refreshToken,
        client_id: spApiConfig.clientId,
        client_secret: spApiConfig.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh SP-API token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    return this.accessToken!;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${spApiConfig.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        "x-amz-access-token": token,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`SP-API error: ${response.status}`);
    }

    return response.json();
  }
}
