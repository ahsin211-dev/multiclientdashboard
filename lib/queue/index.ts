import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import { executeSyncJob } from "@/lib/amazon/sync";

const QUEUE_NAME = "data-sync";

function getConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return { url, maxRetriesPerRequest: null };
}

let syncQueue: Queue | null = null;
let syncWorker: Worker | null = null;

export function getSyncQueue(): Queue | null {
  const connection = getConnection();
  if (!connection) return null;
  if (!syncQueue) {
    syncQueue = new Queue(QUEUE_NAME, { connection });
  }
  return syncQueue;
}

export async function enqueueSyncJob(jobId: string): Promise<boolean> {
  const queue = getSyncQueue();
  if (!queue) {
    // Fallback: run inline when Redis unavailable (dev/MVP)
    await executeSyncJob(jobId);
    return false;
  }

  await queue.add("sync", { jobId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
  return true;
}

export function startSyncWorker() {
  const connection = getConnection();
  if (!connection || syncWorker) return syncWorker;

  syncWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<{ jobId: string }>) => {
      await executeSyncJob(job.data.jobId);
    },
    { connection }
  );

  syncWorker.on("failed", (job, err) => {
    console.error(`Sync job ${job?.id} failed:`, err.message);
  });

  return syncWorker;
}

export async function scheduleDailySyncs() {
  const queue = getSyncQueue();
  if (!queue) return;

  await queue.add(
    "daily-sync",
    {},
    {
      repeat: { pattern: "0 6 * * *" },
      jobId: "daily-sync-cron",
    }
  );
}
