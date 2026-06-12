import { Queue, type JobsOptions } from "bullmq";
import { getRedis, isQueueEnabled } from "./connection";
import {
  createSyncJob,
  processSyncJob,
  type SyncJobPayload,
} from "./sync-runner";
import type { JobType } from "@prisma/client";

export const SYNC_QUEUE_NAME = "data-sync";

let syncQueue: Queue<SyncJobPayload> | null = null;

export function getSyncQueue(): Queue<SyncJobPayload> | null {
  if (!isQueueEnabled()) return null;
  const connection = getRedis();
  if (!connection) return null;
  if (!syncQueue) {
    // ioredis instance is shared; cast to satisfy BullMQ's bundled typings.
    syncQueue = new Queue<SyncJobPayload>(SYNC_QUEUE_NAME, {
      connection: connection as never,
    });
  }
  return syncQueue;
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

/**
 * Enqueue a sync for a client. Uses BullMQ when Redis is available; otherwise
 * runs the job inline (fire-and-forget) so the app works without Redis.
 * Always creates a DataSyncJob row first so the UI can track status.
 */
export async function enqueueSync(
  clientId: string,
  type: JobType = "FULL_SYNC"
): Promise<{ jobId: string; mode: "queued" | "inline" }> {
  const dbJob = await createSyncJob(clientId, type);
  const queue = getSyncQueue();

  if (queue) {
    await queue.add(
      "sync",
      { clientId, type, jobId: dbJob.id },
      defaultJobOptions
    );
    return { jobId: dbJob.id, mode: "queued" };
  }

  // Inline fallback — do not block the request.
  void processSyncJob({ clientId, type, jobId: dbJob.id }).catch((err) => {
    console.error("[inline-sync] failed:", err);
  });
  return { jobId: dbJob.id, mode: "inline" };
}

/**
 * Registers a daily repeatable sync for a client (cron). No-op when Redis is
 * disabled. Real cron triggering happens in the worker process.
 */
export async function scheduleDailySync(
  clientId: string,
  cron = "0 6 * * *"
): Promise<boolean> {
  const queue = getSyncQueue();
  if (!queue) return false;
  await queue.add(
    "scheduled-sync",
    { clientId, type: "FULL_SYNC" },
    { repeat: { pattern: cron }, jobId: `daily-${clientId}` }
  );
  return true;
}

export async function retryFailedSync(jobId: string) {
  // Re-run the existing DataSyncJob row.
  const queue = getSyncQueue();
  if (queue) {
    await queue.add("sync", { clientId: "", jobId }, defaultJobOptions);
    return { mode: "queued" as const };
  }
  void processSyncJob({ clientId: "", jobId }).catch(() => {});
  return { mode: "inline" as const };
}
