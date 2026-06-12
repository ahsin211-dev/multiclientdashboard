import {
  PrismaClient,
  Role,
  Marketplace,
  ConnectionType,
  ConnectionStatus,
  SyncStatus,
  SQPAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log("Seeding database...");

  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.dataSyncJob.deleteMany();
  await prisma.auditReport.deleteMany();
  await prisma.marketingPlan.deleteMany();
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

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@adsintel.com",
      name: "Demo User",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Peak Performance Agency",
      slug: "peak-performance",
      members: {
        create: { userId: user.id, role: Role.OWNER },
      },
    },
  });

  const clientsData = [
    { brandName: "NatureGlow Skincare", marketplace: Marketplace.US },
    { brandName: "FitTrack Athletics", marketplace: Marketplace.US },
    { brandName: "HomeChef Essentials", marketplace: Marketplace.UK },
  ];

  const campaignTemplates = [
    { name: "SP - Brand Defense", type: "SPONSORED_PRODUCTS", budget: 150 },
    { name: "SP - Category Conquest", type: "SPONSORED_PRODUCTS", budget: 200 },
    { name: "SB - Brand Awareness", type: "SPONSORED_BRANDS", budget: 100 },
    { name: "SD - Retargeting", type: "SPONSORED_DISPLAY", budget: 75 },
    { name: "SP - Auto Discovery", type: "SPONSORED_PRODUCTS", budget: 120 },
  ];

  const productTemplates = [
    { asin: "B08XYZ1234", title: "Vitamin C Serum 30ml - Anti Aging", price: 24.99 },
    { asin: "B09ABC5678", title: "Hyaluronic Acid Moisturizer", price: 19.99 },
    { asin: "B07DEF9012", title: "Retinol Night Cream 50ml", price: 29.99 },
    { asin: "B06GHI3456", title: "SPF 50 Sunscreen Lotion", price: 14.99 },
  ];

  const sqpQueries = [
    "vitamin c serum",
    "anti aging serum",
    "hyaluronic acid moisturizer",
    "retinol cream",
    "sunscreen spf 50",
    "face moisturizer",
    "skincare routine",
    "best vitamin c serum",
    "organic face cream",
    "wrinkle cream",
    "dark spot corrector",
    "niacinamide serum",
  ];

  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        brandName: clientData.brandName,
        marketplace: clientData.marketplace,
        syncStatus: SyncStatus.COMPLETED,
        lastSyncAt: subDays(new Date(), 1),
        connections: {
          create: [
            {
              type: ConnectionType.AMAZON_ADS,
              status: ConnectionStatus.CONNECTED,
              profileId: `ads-${clientData.brandName.slice(0, 3).toLowerCase()}`,
            },
            {
              type: ConnectionType.SP_API,
              status: ConnectionStatus.CONNECTED,
              sellerId: `seller-${clientData.brandName.slice(0, 3).toLowerCase()}`,
            },
          ],
        },
        adAccounts: {
          create: {
            accountId: `ACC-${clientData.brandName.slice(0, 3).toUpperCase()}`,
            name: `${clientData.brandName} Ads`,
            currency: clientData.marketplace === Marketplace.UK ? "GBP" : "USD",
          },
        },
      },
      include: { adAccounts: true },
    });

    const adAccount = client.adAccounts[0];

    for (const p of productTemplates) {
      await prisma.product.create({
        data: {
          clientId: client.id,
          asin: p.asin,
          sku: `SKU-${p.asin.slice(-4)}`,
          title: p.title,
          price: p.price,
        },
      });
    }

    for (let i = 0; i < campaignTemplates.length; i++) {
      const tmpl = campaignTemplates[i];
      const campaign = await prisma.campaign.create({
        data: {
          clientId: client.id,
          adAccountId: adAccount.id,
          externalId: `camp-${client.id.slice(-4)}-${i}`,
          name: tmpl.name,
          campaignType: tmpl.type,
          budget: tmpl.budget,
        },
      });

      const adGroup = await prisma.adGroup.create({
        data: {
          campaignId: campaign.id,
          externalId: `ag-${campaign.id.slice(-4)}`,
          name: `${tmpl.name} - Ad Group 1`,
          defaultBid: randomBetween(0.5, 2.5),
        },
      });

      const keywords = ["brand keyword", "category keyword", "competitor keyword", "long tail keyword"];
      for (let k = 0; k < keywords.length; k++) {
        await prisma.keyword.create({
          data: {
            adGroupId: adGroup.id,
            externalId: `kw-${adGroup.id.slice(-4)}-${k}`,
            keywordText: `${keywords[k]} ${clientData.brandName.split(" ")[0].toLowerCase()}`,
            matchType: k === 0 ? "EXACT" : k === 1 ? "PHRASE" : "BROAD",
            bid: randomBetween(0.75, 3.0),
          },
        });
      }
    }

    for (let day = 0; day < 60; day++) {
      const date = subDays(new Date(), day);
      const dayFactor = 1 + Math.sin(day / 7) * 0.2;

      const spend = randomBetween(800, 1500) * dayFactor;
      const sales = spend * randomBetween(2.5, 5.5);
      const impressions = Math.floor(randomBetween(40000, 80000) * dayFactor);
      const clicks = Math.floor(impressions * randomBetween(0.008, 0.015));
      const orders = Math.floor(clicks * randomBetween(0.08, 0.15));

      await prisma.adMetric.create({
        data: {
          clientId: client.id,
          date,
          impressions,
          clicks,
          spend,
          orders,
          sales,
          acos: sales > 0 ? (spend / sales) * 100 : 0,
          roas: spend > 0 ? sales / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
        },
      });

      await prisma.salesMetric.create({
        data: {
          clientId: client.id,
          date,
          revenue: sales * randomBetween(1.2, 1.8),
          orders: Math.floor(orders * randomBetween(1.1, 1.5)),
          units: Math.floor(orders * randomBetween(1.0, 1.3)),
          sessions: Math.floor(randomBetween(2000, 5000) * dayFactor),
          conversion: randomBetween(8, 14),
        },
      });
    }

    const campaigns = await prisma.campaign.findMany({ where: { clientId: client.id } });
    for (const campaign of campaigns) {
      for (let day = 0; day < 30; day++) {
        const date = subDays(new Date(), day);
        const spend = randomBetween(50, 300);
        const sales = spend * randomBetween(1.5, 6);
        const impressions = Math.floor(randomBetween(5000, 20000));
        const clicks = Math.floor(impressions * randomBetween(0.005, 0.02));
        const orders = Math.floor(clicks * randomBetween(0.05, 0.18));

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
            acos: sales > 0 ? (spend / sales) * 100 : 0,
            roas: spend > 0 ? sales / spend : 0,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
          },
        });
      }
    }

    const searchTermData = [
      { query: "vitamin c serum", spend: 450, sales: 2200, impressions: 12000, clicks: 180 },
      { query: "anti aging cream", spend: 380, sales: 1500, impressions: 9500, clicks: 120 },
      { query: "moisturizer for dry skin", spend: 290, sales: 1800, impressions: 8000, clicks: 95 },
      { query: "random broad match", spend: 520, sales: 80, impressions: 15000, clicks: 45 },
      { query: "competitor brand serum", spend: 310, sales: 120, impressions: 6000, clicks: 60 },
      { query: "best face serum 2024", spend: 180, sales: 950, impressions: 5000, clicks: 75 },
      { query: "organic skincare", spend: 95, sales: 680, impressions: 3500, clicks: 50 },
      { query: "wrinkle cream men", spend: 410, sales: 90, impressions: 11000, clicks: 35 },
    ];

    for (const st of searchTermData) {
      for (let day = 0; day < 30; day++) {
        const date = subDays(new Date(), day);
        const factor = randomBetween(0.7, 1.3);
        await prisma.searchTerm.create({
          data: {
            clientId: client.id,
            query: st.query,
            date,
            impressions: Math.floor(st.impressions * factor / 30),
            clicks: Math.floor(st.clicks * factor / 30),
            spend: (st.spend * factor) / 30,
            sales: (st.sales * factor) / 30,
            orders: Math.floor(st.clicks * 0.1 * factor / 30),
            acos: st.sales > 0 ? (st.spend / st.sales) * 100 : 0,
            roas: st.spend > 0 ? st.sales / st.spend : 0,
          },
        });
      }
    }

    for (const query of sqpQueries) {
      for (let day = 0; day < 30; day++) {
        const date = subDays(new Date(), day);
        const impressionShare = randomBetween(2, 35);
        const clickShare = randomBetween(1, impressionShare * 0.8);
        const purchaseShare = randomBetween(0.5, clickShare * 0.9);
        const ppcSpend = randomBetween(0, 250);
        const ppcSales = ppcSpend * randomBetween(0, 5);

        let action: SQPAction = SQPAction.MONITOR;
        let reason = "Performance within normal range";

        if (purchaseShare > 15 && ppcSpend < 50) {
          action = SQPAction.SCALE;
          reason = "High purchase share with low PPC investment";
        } else if (ppcSpend > 200 && purchaseShare < 5) {
          action = SQPAction.CUT;
          reason = "High spend with low purchase share";
        } else if (impressionShare > 20 && clickShare < 5) {
          action = SQPAction.TEST;
          reason = "High impression share but low click share";
        } else if (purchaseShare > 10 && impressionShare > 15) {
          action = SQPAction.DEFEND;
          reason = "Strong organic share — protect position";
        }

        await prisma.sQPMetric.create({
          data: {
            clientId: client.id,
            query,
            date,
            impressionShare,
            clickShare,
            cartAddShare: randomBetween(0.5, clickShare),
            purchaseShare,
            ppcSpend: ppcSpend / 30,
            ppcClicks: Math.floor(randomBetween(0, 30) / 30),
            ppcOrders: Math.floor(randomBetween(0, 10) / 30),
            ppcSales: ppcSales / 30,
            acos: ppcSales > 0 ? (ppcSpend / ppcSales) * 100 : 0,
            roas: ppcSpend > 0 ? ppcSales / ppcSpend : 0,
            recommendedAction: action,
            reason,
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
        logs: [
          { timestamp: subDays(new Date(), 1).toISOString(), message: "Sync completed successfully", level: "info" },
        ],
      },
    });
  }

  console.log("Seed completed!");
  console.log("Login: demo@adsintel.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
