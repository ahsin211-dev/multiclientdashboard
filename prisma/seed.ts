import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/amazon_intelligence");
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function metricForDay(base: number, day: number, variance = 0.18) {
  const wave = Math.sin(day / 2.7) * variance;
  const trend = day < 8 ? 1.12 : 0.95;
  return Math.round(base * trend * (1 + wave));
}

async function main() {
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
  await prisma.product.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.amazonConnection.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "owner@example.com",
      name: "Avery Morgan",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Northstar Growth Agency",
      slug: "northstar-growth",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        brandName: "PeakTrail Gear",
        marketplace: "US",
        workspaceId: workspace.id,
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    }),
    prisma.client.create({
      data: {
        brandName: "GlowNest Beauty",
        marketplace: "US",
        workspaceId: workspace.id,
        syncStatus: "SYNCED",
        lastSyncAt: daysAgo(1),
      },
    }),
  ]);

  for (const [index, client] of clients.entries()) {
    await prisma.amazonConnection.createMany({
      data: [
        {
          clientId: client.id,
          type: "ADS",
          status: "CONNECTED",
          marketplace: "US",
          encryptedAccessToken: "encrypted:mock-access-token",
          encryptedRefreshToken: "encrypted:mock-refresh-token",
          tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          externalAccountId: `amzn-ads-${index + 100}`,
          scopes: ["advertising::campaign_management", "advertising::reporting"],
        },
        {
          clientId: client.id,
          type: "SP_API",
          status: "CONNECTED",
          marketplace: "US",
          encryptedAccessToken: "encrypted:mock-sp-access-token",
          encryptedRefreshToken: "encrypted:mock-sp-refresh-token",
          tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          externalAccountId: `seller-${index + 200}`,
          scopes: ["sellingpartnerapi::reports", "sellingpartnerapi::notifications"],
        },
      ],
    });

    const adAccount = await prisma.adAccount.create({
      data: {
        clientId: client.id,
        profileId: `profile-${index + 1}`,
        name: `${client.brandName} Sponsored Ads`,
      },
    });

    const campaignNames =
      index === 0
        ? ["Trail Shoes | Exact", "Backpacks | Auto", "Hydration Packs | Broad"]
        : ["Vitamin C Serum | Exact", "Retinol Cream | Auto", "Sunscreen | Broad"];

    const products = await Promise.all(
      (index === 0
        ? [
            ["B0TRAIL01", "PeakTrail Waterproof Hiking Shoe", "Footwear"],
            ["B0PACK02", "PeakTrail 40L Technical Backpack", "Backpacks"],
            ["B0HYDRO3", "PeakTrail Hydration Pack", "Accessories"],
          ]
        : [
            ["B0GLOW01", "GlowNest Vitamin C Serum", "Skincare"],
            ["B0RETIN2", "GlowNest Retinol Night Cream", "Skincare"],
            ["B0SUN003", "GlowNest Mineral Sunscreen", "Skincare"],
          ]
      ).map(([asin, title, category]) =>
        prisma.product.create({
          data: {
            clientId: client.id,
            asin,
            title,
            category,
            sku: `${asin}-SKU`,
          },
        }),
      ),
    );

    const campaigns = [];
    for (const [campaignIndex, name] of campaignNames.entries()) {
      const campaign = await prisma.campaign.create({
        data: {
          clientId: client.id,
          adAccountId: adAccount.id,
          amazonCampaignId: `campaign-${index}-${campaignIndex}`,
          name,
          campaignType: "Sponsored Products",
          state: "enabled",
          budget: campaignIndex === 1 ? 180 : 120,
          targetingType: name.includes("Auto") ? "auto" : "manual",
        },
      });
      campaigns.push(campaign);

      const adGroup = await prisma.adGroup.create({
        data: {
          campaignId: campaign.id,
          amazonAdGroupId: `adgroup-${index}-${campaignIndex}`,
          name: `${name} Core`,
          state: "enabled",
          defaultBid: 1.35 + campaignIndex * 0.2,
        },
      });

      await prisma.keyword.createMany({
        data: [
          {
            adGroupId: adGroup.id,
            amazonKeywordId: `keyword-${index}-${campaignIndex}-1`,
            keywordText: name.split("|")[0].trim().toLowerCase(),
            matchType: "exact",
            bid: 1.55,
            state: "enabled",
          },
          {
            adGroupId: adGroup.id,
            amazonKeywordId: `keyword-${index}-${campaignIndex}-2`,
            keywordText: `${name.split("|")[0].trim().toLowerCase()} best`,
            matchType: "phrase",
            bid: 1.2,
            state: "enabled",
          },
        ],
      });
    }

    for (let day = 0; day < 35; day += 1) {
      const date = daysAgo(day);
      const spendBase = index === 0 ? 1450 : 980;
      const salesBase = index === 0 ? 7200 : 5200;
      const spend = metricForDay(spendBase, day);
      const adSales = metricForDay(salesBase, day);
      const clicks = metricForDay(index === 0 ? 3100 : 2200, day);
      const impressions = clicks * (index === 0 ? 45 : 52);
      const orders = Math.max(1, Math.round(clicks * (index === 0 ? 0.092 : 0.083)));
      const totalRevenue = Math.round(adSales * (index === 0 ? 1.74 : 1.62));

      for (const [campaignIndex, campaign] of campaigns.entries()) {
        const share = campaignIndex === 0 ? 0.46 : campaignIndex === 1 ? 0.33 : 0.21;
        const campaignSpend = Math.round(spend * share);
        const campaignSales = Math.round(adSales * (campaignIndex === 1 ? share * 0.72 : share * 1.1));
        const campaignClicks = Math.round(clicks * share);
        const campaignOrders = Math.round(orders * share);
        await prisma.adMetric.create({
          data: {
            clientId: client.id,
            campaignId: campaign.id,
            productId: products[campaignIndex]?.id,
            date,
            impressions: Math.round(impressions * share),
            clicks: campaignClicks,
            spend: campaignSpend,
            orders: campaignOrders,
            sales: campaignSales,
            ctr: campaignClicks / Math.max(1, impressions * share),
            cpc: campaignSpend / Math.max(1, campaignClicks),
            cvr: campaignOrders / Math.max(1, campaignClicks),
            acos: campaignSpend / Math.max(1, campaignSales),
            roas: campaignSales / Math.max(1, campaignSpend),
          },
        });
      }

      for (const [productIndex, product] of products.entries()) {
        const share = productIndex === 0 ? 0.5 : productIndex === 1 ? 0.32 : 0.18;
        const productRevenue = Math.round(totalRevenue * share);
        await prisma.salesMetric.create({
          data: {
            clientId: client.id,
            productId: product.id,
            date,
            orderedUnits: Math.round(orders * share * 1.18),
            orders: Math.round(orders * share),
            revenue: productRevenue,
            sessions: Math.round(clicks * share * 2.8),
            conversionRate: Math.round((orders * share) / Math.max(1, clicks * share * 2.8) * 10000) / 10000,
          },
        });
      }
    }

    const sqpQueries =
      index === 0
        ? [
            ["waterproof hiking shoes", 0.21, 0.16, 0.14, 0.12, 420, 2100],
            ["lightweight backpack 40l", 0.18, 0.09, 0.08, 0.07, 95, 860],
            ["hydration pack running", 0.14, 0.04, 0.03, 0.02, 610, 310],
            ["trail shoes men", 0.27, 0.2, 0.17, 0.15, 180, 1500],
          ]
        : [
            ["vitamin c serum", 0.24, 0.19, 0.16, 0.13, 530, 2480],
            ["retinol night cream", 0.16, 0.07, 0.06, 0.05, 120, 990],
            ["mineral sunscreen face", 0.22, 0.05, 0.04, 0.02, 475, 420],
            ["brightening serum", 0.19, 0.14, 0.12, 0.1, 160, 1360],
          ];

    await prisma.sQPMetric.createMany({
      data: sqpQueries.map(([query, impressionShare, clickShare, cartAddShare, purchaseShare, ppcSpend, ppcSales]) => ({
        clientId: client.id,
        query: String(query),
        date: daysAgo(1),
        impressionShare: Number(impressionShare),
        clickShare: Number(clickShare),
        cartAddShare: Number(cartAddShare),
        purchaseShare: Number(purchaseShare),
        ppcSpend: Number(ppcSpend),
        ppcClicks: Math.round(Number(ppcSpend) * 2.8),
        ppcOrders: Math.round(Number(ppcSales) / 42),
        ppcSales: Number(ppcSales),
        acos: Number(ppcSpend) / Math.max(1, Number(ppcSales)),
        roas: Number(ppcSales) / Math.max(1, Number(ppcSpend)),
      })),
    });

    await prisma.auditReport.create({
      data: {
        clientId: client.id,
        status: "COMPLETED",
        title: `${client.brandName} performance audit`,
        summary: "Mock audit found budget concentration, wasted spend, and SQP opportunities ready for action.",
        findings: {
          wastedSpend: ["Auto campaigns spend above target ACOS on low purchase-share queries."],
          highAcosCampaigns: [campaignNames[1]],
          lowCtrKeywords: ["hydration pack running", "mineral sunscreen face"],
          strongRoasCampaigns: [campaignNames[0]],
          sqpMissedOpportunities: ["lightweight backpack 40l", "retinol night cream"],
          productConversionIssues: [products[2]?.title],
        },
      },
    });

    await prisma.marketingPlan.create({
      data: {
        clientId: client.id,
        title: `${client.brandName} 30-day growth plan`,
        plan: {
          immediateFixes: ["Reduce bids on high-spend / low-purchase-share terms", "Add negatives for inefficient queries"],
          campaignRestructuring: ["Separate exact winners from broad discovery", "Create SQP opportunity campaigns"],
          budgetReallocation: ["Move 18% of auto budget into exact campaigns with ROAS above 4.0"],
          keywordActions: ["Scale exact terms with purchase share above 10%", "Test phrase variants for category modifiers"],
          sqpStrategy: ["Defend owned SQP share and test underfunded high-conversion queries"],
          roadmap30Days: ["Week 1 cleanup", "Week 2 restructure", "Week 3 SQP expansion", "Week 4 report and iterate"],
        },
        report: {
          executiveSummary: "The account has profitable winners but wasted spend in broad and auto harvesting.",
          nextSteps: ["Approve bid reductions", "Launch SQP test campaigns", "Review product page conversion gaps"],
        },
      },
    });

    const chatSession = await prisma.chatSession.create({
      data: {
        clientId: client.id,
        title: "Weekly optimization questions",
      },
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: chatSession.id,
          userId: user.id,
          role: "USER",
          content: "Why did ACOS increase last week?",
        },
        {
          sessionId: chatSession.id,
          role: "ASSISTANT",
          content: "ACOS increased because spend grew faster than attributed sales in the auto campaign segment.",
        },
      ],
    });

    await prisma.dataSyncJob.createMany({
      data: [
        {
          clientId: client.id,
          jobType: "daily-metrics-sync",
          status: "COMPLETED",
          startedAt: daysAgo(1),
          completedAt: daysAgo(1),
          logs: ["Fetched campaign metrics", "Fetched SP-API sales", "Normalized daily rollups"],
          attempts: 1,
        },
        {
          clientId: client.id,
          jobType: "sqp-sync",
          status: "PENDING",
          logs: ["Queued by daily scheduler"],
        },
      ],
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
