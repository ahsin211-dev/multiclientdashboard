import { Queue, Worker, type ConnectionOptions, type Job } from "bullmq";
import { runInitialClientSync } from "@/lib/amazon/sync";
import { env } from "@/lib/env";

export type SyncJobPayload = {
  clientId: string;
  reason: "manual" | "scheduled" | "oauth-connected" | "retry";
};

let queue: Queue | null = null;

function getConnection(): ConnectionOptions | null {
  if (!env.REDIS_URL) return null;

  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export function getSyncQueue() {
  const connection = getConnection();
  if (!connection) return null;
  queue ??= new Queue("amazon-client-sync", { connection });
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
