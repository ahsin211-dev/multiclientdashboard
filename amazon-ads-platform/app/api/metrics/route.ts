import { NextRequest } from "next/server";
import { getClientMetrics, getCampaignPerformance, getDailyChartData } from "@/lib/analytics/metrics";
import { z } from "zod";

const querySchema = z.object({
  clientId: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { clientId, from, to } = querySchema.parse({
      clientId: searchParams.get("clientId"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const now = new Date();
    const dateRange = {
      from: from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: to ? new Date(to) : now,
    };

    const [metrics, campaigns, chartData] = await Promise.all([
      getClientMetrics(clientId, dateRange),
      getCampaignPerformance(clientId, dateRange),
      getDailyChartData(clientId, 30),
    ]);

    return Response.json({ metrics, campaigns, chartData });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
