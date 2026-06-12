import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AmazonAdsClient } from "@/lib/amazon/ads-client";
import { isAmazonAdsConfigured } from "@/lib/amazon/config";
import { z } from "zod";

const connectSchema = z.object({ clientId: z.string().cuid() });

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { clientId } = connectSchema.parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!isAmazonAdsConfigured()) {
      return NextResponse.json({
        error: "Amazon Ads API credentials not configured",
        placeholder: true,
        message: "Set AMAZON_ADS_CLIENT_ID and AMAZON_ADS_CLIENT_SECRET in environment variables",
      }, { status: 503 });
    }

    let connection = await prisma.amazonConnection.findFirst({
      where: { clientId, type: "AMAZON_ADS" },
    });

    if (!connection) {
      connection = await prisma.amazonConnection.create({
        data: { clientId, type: "AMAZON_ADS", status: "PENDING" },
      });
    }

    const state = Buffer.from(JSON.stringify({ connectionId: connection.id, clientId })).toString("base64");
    const authUrl = AmazonAdsClient.getAuthUrl(state);

    return NextResponse.json({ authUrl, connectionId: connection.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
