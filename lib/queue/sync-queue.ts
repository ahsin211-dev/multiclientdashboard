import { Queue } from "bullmq";

import { syncAdGroups, syncCampaigns, syncKeywords, syncSearchTerms } from "@/lib/amazon/ads";
import { syncSQPData } from "@/lib/amazon/brand-analytics";
import { syncProducts, syncSalesMetrics } from "@/lib/amazon/sp-api";

const REDIS_URL = process.env.REDIS_URL;

export type SyncJobPayload = {
  clientId: string;
  trigger: "manual" | "daily";
};

let syncQueue: Queue | null = null;

function getQueue() {
  if (!REDIS_URL) {
    return null;
  }

  if (!syncQueue) {
    const redisUrl = new URL(REDIS_URL);

    syncQueue = new Queue("client-sync", {
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        username: redisUrl.username || undefined,
        password: redisUrl.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: redisUrl.protocol === "rediss:" ? {} : undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  return syncQueue;
}

export async function enqueueClientSync(payload: SyncJobPayload) {
  const queue = getQueue();

  if (!queue) {
    return {
      queued: false,
      fallback: true,
      payload,
    };
  }

  const job = await queue.add(`sync:${payload.clientId}:${payload.trigger}`, payload);

  return {
    queued: true,
    jobId: job.id,
  };
}

export async function runClientSync(clientId: string) {
  const steps = await Promise.all([
    syncCampaigns(clientId),
    syncAdGroups(clientId),
    syncKeywords(clientId),
    syncSearchTerms(clientId),
    syncProducts(clientId),
    syncSalesMetrics(clientId),
    syncSQPData(clientId),
  ]);

  return {
    clientId,
    status: "completed",
    syncedAt: new Date().toISOString(),
    steps,
  };
}
