import { Worker } from "bullmq";
import { getRedis } from "./connection";
import { SYNC_QUEUE_NAME } from "./queues";
import { processSyncJob, type SyncJobPayload } from "./sync-runner";

/**
 * Standalone BullMQ worker process. Run with: `npm run worker`.
 *
 * Handles both ad-hoc syncs (enqueued via enqueueSync) and scheduled/cron syncs
 * (registered via scheduleDailySync). Failures are retried per the queue's
 * backoff policy.
 */
function main() {
  const connection = getRedis();
  if (!connection) {
    console.error(
      "[worker] REDIS_URL not set — worker cannot start. Syncs will run inline instead."
    );
    process.exit(1);
  }

  const worker = new Worker<SyncJobPayload>(
    SYNC_QUEUE_NAME,
    async (job) => {
      console.log(`[worker] processing ${job.name} (${job.id})`, job.data);
      return processSyncJob(job.data);
    },
    { connection: connection as never, concurrency: 4 }
  );

  worker.on("completed", (job) => {
    console.log(`[worker] completed ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[worker] failed ${job?.id}:`, err.message);
  });

  console.log("[worker] data-sync worker started.");
}

main();
