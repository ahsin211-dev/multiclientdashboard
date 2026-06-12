import { Queue, Worker, type Job } from "bullmq";
import { SyncJobType } from "@prisma/client";
import { createSyncJob, runFullSync } from "@/lib/amazon/sync";

const QUEUE_NAME = "data-sync";

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || "6379", 10),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return null;
  }
}

let syncQueue: Queue | null = null;

export function getSyncQueue(): Queue | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!syncQueue) {
    syncQueue = new Queue(QUEUE_NAME, { connection });
  }
  return syncQueue;
}

export async function enqueueSync(
  clientId: string,
  type: SyncJobType = SyncJobType.FULL
): Promise<string> {
  const job = await createSyncJob(clientId, type);
  const queue = getSyncQueue();

  if (queue) {
    await queue.add(
      "sync",
      { clientId, jobId: job.id, type },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );
  } else {
    // Fallback: run sync directly when Redis is unavailable
    runFullSync(clientId, job.id).catch(console.error);
  }

  return job.id;
}

export function createSyncWorker(): Worker | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<{ clientId: string; jobId: string }>) => {
      const { clientId, jobId } = job.data;
      await runFullSync(clientId, jobId);
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`Sync job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Schedule daily sync for all clients with active connections.
 * Call from a cron endpoint (e.g. Vercel Cron or external scheduler).
 */
export async function scheduleDailySync(): Promise<number> {
  const { prisma } = await import("@/lib/db/prisma");
  const clients = await prisma.client.findMany({
    where: {
      connections: { some: { status: "CONNECTED" } },
    },
    select: { id: true },
  });

  let enqueued = 0;
  for (const client of clients) {
    await enqueueSync(client.id);
    enqueued++;
  }

  return enqueued;
}
