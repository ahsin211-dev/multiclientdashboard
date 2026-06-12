import { Worker } from "bullmq";

import { runClientSync } from "@/lib/amazon/sync";
import { getRedisConnectionOptions, SYNC_QUEUE_NAME } from "@/lib/queue/connection";

export function startSyncWorker() {
  const connection = getRedisConnectionOptions();
  if (!connection) {
    console.warn("REDIS_URL not configured; queue worker is disabled.");
    return null;
  }

  const worker = new Worker(
    SYNC_QUEUE_NAME,
    async (job) => {
      await runClientSync(job.data.jobId, job.data.clientId);
    },
    { connection, concurrency: 2 }
  );

  worker.on("completed", (job) => {
    console.info(`Sync job completed: ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Sync job failed: ${job?.id}`, error);
  });

  return worker;
}
