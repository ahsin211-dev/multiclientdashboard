import { DataSyncJobType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAmazonAdsOAuthUrl, saveAmazonAdsConnection } from "@/lib/amazon/ads";
import { saveSPAPIConnection } from "@/lib/amazon/sp-api";
import { prisma } from "@/lib/db/prisma";
import { enqueueSyncJob } from "@/lib/queue/jobs";

const connectSchema = z.object({
  clientId: z.string().min(1),
  adsAccessToken: z.string().min(1),
  adsRefreshToken: z.string().min(1),
  spAccessToken: z.string().min(1),
  spRefreshToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive().default(3600)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") ?? "connect-amazon";
  return NextResponse.json({
    oauthUrl: getAmazonAdsOAuthUrl(state)
  });
}

export async function POST(request: Request) {
  try {
    const payload = connectSchema.parse(await request.json());
    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { workspaceId: true }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await Promise.all([
      saveAmazonAdsConnection({
        clientId: payload.clientId,
        accessToken: payload.adsAccessToken,
        refreshToken: payload.adsRefreshToken,
        expiresInSeconds: payload.expiresInSeconds
      }),
      saveSPAPIConnection({
        clientId: payload.clientId,
        accessToken: payload.spAccessToken,
        refreshToken: payload.spRefreshToken,
        expiresInSeconds: payload.expiresInSeconds
      })
    ]);

    const syncJob = await enqueueSyncJob(payload.clientId, client.workspaceId, DataSyncJobType.INITIAL_SYNC);

    return NextResponse.json({
      ok: true,
      message: "Amazon account connected. Initial sync queued.",
      syncJob
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
