import { db } from "@/lib/db";
import { SyncJobType, SyncJobStatus } from "@prisma/client";
import { getAdsAccessToken, syncCampaigns as fetchCampaigns } from "./ads-api";
import { getSPAccessToken, syncSalesMetrics as fetchSalesMetrics } from "./sp-api";

async function updateJobStatus(
  jobId: string,
  status: SyncJobStatus,
  opts: { error?: string; recordsSync?: number; log?: string } = {}
) {
  const job = await db.dataSyncJob.findUnique({ where: { id: jobId } });
  const logs = (job?.logs as string[]) ?? [];
  if (opts.log) logs.push(`[${new Date().toISOString()}] ${opts.log}`);

  await db.dataSyncJob.update({
    where: { id: jobId },
    data: {
      status,
      error: opts.error,
      recordsSync: opts.recordsSync,
      logs,
      startedAt: status === "RUNNING" ? new Date() : undefined,
      completedAt:
        status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
    },
  });
}

export async function createSyncJob(clientId: string, type: SyncJobType) {
  return db.dataSyncJob.create({
    data: { clientId, type, status: "PENDING", logs: [] },
  });
}

export async function runSyncJob(jobId: string) {
  const job = await db.dataSyncJob.findUnique({
    where: { id: jobId },
    include: { client: { include: { amazonConnection: true } } },
  });

  if (!job) throw new Error(`Job ${jobId} not found`);
  if (!job.client.amazonConnection) {
    await updateJobStatus(jobId, "FAILED", {
      error: "No Amazon connection found for this client",
    });
    return;
  }

  await updateJobStatus(jobId, "RUNNING", { log: `Starting ${job.type} sync` });

  try {
    const conn = job.client.amazonConnection;

    switch (job.type) {
      case "CAMPAIGNS":
        await syncCampaignsJob(job.clientId, conn, jobId);
        break;
      case "SALES_METRICS":
        await syncSalesMetricsJob(job.clientId, conn, jobId);
        break;
      case "FULL_SYNC":
        await runFullSync(job.clientId, conn, jobId);
        break;
      default:
        await updateJobStatus(jobId, "COMPLETED", {
          log: `${job.type} sync placeholder — connect Amazon API to run`,
        });
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await updateJobStatus(jobId, "FAILED", { error, log: `Error: ${error}` });
  }
}

async function syncCampaignsJob(
  clientId: string,
  conn: { adsRefreshToken: string | null; adsProfileId: string | null },
  jobId: string
) {
  if (!conn.adsRefreshToken || !conn.adsProfileId) {
    await updateJobStatus(jobId, "FAILED", {
      error: "Missing Ads refresh token or profile ID",
    });
    return;
  }

  const { accessToken } = await getAdsAccessToken(conn.adsRefreshToken);
  const campaigns = await fetchCampaigns(accessToken, conn.adsProfileId, clientId);

  let count = 0;
  for (const c of campaigns) {
    await db.campaign.upsert({
      where: { amazonCampaignId: String(c.campaignId) },
      create: {
        amazonCampaignId: String(c.campaignId),
        name: c.name,
        campaignType: "SPONSORED_PRODUCTS",
        state: c.state?.toUpperCase() ?? "ENABLED",
        dailyBudget: c.dailyBudget ?? 0,
        clientId,
      },
      update: {
        name: c.name,
        state: c.state?.toUpperCase() ?? "ENABLED",
        dailyBudget: c.dailyBudget ?? 0,
      },
    });
    count++;
  }

  await updateJobStatus(jobId, "COMPLETED", {
    recordsSync: count,
    log: `Synced ${count} campaigns`,
  });
}

async function syncSalesMetricsJob(
  clientId: string,
  conn: { spRefreshToken: string | null },
  jobId: string
) {
  if (!conn.spRefreshToken) {
    await updateJobStatus(jobId, "FAILED", {
      error: "Missing SP-API refresh token",
    });
    return;
  }

  const { accessToken } = await getSPAccessToken(conn.spRefreshToken);
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const result = await fetchSalesMetrics(accessToken, startDate, endDate);

  let count = 0;
  for (const metric of result?.payload ?? []) {
    await db.salesMetric.create({
      data: {
        clientId,
        date: new Date(metric.interval.split("--")[0]),
        orderedUnits: metric.unitCount ?? 0,
        orderedRevenue: metric.orderItemCount ?? 0,
        sessions: metric.sessionCount ?? 0,
        pageViews: metric.browserPageViews ?? 0,
      },
    });
    count++;
  }

  await updateJobStatus(jobId, "COMPLETED", {
    recordsSync: count,
    log: `Synced ${count} daily sales metrics`,
  });
}

async function runFullSync(
  clientId: string,
  conn: { adsRefreshToken: string | null; adsProfileId: string | null; spRefreshToken: string | null },
  jobId: string
) {
  await updateJobStatus(jobId, "RUNNING", { log: "Starting full sync..." });

  if (conn.adsRefreshToken && conn.adsProfileId) {
    await syncCampaignsJob(clientId, conn, jobId);
  }

  if (conn.spRefreshToken) {
    await syncSalesMetricsJob(clientId, conn, jobId);
  }

  await db.amazonConnection.update({
    where: { clientId },
    data: { lastSyncAt: new Date(), syncStatus: "completed" },
  });

  await updateJobStatus(jobId, "COMPLETED", { log: "Full sync completed" });
}
