import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { enqueueSync } from "@/lib/queue/queues";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily scheduled sync entrypoint. Triggered by Vercel Cron (see vercel.json) or
 * any external scheduler. Protected by an optional CRON_SECRET bearer token.
 *
 * Enqueues a FULL_SYNC for every connected client. When Redis/BullMQ is enabled
 * jobs are queued; otherwise they run inline.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const clients = await prisma.client.findMany({
    where: { connections: { some: { type: "ADS", status: "CONNECTED" } } },
    select: { id: true },
  });

  const results = [];
  for (const c of clients) {
    const { jobId, mode } = await enqueueSync(c.id, "FULL_SYNC");
    results.push({ clientId: c.id, jobId, mode });
  }

  return NextResponse.json({ scheduled: results.length, results });
}
