import { prisma } from "@/lib/db/prisma";
import { decrypt, encrypt } from "@/lib/auth/crypto";
import { amazonAdsConfig } from "./config";

export class AmazonAdsClient {
  constructor(private connectionId: string) {}

  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: amazonAdsConfig.clientId,
      scope: "advertising::campaign_management",
      response_type: "code",
      redirect_uri: amazonAdsConfig.redirectUri,
      state,
    });
    return `${amazonAdsConfig.authUrl}?${params.toString()}`;
  }

  async getAccessToken(): Promise<string> {
    const connection = await prisma.amazonConnection.findUniqueOrThrow({
      where: { id: this.connectionId },
    });

    if (
      connection.accessToken &&
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt > new Date()
    ) {
      return decrypt(connection.accessToken);
    }

    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    const connection = await prisma.amazonConnection.findUniqueOrThrow({
      where: { id: this.connectionId },
    });

    if (!connection.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(amazonAdsConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decrypt(connection.refreshToken),
        client_id: amazonAdsConfig.clientId,
        client_secret: amazonAdsConfig.clientSecret,
      }),
    });

    if (!response.ok) {
      await prisma.amazonConnection.update({
        where: { id: this.connectionId },
        data: { status: "EXPIRED" },
      });
      throw new Error("Failed to refresh Amazon Ads token");
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.amazonConnection.update({
      where: { id: this.connectionId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: data.refresh_token
          ? encrypt(data.refresh_token)
          : connection.refreshToken,
        tokenExpiresAt: expiresAt,
        status: "CONNECTED",
      },
    });

    return data.access_token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${amazonAdsConfig.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Amazon-Advertising-API-ClientId": amazonAdsConfig.clientId,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Amazon Ads API error: ${response.status}`);
    }

    return response.json();
  }
}
