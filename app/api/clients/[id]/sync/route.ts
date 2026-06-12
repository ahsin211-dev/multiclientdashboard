import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { enqueueSync } from "@/lib/queue/queues";

export const dynamic = "force-dynamic";

/** Triggers a manual sync (queued via BullMQ or run inline). */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { jobId, mode } = await enqueueSync(client.id, "FULL_SYNC");
  return NextResponse.json({ jobId, mode });
}

/** Returns the status of a given sync job (for polling). */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (jobId) {
    const job = await prisma.dataSyncJob.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({
      status: job.status,
      error: job.error,
      logs: job.logs,
    });
  }

  const jobs = await prisma.dataSyncJob.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(jobs);
}
