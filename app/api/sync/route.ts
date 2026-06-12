import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createSyncJob } from "@/lib/amazon/sync";
import { enqueueSyncJob } from "@/lib/queue";
import { syncJobSchema } from "@/lib/validations";
import { SyncJobType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { clientId, type } = syncJobSchema.parse(body);

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const job = await createSyncJob(clientId, (type as SyncJobType) ?? SyncJobType.FULL);
    const queued = await enqueueSyncJob(job.id);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      queued,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const jobs = await prisma.dataSyncJob.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch sync jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
