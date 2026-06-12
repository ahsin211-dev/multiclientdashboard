import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { runInitialClientSync } from "@/lib/amazon/sync";
import { env } from "@/lib/env";

export type SyncJobPayload = {
  clientId: string;
  reason: "manual" | "scheduled" | "oauth-connected" | "retry";
};

let queue: Queue<SyncJobPayload> | null = null;

function getConnection() {
  if (!env.REDIS_URL) return null;
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export function getSyncQueue() {
  const connection = getConnection();
  if (!connection) return null;
  queue ??= new Queue<SyncJobPayload>("amazon-client-sync", { connection });
  return queue;
}

export async function enqueueSyncJob(payload: SyncJobPayload) {
  const syncQueue = getSyncQueue();
  if (!syncQueue) {
    const result = await runInitialClientSync(payload.clientId);
    return {
      id: `inline-${Date.now()}`,
      status: "completed",
      mode: "inline",
      result,
    };
  }

  const job = await syncQueue.add("sync-client", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });

  return {
    id: job.id,
    status: "pending",
    mode: "bullmq",
  };
}

export function createSyncWorker() {
  const connection = getConnection();
  if (!connection) return null;

  return new Worker<SyncJobPayload>(
    "amazon-client-sync",
    async (job: Job<SyncJobPayload>) => runInitialClientSync(job.data.clientId),
    { connection },
  );
}

export async function scheduleDailySync(clientIds: string[]) {
  const syncQueue = getSyncQueue();
  if (!syncQueue) {
    return Promise.all(clientIds.map((clientId) => enqueueSyncJob({ clientId, reason: "scheduled" })));
  }

  return Promise.all(
    clientIds.map((clientId) =>
      syncQueue.add(
        "daily-sync",
        { clientId, reason: "scheduled" },
        {
          repeat: { pattern: "0 6 * * *" },
          jobId: `daily-sync-${clientId}`,
        },
      ),
    ),
  );
}
