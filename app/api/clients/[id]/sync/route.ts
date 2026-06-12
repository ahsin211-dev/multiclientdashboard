import { DataSyncJobType } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { enqueueSyncJob, retrySyncJob } from "@/lib/queue/jobs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const jobs = await prisma.dataSyncJob.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { retryJobId?: string };

  if (body.retryJobId) {
    const retried = await retrySyncJob(body.retryJobId);
    return NextResponse.json({ job: retried, mode: "retry" });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    select: { workspaceId: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const job = await enqueueSyncJob(id, client.workspaceId, DataSyncJobType.MANUAL);
  return NextResponse.json({ job, mode: "manual" });
}
