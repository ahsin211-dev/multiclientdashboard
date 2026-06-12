import { Queue } from "bullmq";
import { DataSyncJobType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getRedisConnectionOptions, SYNC_QUEUE_NAME } from "@/lib/queue/connection";
import { runClientSync } from "@/lib/amazon/sync";

export interface ClientSyncJobPayload {
  jobId: string;
  clientId: string;
}

function getQueue() {
  const connection = getRedisConnectionOptions();
  if (!connection) return null;

  return new Queue<ClientSyncJobPayload>(SYNC_QUEUE_NAME, {
    connection
  });
}

export async function enqueueSyncJob(clientId: string, workspaceId: string, jobType: DataSyncJobType) {
  const dbJob = await prisma.dataSyncJob.create({
    data: {
      clientId,
      workspaceId,
      jobType
    }
  });

  const queue = getQueue();
  if (!queue) {
    // Local fallback for environments without Redis.
    await runClientSync(dbJob.id, clientId);
    return dbJob;
  }

  await queue.add("sync-client", { jobId: dbJob.id, clientId }, { attempts: 3, backoff: { type: "fixed", delay: 15000 } });
  return dbJob;
}

export async function retrySyncJob(jobId: string) {
  const job = await prisma.dataSyncJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("Sync job not found");
  }

  return enqueueSyncJob(job.clientId, job.workspaceId, DataSyncJobType.MANUAL);
}
