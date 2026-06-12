/**
 * BullMQ-based queue for Amazon data sync jobs.
 * Falls back gracefully when Redis is not available (dev mode).
 */

import { SyncJobType } from "@prisma/client";
import { createSyncJob, runSyncJob } from "@/lib/amazon/sync";

let Queue: typeof import("bullmq").Queue | null = null;
let Worker: typeof import("bullmq").Worker | null = null;
let Connection: { host: string; port: number; url?: string } | null = null;

async function loadBullMQ() {
  if (Queue) return { Queue, Worker };
  try {
    const bullmq = await import("bullmq");
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    const parsed = new URL(url);
    Connection = { host: parsed.hostname, port: Number(parsed.port) || 6379 };
    return { Queue, Worker };
  } catch {
    return { Queue: null, Worker: null };
  }
}

export const SYNC_QUEUE_NAME = "amazon-data-sync";

let syncQueue: import("bullmq").Queue | null = null;

export async function getSyncQueue() {
  if (syncQueue) return syncQueue;
  const { Queue: Q } = await loadBullMQ();
  if (!Q || !Connection) return null;

  try {
    syncQueue = new Q(SYNC_QUEUE_NAME, { connection: Connection });
    return syncQueue;
  } catch {
    return null;
  }
}

export async function enqueueSyncJob(
  clientId: string,
  type: SyncJobType
): Promise<string> {
  const job = await createSyncJob(clientId, type);

  const queue = await getSyncQueue();
  if (queue) {
    await queue.add(
      "sync",
      { jobId: job.id, clientId, type },
      { jobId: `${clientId}-${type}-${Date.now()}`, attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
  } else {
    // Fallback: run synchronously in dev when Redis is unavailable
    console.log(`[Queue] Redis unavailable — running ${type} sync inline for client ${clientId}`);
    runSyncJob(job.id).catch(console.error);
  }

  return job.id;
}

export async function startSyncWorker() {
  const { Worker: W } = await loadBullMQ();
  if (!W || !Connection) {
    console.log("[Queue] BullMQ worker not started — Redis unavailable");
    return null;
  }

  const worker = new W(
    SYNC_QUEUE_NAME,
    async (job) => {
      const { jobId } = job.data as { jobId: string };
      await runSyncJob(jobId);
    },
    { connection: Connection, concurrency: 3 }
  );

  worker.on("completed", (job) => {
    console.log(`[Queue] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Queue] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export async function scheduleDailySync(clientIds: string[]) {
  const queue = await getSyncQueue();
  if (!queue) return;

  for (const clientId of clientIds) {
    await queue.add(
      "daily-sync",
      { clientId, type: "FULL_SYNC" as SyncJobType },
      {
        repeat: { pattern: "0 6 * * *" }, // daily at 6am UTC
        jobId: `daily-${clientId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 30000 },
      }
    );
  }
}
