import { PrismaPg } from "@prisma/adapter-pg";
import {
  AmazonConnectionType,
  ChatRole,
  ClientSyncStatus,
  DataSyncJobStatus,
  DataSyncJobType,
  PrismaClient,
  WorkspaceRole
} from "@prisma/client";
import { subDays } from "date-fns";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/amazon_intel_mvp?schema=public"
});
const prisma = new PrismaClient({ adapter });

function hashToken(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function resetDatabase() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.marketingPlan.deleteMany();
  await prisma.auditReport.deleteMany();
  await prisma.dataSyncJob.deleteMany();
  await prisma.sQPMetric.deleteMany();
  await prisma.adMetric.deleteMany();
  await prisma.salesMetric.deleteMany();
  await prisma.searchTerm.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.adGroup.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.amazonConnection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  const user = await prisma.user.create({
    data: {
      email: "owner@agencyos.dev",
      name: "Agency Owner"
    }
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Peak Retail Media"
    }
  });

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER
    }
  });

  const seedClients = [
    { brandName: "Nordic Naturals", marketplace: "US" },
    { brandName: "Summit Home", marketplace: "UK" }
  ];

  for (const seedClient of seedClients) {
    const client = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        brandName: seedClient.brandName,
        marketplace: seedClient.marketplace,
        syncStatus: ClientSyncStatus.CONNECTED,
        lastSyncDate: new Date()
      }
    });

    await prisma.amazonConnection.createMany({
      data: [
        {
          clientId: client.id,
          connectionType: AmazonConnectionType.ADS,
          region: "NA",
          encryptedAccessToken: hashToken(`ads_access_${client.id}`),
          encryptedRefreshToken: hashToken(`ads_refresh_${client.id}`),
          tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 45)
        },
        {
          clientId: client.id,
          connectionType: AmazonConnectionType.SP_API,
          region: "NA",
          encryptedAccessToken: hashToken(`sp_access_${client.id}`),
          encryptedRefreshToken: hashToken(`sp_refresh_${client.id}`),
          tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 45)
        }
      ]
    });

    const adAccount = await prisma.adAccount.create({
      data: {
        clientId: client.id,
        externalAccountId: `ACC-${client.marketplace}-${Math.floor(Math.random() * 10000)}`,
        name: `${client.brandName} Main Ads`,
        currency: "USD",
        timezone: "America/Los_Angeles"
      }
    });

    const campaignSeeds = [
      { name: "Branded Search", type: "SPONSORED_PRODUCTS", budget: 300 },
      { name: "Category Defense", type: "SPONSORED_PRODUCTS", budget: 250 },
      { name: "Competitor Conquest", type: "SPONSORED_PRODUCTS", budget: 180 },
      { name: "DSP Retargeting", type: "DSP", budget: 400 }
    ];

    const campaigns = [];
    const createdKeywords = [];

    for (const campaignSeed of campaignSeeds) {
      const campaign = await prisma.campaign.create({
        data: {
          clientId: client.id,
          adAccountId: adAccount.id,
          externalCampaignId: `${campaignSeed.name}-${Math.floor(Math.random() * 100000)}`,
          name: campaignSeed.name,
          campaignType: campaignSeed.type,
          status: "ENABLED",
          dailyBudget: campaignSeed.budget
        }
      });
      campaigns.push(campaign);

      for (let adGroupIdx = 1; adGroupIdx <= 2; adGroupIdx += 1) {
        const adGroup = await prisma.adGroup.create({
          data: {
            clientId: client.id,
            campaignId: campaign.id,
            externalAdGroupId: `${campaign.id}-AG-${adGroupIdx}`,
            name: `${campaign.name} - Ad Group ${adGroupIdx}`,
            status: "ENABLED",
            defaultBid: randomBetween(0.7, 2.5)
          }
        });

        for (let keywordIdx = 1; keywordIdx <= 4; keywordIdx += 1) {
          const keyword = await prisma.keyword.create({
            data: {
              clientId: client.id,
              adGroupId: adGroup.id,
              externalKeywordId: `${adGroup.id}-KW-${keywordIdx}`,
              keywordText: `${client.brandName.toLowerCase()} keyword ${keywordIdx}`,
              matchType: keywordIdx % 2 === 0 ? "PHRASE" : "EXACT",
              bid: randomBetween(0.6, 2.6),
              status: "ENABLED"
            }
          });
          createdKeywords.push(keyword);
        }
      }
    }

    await prisma.product.createMany({
      data: [
        {
          clientId: client.id,
          asin: `${client.marketplace}A1SKU01`,
          sku: `${client.marketplace}-SKU-001`,
          title: `${client.brandName} Hero SKU`,
          category: "Core",
          price: 34.99
        },
        {
          clientId: client.id,
          asin: `${client.marketplace}A1SKU02`,
          sku: `${client.marketplace}-SKU-002`,
          title: `${client.brandName} Value Pack`,
          category: "Bundle",
          price: 49.99
        },
        {
          clientId: client.id,
          asin: `${client.marketplace}A1SKU03`,
          sku: `${client.marketplace}-SKU-003`,
          title: `${client.brandName} Travel Size`,
          category: "Entry",
          price: 19.99
        },
        {
          clientId: client.id,
          asin: `${client.marketplace}A1SKU04`,
          sku: `${client.marketplace}-SKU-004`,
          title: `${client.brandName} Pro Variant`,
          category: "Premium",
          price: 59.99
        },
        {
          clientId: client.id,
          asin: `${client.marketplace}A1SKU05`,
          sku: `${client.marketplace}-SKU-005`,
          title: `${client.brandName} Refill`,
          category: "Repeat",
          price: 24.99
        }
      ]
    });

    const products = await prisma.product.findMany({
      where: { clientId: client.id }
    });

    const sqpQueries = [
      "brand keyword",
      "best supplement",
      "immune support",
      "omega 3 capsules",
      "competitor alternative",
      "daily vitamins"
    ];

    for (let dayOffset = 0; dayOffset < 45; dayOffset += 1) {
      const date = subDays(new Date(), dayOffset);
      let dailySpend = 0;

      for (const campaign of campaigns) {
        const impressions = Math.floor(randomBetween(8000, 24000));
        const clicks = Math.floor(impressions * randomBetween(0.015, 0.045));
        const spend = Number((clicks * randomBetween(0.7, 2.0)).toFixed(2));
        const orders = Math.floor(clicks * randomBetween(0.04, 0.11));
        const sales = Number((orders * randomBetween(22, 95)).toFixed(2));
        const ctr = impressions ? clicks / impressions : 0;
        const cpc = clicks ? spend / clicks : 0;
        const cvr = clicks ? orders / clicks : 0;
        const acos = sales ? spend / sales : 0;
        const roas = spend ? sales / spend : 0;

        dailySpend += spend;
        await prisma.adMetric.create({
          data: {
            clientId: client.id,
            campaignId: campaign.id,
            date,
            impressions,
            clicks,
            spend,
            orders,
            sales,
            ctr,
            cpc,
            cvr,
            acos,
            roas
          }
        });
      }

      for (const product of products) {
        const sessions = Math.floor(randomBetween(150, 1100));
        const orders = Math.floor(sessions * randomBetween(0.07, 0.21));
        const unitsSold = Math.floor(orders * randomBetween(1.0, 1.3));
        const revenue = Number((unitsSold * randomBetween(18, 70)).toFixed(2));
        const conversionRate = sessions ? orders / sessions : 0;
        const tacos = revenue ? dailySpend / revenue : 0;

        await prisma.salesMetric.create({
          data: {
            clientId: client.id,
            productId: product.id,
            date,
            sessions,
            unitsSold,
            orders,
            revenue,
            conversionRate,
            tacos
          }
        });
      }

      for (const query of sqpQueries) {
        const ppcSpend = Number(randomBetween(10, 160).toFixed(2));
        const ppcClicks = Math.floor(randomBetween(20, 170));
        const ppcOrders = Math.floor(ppcClicks * randomBetween(0.03, 0.14));
        const ppcSales = Number((ppcOrders * randomBetween(18, 110)).toFixed(2));
        const impressionShare = randomBetween(0.04, 0.33);
        const clickShare = randomBetween(0.02, 0.22);
        const cartAddShare = randomBetween(0.01, 0.17);
        const purchaseShare = randomBetween(0.01, 0.16);
        const acos = ppcSales ? ppcSpend / ppcSales : 0;
        const roas = ppcSpend ? ppcSales / ppcSpend : 0;

        const recommendedAction =
          purchaseShare > 0.08 && ppcSpend < 45 && roas > 3
            ? "SCALE"
            : ppcSpend > 95 && purchaseShare < 0.04 && acos > 0.45
              ? "CUT"
              : impressionShare > 0.2 && clickShare < 0.05
                ? "TEST"
                : "DEFEND";

        const actionReason =
          recommendedAction === "SCALE"
            ? "Strong purchase share and conversion with low PPC investment."
            : recommendedAction === "CUT"
              ? "Spend is high while purchase share and efficiency are weak."
              : recommendedAction === "TEST"
                ? "Visibility is high but clicks are lagging. Improve creative and offer."
                : "Organic + share position is strong; protect with defensive bidding.";

        await prisma.sQPMetric.create({
          data: {
            clientId: client.id,
            query: `${client.brandName.toLowerCase()} ${query}`,
            date,
            impressionShare,
            clickShare,
            cartAddShare,
            purchaseShare,
            ppcSpend,
            ppcClicks,
            ppcOrders,
            ppcSales,
            acos,
            roas,
            recommendedAction,
            actionReason
          }
        });
      }

      for (let idx = 0; idx < 3; idx += 1) {
        const keyword = createdKeywords[(dayOffset + idx) % createdKeywords.length];
        const campaign = campaigns[(dayOffset + idx) % campaigns.length];
        const impressions = Math.floor(randomBetween(600, 4300));
        const clicks = Math.floor(impressions * randomBetween(0.015, 0.07));
        const spend = Number((clicks * randomBetween(0.7, 2.6)).toFixed(2));
        const orders = Math.floor(clicks * randomBetween(0.03, 0.18));
        const sales = Number((orders * randomBetween(20, 90)).toFixed(2));
        const acos = sales ? spend / sales : 0;
        const roas = spend ? sales / spend : 0;

        await prisma.searchTerm.create({
          data: {
            clientId: client.id,
            campaignId: campaign.id,
            keywordId: keyword.id,
            query: `${keyword.keywordText} query ${idx + 1}`,
            date,
            impressions,
            clicks,
            spend,
            orders,
            sales,
            acos,
            roas
          }
        });
      }
    }

    await prisma.auditReport.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        generatedById: user.id,
        title: `${client.brandName} Performance Audit`,
        summary:
          "ACOS creep identified in non-brand and competitor campaigns. SQP indicates multiple scale opportunities.",
        findings: {
          wastedSpend: [
            "Competitor Conquest consumed 23% of spend with 8% of attributed revenue.",
            "11 search terms exceeded 55% ACOS over the last 14 days."
          ],
          highAcosCampaigns: ["Competitor Conquest", "DSP Retargeting"],
          lowCtrKeywords: ["brand keyword 4", "brand keyword 8"],
          strongRoasCampaigns: ["Branded Search", "Category Defense"],
          sqpMissedOpportunities: [
            "omega 3 capsules has high purchase share with low PPC coverage."
          ],
          productConversionIssues: ["Travel Size has weak detail page conversion rate."]
        }
      }
    });

    await prisma.marketingPlan.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        generatedById: user.id,
        title: `${client.brandName} 30-Day Marketing Plan`,
        executiveSummary:
          "Reallocate spend from low-efficiency conquesting to branded/category winners and launch SQP opportunity campaigns.",
        actions: {
          immediateFixes: [
            "Pause 8 high-ACOS search terms above 60% ACOS.",
            "Lower bids by 20% on competitor campaign segments."
          ],
          campaignRestructuring: [
            "Split branded and high-intent category terms into dedicated campaigns."
          ],
          budgetReallocation: [
            "Move $120/day from Competitor Conquest to Branded Search and SQP scale queries."
          ],
          keywordActions: [
            "Promote exact-match winners into top-of-search placement modifiers."
          ],
          sqpStrategy: [
            "Create isolated campaigns for high purchase-share / low spend SQP queries."
          ]
        },
        roadmap: {
          week1: "Audit + negatives + bid controls",
          week2: "Restructure campaigns + new winners",
          week3: "SQP expansion and ad creative test",
          week4: "Budget optimization and executive reporting"
        }
      }
    });

    const chatSession = await prisma.chatSession.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        userId: user.id,
        title: `${client.brandName} Weekly Strategy`
      }
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          chatSessionId: chatSession.id,
          role: ChatRole.USER,
          content: "Why did ACOS increase last week?"
        },
        {
          chatSessionId: chatSession.id,
          role: ChatRole.ASSISTANT,
          content:
            "ACOS rose from 28% to 35% because spend grew 18% while sales grew only 2%, mostly from competitor campaigns."
        }
      ]
    });

    await prisma.dataSyncJob.createMany({
      data: [
        {
          workspaceId: workspace.id,
          clientId: client.id,
          jobType: DataSyncJobType.INITIAL_SYNC,
          status: DataSyncJobStatus.COMPLETED,
          retryCount: 0,
          queuedAt: subDays(new Date(), 20),
          startedAt: subDays(new Date(), 20),
          completedAt: subDays(new Date(), 20),
          logs: {
            steps: ["syncCampaigns", "syncAdGroups", "syncKeywords", "syncProducts", "normalizeMetrics"]
          }
        },
        {
          workspaceId: workspace.id,
          clientId: client.id,
          jobType: DataSyncJobType.SCHEDULED_DAILY,
          status: DataSyncJobStatus.COMPLETED,
          retryCount: 0,
          queuedAt: subDays(new Date(), 1),
          startedAt: subDays(new Date(), 1),
          completedAt: subDays(new Date(), 1),
          logs: {
            steps: ["syncSalesMetrics", "syncSearchTerms", "syncSQPData"],
            rows: 890
          }
        },
        {
          workspaceId: workspace.id,
          clientId: client.id,
          jobType: DataSyncJobType.MANUAL,
          status: DataSyncJobStatus.FAILED,
          retryCount: 1,
          queuedAt: subDays(new Date(), 2),
          startedAt: subDays(new Date(), 2),
          errorMessage: "SP-API throttling encountered; retry scheduled.",
          logs: {
            lastSuccessfulStep: "syncCampaigns"
          }
        }
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
