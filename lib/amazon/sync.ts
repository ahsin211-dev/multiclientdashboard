import { ClientSyncStatus, DataSyncJobStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { fetchAmazonAdsCampaigns } from "@/lib/amazon/ads";
import { fetchSPAPISalesMetrics } from "@/lib/amazon/sp-api";
import { fetchBrandAnalyticsSQPData } from "@/lib/amazon/brand-analytics";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

async function updateJobLog(jobId: string, step: string, status: "ok" | "error", details?: unknown) {
  const job = await prisma.dataSyncJob.findUnique({ where: { id: jobId } });
  const logs = (job?.logs as { entries?: Prisma.InputJsonValue[] } | null) ?? { entries: [] };

  const entries = [
    ...(logs.entries ?? []),
    toJsonValue({ step, status, at: new Date().toISOString(), details })
  ];
  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: {
      logs: { entries } as Prisma.InputJsonValue
    }
  });
}

export async function syncCampaigns(clientId: string, jobId?: string) {
  const campaigns = await fetchAmazonAdsCampaigns(clientId);
  if (jobId) await updateJobLog(jobId, "syncCampaigns", "ok", { imported: campaigns.length });
  return campaigns.length;
}

export async function syncAdGroups(_clientId: string, jobId?: string) {
  if (jobId) await updateJobLog(jobId, "syncAdGroups", "ok", { imported: 0 });
  return 0;
}

export async function syncKeywords(_clientId: string, jobId?: string) {
  if (jobId) await updateJobLog(jobId, "syncKeywords", "ok", { imported: 0 });
  return 0;
}

export async function syncSearchTerms(_clientId: string, jobId?: string) {
  if (jobId) await updateJobLog(jobId, "syncSearchTerms", "ok", { imported: 0 });
  return 0;
}

export async function syncProducts(_clientId: string, jobId?: string) {
  if (jobId) await updateJobLog(jobId, "syncProducts", "ok", { imported: 0 });
  return 0;
}

export async function syncSalesMetrics(clientId: string, jobId?: string) {
  const metrics = await fetchSPAPISalesMetrics(clientId);
  if (jobId) await updateJobLog(jobId, "syncSalesMetrics", "ok", { imported: metrics.length });
  return metrics.length;
}

export async function syncSQPData(clientId: string, jobId?: string) {
  const sqpData = await fetchBrandAnalyticsSQPData(clientId);
  if (jobId) await updateJobLog(jobId, "syncSQPData", "ok", { imported: sqpData.length });
  return sqpData.length;
}

export async function normalizeMetrics(_clientId: string, jobId?: string) {
  if (jobId) await updateJobLog(jobId, "normalizeMetrics", "ok");
  return true;
}

export async function runClientSync(jobId: string, clientId: string) {
  try {
    await prisma.dataSyncJob.update({
      where: { id: jobId },
      data: { status: DataSyncJobStatus.RUNNING, startedAt: new Date() }
    });
    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: ClientSyncStatus.SYNCING }
    });

    await syncCampaigns(clientId, jobId);
    await syncAdGroups(clientId, jobId);
    await syncKeywords(clientId, jobId);
    await syncSearchTerms(clientId, jobId);
    await syncProducts(clientId, jobId);
    await syncSalesMetrics(clientId, jobId);
    await syncSQPData(clientId, jobId);
    await normalizeMetrics(clientId, jobId);

    await prisma.dataSyncJob.update({
      where: { id: jobId },
      data: {
        status: DataSyncJobStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    await prisma.client.update({
      where: { id: clientId },
      data: {
        syncStatus: ClientSyncStatus.CONNECTED,
        lastSyncDate: new Date()
      }
    });
  } catch (error) {
    await prisma.dataSyncJob.update({
      where: { id: jobId },
      data: {
        status: DataSyncJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown sync error",
        retryCount: { increment: 1 }
      }
    });
    await prisma.client.update({
      where: { id: clientId },
      data: { syncStatus: ClientSyncStatus.FAILED }
    });
    throw error;
  }
}
