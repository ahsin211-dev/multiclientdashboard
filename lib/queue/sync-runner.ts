import { prisma } from "@/lib/db/prisma";
import { runFullSync } from "@/lib/amazon/sync";
import type { JobType } from "@prisma/client";

export interface SyncJobPayload {
  clientId: string;
  type?: JobType;
  jobId?: string; // existing DataSyncJob id (created before enqueue)
}

/** Creates a DataSyncJob row in PENDING state. */
export async function createSyncJob(clientId: string, type: JobType = "FULL_SYNC") {
  return prisma.dataSyncJob.create({
    data: { clientId, type, status: "PENDING", logs: [] },
  });
}

/**
 * Executes a sync job: flips status to RUNNING, runs the pipeline, captures logs,
 * and records COMPLETED/FAILED. This is called by the BullMQ worker or directly
 * (inline fallback).
 */
export async function processSyncJob(payload: SyncJobPayload) {
  const job =
    payload.jobId != null
      ? await prisma.dataSyncJob.findUnique({ where: { id: payload.jobId } })
      : await createSyncJob(payload.clientId, payload.type ?? "FULL_SYNC");

  if (!job) throw new Error("Sync job not found");

  // Prefer the clientId stored on the job (handles retries with empty payload).
  const clientId = job.clientId || payload.clientId;

  const logs: { ts: string; msg: string }[] = [];
  const log = async (msg: string) => {
    logs.push({ ts: new Date().toISOString(), msg });
    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: { logs: logs as unknown as object },
    });
  };

  await prisma.dataSyncJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });
  await prisma.client.update({
    where: { id: clientId },
    data: { syncStatus: "RUNNING" },
  });

  try {
    const result = await runFullSync(clientId, log);
    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
    return { jobId: job.id, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await log(`ERROR: ${message}`);
    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: "FAILED" },
    });
    throw err;
  }
}
