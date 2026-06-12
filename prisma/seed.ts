import {
  PrismaClient,
  WorkspaceRole,
  Marketplace,
  ConnectionType,
  ConnectionStatus,
  SyncStatus,
  SQPAction,
} from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateDailyMetrics(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const impressions = Math.floor(randomBetween(2000, 8000));
    const clicks = Math.floor(impressions * randomBetween(0.008, 0.025));
    const spend = clicks * randomBetween(0.8, 2.5);
    const orders = Math.floor(clicks * randomBetween(0.05, 0.15));
    const sales = orders * randomBetween(25, 65);
    const revenue = sales * randomBetween(1.1, 1.4);

    return {
      date,
      impressions,
      clicks,
      spend: Math.round(spend * 100) / 100,
      sales: Math.round(sales * 100) / 100,
      orders,
      revenue: Math.round(revenue * 100) / 100,
      acos: sales > 0 ? Math.round((spend / sales) * 10000) / 100 : 0,
      roas: spend > 0 ? Math.round((sales / spend) * 100) / 100 : 0,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
      cvr: clicks > 0 ? Math.round((orders / clicks) * 10000) / 100 : 0,
    };
  });
}

async function main() {
  console.log("Seeding database...");

  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.dataSyncJob.deleteMany();
  await prisma.marketingPlan.deleteMany();
  await prisma.auditReport.deleteMany();
  await prisma.sQPMetric.deleteMany();
  await prisma.searchTerm.deleteMany();
  await prisma.adMetric.deleteMany();
  await prisma.salesMetric.deleteMany();
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

  const passwordHash = await hashPassword("demo1234");

  const user = await prisma.user.create({
    data: {
      email: "demo@adsintel.com",
      name: "Demo User",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Agency",
      slug: "acme-agency",
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  const clientsData = [
    { brandName: "NatureGlow Skincare", marketplace: Marketplace.US },
    { brandName: "FitTrack Wellness", marketplace: Marketplace.US },
    { brandName: "HomeChef Pro", marketplace: Marketplace.UK },
  ];

  const campaignTemplates = [
    { name: "SP - Brand - Exact", type: "SP", budget: 150 },
    { name: "SP - Category - Broad", type: "SP", budget: 200 },
    { name: "SP - Competitor - Phrase", type: "SP", budget: 100 },
    { name: "SB - Brand Awareness", type: "SB", budget: 75 },
    { name: "SD - Retargeting", type: "SD", budget: 50 },
  ];

  const productTemplates = [
    { asin: "B08XYZ1234", title: "Vitamin C Serum 30ml", price: 29.99 },
    { asin: "B09ABC5678", title: "Retinol Night Cream 50ml", price: 39.99 },
    { asin: "B07DEF9012", title: "Hyaluronic Acid Moisturizer", price: 24.99 },
    { asin: "B06GHI3456", title: "SPF 50 Sunscreen 100ml", price: 19.99 },
  ];

  const sqpQueries = [
    { query: "vitamin c serum", impressionShare: 28.5, clickShare: 12.3, purchaseShare: 18.2 },
    { query: "anti aging cream", impressionShare: 22.1, clickShare: 8.5, purchaseShare: 14.7 },
    { query: "best retinol cream", impressionShare: 15.8, clickShare: 6.2, purchaseShare: 11.3 },
    { query: "moisturizer for dry skin", impressionShare: 19.4, clickShare: 4.1, purchaseShare: 8.9 },
    { query: "sunscreen spf 50", impressionShare: 12.6, clickShare: 9.8, purchaseShare: 16.5 },
    { query: "organic face serum", impressionShare: 8.3, clickShare: 3.2, purchaseShare: 5.1 },
    { query: "wrinkle cream for women", impressionShare: 25.2, clickShare: 2.8, purchaseShare: 4.3 },
    { query: "natural skincare set", impressionShare: 6.7, clickShare: 5.5, purchaseShare: 12.8 },
  ];

  const searchTermTemplates = [
    "vitamin c serum for face",
    "best anti aging cream 2024",
    "retinol cream sensitive skin",
    "organic moisturizer",
    "sunscreen face spf 50",
    "cheap vitamin c serum",
    "competitor brand serum",
    "hyaluronic acid serum",
  ];

  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        brandName: clientData.brandName,
        marketplace: clientData.marketplace,
        syncStatus: SyncStatus.SUCCESS,
        lastSyncAt: new Date(),
        connections: {
          create: [
            {
              type: ConnectionType.AMAZON_ADS,
              status: ConnectionStatus.CONNECTED,
              profileId: `ADS_PROFILE_${clientData.brandName.slice(0, 3).toUpperCase()}`,
              accessToken: "encrypted_demo_token",
              refreshToken: "encrypted_demo_refresh",
              tokenExpiresAt: new Date(Date.now() + 3600000),
            },
            {
              type: ConnectionType.SP_API,
              status: ConnectionStatus.CONNECTED,
              sellerId: `SELLER_${clientData.brandName.slice(0, 3).toUpperCase()}`,
              refreshToken: "encrypted_demo_refresh",
            },
          ],
        },
        adAccounts: {
          create: {
            accountId: `A${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            name: `${clientData.brandName} Ads Account`,
            marketplace: clientData.marketplace,
          },
        },
      },
      include: { adAccounts: true },
    });

    const adAccount = client.adAccounts[0];
    const dailyMetrics = generateDailyMetrics(60);

    for (const tmpl of campaignTemplates) {
      const campaign = await prisma.campaign.create({
        data: {
          clientId: client.id,
          adAccountId: adAccount.id,
          externalId: `CAMP_${Math.random().toString(36).slice(2, 8)}`,
          name: tmpl.name,
          status: Math.random() > 0.15 ? "ENABLED" : "PAUSED",
          campaignType: tmpl.type,
          budget: tmpl.budget,
          adGroups: {
            create: {
              externalId: `AG_${Math.random().toString(36).slice(2, 8)}`,
              name: `${tmpl.name} - Ad Group 1`,
              status: "ENABLED",
              defaultBid: randomBetween(0.5, 2.5),
              keywords: {
                create: Array.from({ length: 5 }, (_, ki) => ({
                  externalId: `KW_${Math.random().toString(36).slice(2, 8)}`,
                  keyword: searchTermTemplates[ki % searchTermTemplates.length],
                  matchType: ["EXACT", "PHRASE", "BROAD"][ki % 3],
                  bid: randomBetween(0.5, 3.0),
                  status: "ENABLED",
                })),
              },
            },
          },
        },
        include: { adGroups: { include: { keywords: true } } },
      });

      for (const day of dailyMetrics) {
        const factor = randomBetween(0.15, 0.35);
        await prisma.adMetric.create({
          data: {
            clientId: client.id,
            campaignId: campaign.id,
            date: day.date,
            impressions: Math.floor(day.impressions * factor),
            clicks: Math.floor(day.clicks * factor),
            spend: Math.round(day.spend * factor * 100) / 100,
            sales: Math.round(day.sales * factor * 100) / 100,
            orders: Math.floor(day.orders * factor),
            acos: day.acos,
            roas: day.roas,
            ctr: day.ctr,
            cpc: day.cpc,
            cvr: day.cvr,
          },
        });
      }
    }

    for (const prod of productTemplates) {
      const product = await prisma.product.create({
        data: {
          clientId: client.id,
          asin: prod.asin,
          sku: `SKU-${prod.asin.slice(-4)}`,
          title: prod.title,
          price: prod.price,
        },
      });

      for (const day of dailyMetrics) {
        const factor = randomBetween(0.2, 0.4);
        const sessions = Math.floor(day.clicks * factor * 3);
        const orders = Math.floor(day.orders * factor);
        await prisma.salesMetric.create({
          data: {
            clientId: client.id,
            productId: product.id,
            date: day.date,
            orders,
            units: Math.floor(orders * randomBetween(1, 1.5)),
            revenue: Math.round(day.revenue * factor * 100) / 100,
            sessions,
            pageViews: Math.floor(sessions * randomBetween(1.2, 2.0)),
            conversionRate: sessions > 0 ? Math.round((orders / sessions) * 10000) / 100 : 0,
          },
        });
      }
    }

    for (const term of searchTermTemplates) {
      for (const day of dailyMetrics.slice(-30)) {
        const factor = randomBetween(0.05, 0.15);
        const impressions = Math.floor(day.impressions * factor);
        const clicks = Math.floor(day.clicks * factor);
        const spend = Math.round(day.spend * factor * 100) / 100;
        const sales = Math.round(day.sales * factor * 100) / 100;
        const orders = Math.floor(day.orders * factor);

        await prisma.searchTerm.create({
          data: {
            clientId: client.id,
            query: term,
            matchType: "BROAD",
            impressions,
            clicks,
            spend,
            sales,
            orders,
            acos: sales > 0 ? Math.round((spend / sales) * 10000) / 100 : 0,
            roas: spend > 0 ? Math.round((sales / spend) * 100) / 100 : 0,
            date: day.date,
          },
        });
      }
    }

    for (const sqp of sqpQueries) {
      for (const day of dailyMetrics.slice(-30)) {
        const ppcSpend = randomBetween(5, 250);
        const ppcSales = ppcSpend * randomBetween(1.5, 8);
        const ppcOrders = Math.floor(ppcSales / randomBetween(25, 50));

        let action: SQPAction = SQPAction.MONITOR;
        let reason = "Performance within normal range";

        if (sqp.purchaseShare >= 15 && ppcSpend < 100) {
          action = SQPAction.SCALE;
          reason = `High purchase share (${sqp.purchaseShare}%) with low PPC spend`;
        } else if (ppcSpend >= 200 && sqp.purchaseShare < 5) {
          action = SQPAction.CUT;
          reason = "High spend with low purchase share";
        } else if (sqp.impressionShare >= 20 && sqp.clickShare < 5) {
          action = SQPAction.TEST;
          reason = "High impressions but low clicks — improve listing";
        } else if (sqp.purchaseShare >= 10 && ppcSpend < 50) {
          action = SQPAction.DEFEND;
          reason = "Strong organic position — protect with PPC";
        }

        await prisma.sQPMetric.create({
          data: {
            clientId: client.id,
            query: sqp.query,
            date: day.date,
            impressionShare: sqp.impressionShare + randomBetween(-2, 2),
            clickShare: sqp.clickShare + randomBetween(-1, 1),
            cartAddShare: sqp.clickShare * randomBetween(0.3, 0.6),
            purchaseShare: sqp.purchaseShare + randomBetween(-1, 1),
            ppcSpend: Math.round(ppcSpend * 100) / 100,
            ppcClicks: Math.floor(ppcSpend / randomBetween(0.8, 2.0)),
            ppcOrders,
            ppcSales: Math.round(ppcSales * 100) / 100,
            ppcAcos: ppcSales > 0 ? Math.round((ppcSpend / ppcSales) * 10000) / 100 : 0,
            ppcRoas: ppcSpend > 0 ? Math.round((ppcSales / ppcSpend) * 100) / 100 : 0,
            recommendedAction: action,
            actionReason: reason,
          },
        });
      }
    }

    await prisma.dataSyncJob.create({
      data: {
        clientId: client.id,
        type: "FULL",
        status: "COMPLETED",
        startedAt: subDays(new Date(), 1),
        completedAt: subDays(new Date(), 1),
        logs: ["Full sync completed successfully"],
      },
    });

    console.log(`  Created client: ${clientData.brandName}`);
  }

  console.log("Seed completed!");
  console.log("  Login: demo@adsintel.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
