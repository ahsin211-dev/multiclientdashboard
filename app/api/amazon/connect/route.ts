import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { connectRequestSchema } from "@/lib/validation";
import { saveConnection, buildAuthUrl } from "@/lib/amazon/oauth";
import { isAdsConfigured } from "@/lib/amazon/config";
import { enqueueSync } from "@/lib/queue/queues";

export const dynamic = "force-dynamic";

/**
 * Placeholder connect endpoint.
 *
 * - In LIVE mode (Ads credentials configured): returns the Amazon consent URL so
 *   the client can redirect the user into the real OAuth flow.
 * - In DEMO mode: stores a demo connection with encrypted tokens and triggers
 *   the first sync, so the workflow is fully exercisable.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = connectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { clientId, type } = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (type === "ADS" && isAdsConfigured()) {
    const state = `${clientId}:${type}`;
    return NextResponse.json({ redirectUrl: buildAuthUrl(state), mode: "live" });
  }

  // Demo connection.
  await saveConnection(
    clientId,
    type,
    { access_token: "demo-access", refresh_token: "demo-refresh", expires_in: 3600 },
    `${type === "ADS" ? "profile" : "seller"}-${clientId.slice(0, 6)}`
  );

  // Trigger the first sync after connecting.
  const { jobId, mode } = await enqueueSync(clientId, "FULL_SYNC");
  return NextResponse.json({ connected: true, mode, jobId });
}
