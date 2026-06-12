import { NextRequest } from "next/server";
import { z } from "zod";
import { enqueueSyncJob } from "@/lib/queue/sync-queue";
import { SyncJobType } from "@prisma/client";

const requestSchema = z.object({
  clientId: z.string(),
  type: z.enum(["CAMPAIGNS", "AD_GROUPS", "KEYWORDS", "SEARCH_TERMS", "PRODUCTS", "SALES_METRICS", "SQP_DATA", "FULL_SYNC"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, type } = requestSchema.parse(body);

    const jobId = await enqueueSyncJob(clientId, type as SyncJobType);

    return Response.json({ success: true, jobId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return Response.json({ error: "clientId required" }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    const jobs = await db.dataSyncJob.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
