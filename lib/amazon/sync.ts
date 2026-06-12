import { syncAdGroups, syncCampaigns, syncKeywords, syncSearchTerms } from "@/lib/amazon/advertising";
import { syncSQPData } from "@/lib/amazon/brand-analytics";
import { syncProducts, syncSalesMetrics } from "@/lib/amazon/sp-api";

export async function normalizeMetrics(clientId: string) {
  return { clientId, entity: "normalizedMetrics", synced: true, records: 30 };
}

export async function runInitialClientSync(clientId: string) {
  const steps = await Promise.all([
    syncCampaigns(clientId),
    syncAdGroups(clientId),
    syncKeywords(clientId),
    syncSearchTerms(clientId),
    syncProducts(clientId),
    syncSalesMetrics(clientId),
    syncSQPData(clientId),
  ]);

  const normalized = await normalizeMetrics(clientId);
  return [...steps, normalized];
}
