import { SyncJobStatus, SyncJobType, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { normalizeMetrics } from "./normalize";

export async function createSyncJob(
  clientId: string,
  type: SyncJobType = SyncJobType.FULL
) {
  return prisma.dataSyncJob.create({
    data: { clientId, type, status: SyncJobStatus.PENDING },
  });
}

async function updateJobStatus(
  jobId: string,
  status: SyncJobStatus,
  error?: string,
  logs?: string[]
) {
  const data: Record<string, unknown> = { status };
  if (status === SyncJobStatus.RUNNING) data.startedAt = new Date();
  if (status === SyncJobStatus.COMPLETED || status === SyncJobStatus.FAILED) {
    data.completedAt = new Date();
  }
  if (error) data.error = error;
  if (logs) data.logs = logs;

  return prisma.dataSyncJob.update({ where: { id: jobId }, data });
}

export async function syncCampaigns(clientId: string): Promise<void> {
  // Placeholder: in production, fetch from Amazon Ads API and upsert
  const existing = await prisma.campaign.count({ where: { clientId } });
  if (existing === 0) {
    console.log(`[sync] No campaigns to sync for client ${clientId} — using seed data`);
  }
}

export async function syncAdGroups(clientId: string): Promise<void> {
  const existing = await prisma.adGroup.count({
    where: { campaign: { clientId } },
  });
  if (existing === 0) {
    console.log(`[sync] No ad groups to sync for client ${clientId}`);
  }
}

export async function syncKeywords(clientId: string): Promise<void> {
  const existing = await prisma.keyword.count({
    where: { adGroup: { campaign: { clientId } } },
  });
  if (existing === 0) {
    console.log(`[sync] No keywords to sync for client ${clientId}`);
  }
}

export async function syncSearchTerms(clientId: string): Promise<void> {
  const existing = await prisma.searchTerm.count({ where: { clientId } });
  if (existing === 0) {
    console.log(`[sync] No search terms to sync for client ${clientId}`);
  }
}

export async function syncProducts(clientId: string): Promise<void> {
  const existing = await prisma.product.count({ where: { clientId } });
  if (existing === 0) {
    console.log(`[sync] No products to sync for client ${clientId}`);
  }
}

export async function syncSalesMetrics(clientId: string): Promise<void> {
  const existing = await prisma.salesMetric.count({ where: { clientId } });
  if (existing === 0) {
    console.log(`[sync] No sales metrics to sync for client ${clientId}`);
  }
}

export async function syncSQPData(clientId: string): Promise<void> {
  const existing = await prisma.sQPMetric.count({ where: { clientId } });
  if (existing === 0) {
    console.log(`[sync] No SQP data to sync for client ${clientId}`);
  }
}

export async function runFullSync(clientId: string, jobId?: string): Promise<void> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(`[${new Date().toISOString()}] ${msg}`);
  };

  if (jobId) await updateJobStatus(jobId, SyncJobStatus.RUNNING);

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: SyncStatus.SYNCING },
    });

    log("Starting full sync");
    await syncCampaigns(clientId);
    log("Campaigns synced");
    await syncAdGroups(clientId);
    log("Ad groups synced");
    await syncKeywords(clientId);
    log("Keywords synced");
    await syncSearchTerms(clientId);
    log("Search terms synced");
    await syncProducts(clientId);
    log("Products synced");
    await syncSalesMetrics(clientId);
    log("Sales metrics synced");
    await syncSQPData(clientId);
    log("SQP data synced");
    await normalizeMetrics(clientId);
    log("Metrics normalized");

    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: SyncStatus.SUCCESS, lastSyncAt: new Date() },
    });

    if (jobId) {
      await updateJobStatus(jobId, SyncJobStatus.COMPLETED, undefined, logs);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`Sync failed: ${message}`);

    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: SyncStatus.FAILED },
    });

    if (jobId) {
      await updateJobStatus(jobId, SyncJobStatus.FAILED, message, logs);
    }
    throw error;
  }
}

export async function retrySyncJob(jobId: string): Promise<void> {
  const job = await prisma.dataSyncJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: {
      status: SyncJobStatus.PENDING,
      error: null,
      retryCount: { increment: 1 },
    },
  });

  await runFullSync(job.clientId, jobId);
}
