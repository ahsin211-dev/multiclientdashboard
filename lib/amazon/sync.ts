import { prisma } from "@/lib/db/prisma";
import { SyncJobStatus, SyncJobType, SyncStatus } from "@prisma/client";

type SyncLogEntry = { timestamp: string; message: string; level: "info" | "error" };

async function appendLog(jobId: string, message: string, level: "info" | "error" = "info") {
  const job = await prisma.dataSyncJob.findUniqueOrThrow({ where: { id: jobId } });
  const logs = (job.logs as SyncLogEntry[]) ?? [];
  logs.push({ timestamp: new Date().toISOString(), message, level });
  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: { logs },
  });
}

async function runSyncStep(
  jobId: string,
  clientId: string,
  step: string,
  fn: () => Promise<number>
) {
  await appendLog(jobId, `Starting ${step}`);
  try {
    const count = await fn();
    await appendLog(jobId, `Completed ${step}: ${count} records`);
    return count;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await appendLog(jobId, `Failed ${step}: ${message}`, "error");
    throw error;
  }
}

/** Placeholder sync — uses existing seed data structure; replace with live API calls */
export async function syncCampaigns(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncCampaigns", async () => {
    const count = await prisma.campaign.count({ where: { clientId } });
    return count;
  });
}

export async function syncAdGroups(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncAdGroups", async () => {
    return prisma.adGroup.count({
      where: { campaign: { clientId } },
    });
  });
}

export async function syncKeywords(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncKeywords", async () => {
    return prisma.keyword.count({
      where: { adGroup: { campaign: { clientId } } },
    });
  });
}

export async function syncSearchTerms(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncSearchTerms", async () => {
    return prisma.searchTerm.count({ where: { clientId } });
  });
}

export async function syncProducts(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncProducts", async () => {
    return prisma.product.count({ where: { clientId } });
  });
}

export async function syncSalesMetrics(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncSalesMetrics", async () => {
    return prisma.salesMetric.count({ where: { clientId } });
  });
}

export async function syncSQPData(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "syncSQPData", async () => {
    return prisma.sQPMetric.count({ where: { clientId } });
  });
}

export async function normalizeMetrics(clientId: string, jobId: string): Promise<number> {
  return runSyncStep(jobId, clientId, "normalizeMetrics", async () => {
    const metrics = await prisma.adMetric.findMany({
      where: { clientId },
      select: { id: true, spend: true, sales: true, clicks: true, impressions: true, orders: true },
    });

    for (const m of metrics) {
      await prisma.adMetric.update({
        where: { id: m.id },
        data: {
          acos: m.sales > 0 ? (m.spend / m.sales) * 100 : 0,
          roas: m.spend > 0 ? m.sales / m.spend : 0,
          ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
          cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
          cvr: m.clicks > 0 ? (m.orders / m.clicks) * 100 : 0,
        },
      });
    }

    return metrics.length;
  });
}

const SYNC_HANDLERS: Record<SyncJobType, (clientId: string, jobId: string) => Promise<number>> = {
  FULL: async (clientId, jobId) => {
    await syncCampaigns(clientId, jobId);
    await syncAdGroups(clientId, jobId);
    await syncKeywords(clientId, jobId);
    await syncSearchTerms(clientId, jobId);
    await syncProducts(clientId, jobId);
    await syncSalesMetrics(clientId, jobId);
    await syncSQPData(clientId, jobId);
    return normalizeMetrics(clientId, jobId);
  },
  CAMPAIGNS: syncCampaigns,
  AD_GROUPS: syncAdGroups,
  KEYWORDS: syncKeywords,
  SEARCH_TERMS: syncSearchTerms,
  PRODUCTS: syncProducts,
  SALES_METRICS: syncSalesMetrics,
  SQP_DATA: syncSQPData,
  NORMALIZE: normalizeMetrics,
};

export async function executeSyncJob(jobId: string): Promise<void> {
  const job = await prisma.dataSyncJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { client: true },
  });

  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: { status: SyncJobStatus.RUNNING, startedAt: new Date() },
  });

  await prisma.client.update({
    where: { id: job.clientId },
    data: { syncStatus: SyncStatus.RUNNING },
  });

  try {
    const handler = SYNC_HANDLERS[job.type];
    await handler(job.clientId, jobId);

    await prisma.dataSyncJob.update({
      where: { id: jobId },
      data: {
        status: SyncJobStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await prisma.client.update({
      where: { id: job.clientId },
      data: {
        syncStatus: SyncStatus.COMPLETED,
        lastSyncAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await prisma.dataSyncJob.update({
      where: { id: jobId },
      data: {
        status: SyncJobStatus.FAILED,
        error: message,
        completedAt: new Date(),
        retryCount: { increment: 1 },
      },
    });

    await prisma.client.update({
      where: { id: job.clientId },
      data: { syncStatus: SyncStatus.FAILED },
    });

    throw error;
  }
}

export async function createSyncJob(clientId: string, type: SyncJobType = SyncJobType.FULL) {
  return prisma.dataSyncJob.create({
    data: { clientId, type, status: SyncJobStatus.PENDING },
  });
}

export async function retrySyncJob(jobId: string) {
  const job = await prisma.dataSyncJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.retryCount >= job.maxRetries) {
    throw new Error("Max retries exceeded");
  }

  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: {
      status: SyncJobStatus.PENDING,
      error: null,
      startedAt: null,
      completedAt: null,
    },
  });

  return job;
}
