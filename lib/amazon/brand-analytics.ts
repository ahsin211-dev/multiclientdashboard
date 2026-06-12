import { AmazonSpApiClient } from "./sp-api";

/**
 * Brand Analytics / Search Query Performance (SQP) access. SQP is delivered via
 * SP-API reports (GET_BRAND_ANALYTICS_SEARCH_QUERY_PERFORMANCE_REPORT) at the
 * ASIN or brand level. This wrapper documents the report request shape.
 */
export class BrandAnalyticsClient {
  constructor(private readonly sp = new AmazonSpApiClient()) {}

  requestSearchQueryPerformanceReport(opts: {
    marketplaceId: string;
    asins?: string[];
    reportPeriod?: "WEEK" | "MONTH" | "QUARTER";
    weekStart?: string;
  }) {
    return this.sp.requestSalesAndTrafficReport({
      reportType: "GET_BRAND_ANALYTICS_SEARCH_QUERY_PERFORMANCE_REPORT",
      marketplaceIds: [opts.marketplaceId],
      reportOptions: {
        reportPeriod: opts.reportPeriod ?? "WEEK",
        ...(opts.asins ? { asin: opts.asins.join(",") } : {}),
      },
      ...(opts.weekStart ? { dataStartTime: opts.weekStart } : {}),
    });
  }
}
