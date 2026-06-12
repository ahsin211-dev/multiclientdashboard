import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
  connectionTimeoutMillis: 5000,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@amazonads.pro" },
    update: {},
    create: {
      email: "demo@amazonads.pro",
      name: "Alex Johnson",
      passwordHash,
    },
  });
  console.log("✅ Demo user created:", user.email);

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "apex-media-agency" },
    update: {},
    create: {
      name: "Apex Media Agency",
      slug: "apex-media-agency",
      plan: "pro",
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });
  console.log("✅ Workspace created:", workspace.name);

  // Create clients
  const clientData = [
    {
      id: "client-techgadgets",
      name: "TechGadgets Pro",
      brandName: "TechGadgets",
      marketplace: "US" as const,
      notes: "Consumer electronics — heavy Q4 spender. Focus on SP campaigns.",
    },
    {
      id: "client-homelife",
      name: "HomeLife Essentials",
      brandName: "HomeLife",
      marketplace: "US" as const,
      notes: "Home goods and kitchen products. Strong ASIN portfolio.",
    },
    {
      id: "client-fitactive",
      name: "FitActive Sports",
      brandName: "FitActive",
      marketplace: "US" as const,
      notes: "Sports nutrition and fitness equipment. Growing brand.",
    },
    {
      id: "client-beautyglow",
      name: "BeautyGlow Cosmetics",
      brandName: "BeautyGlow",
      marketplace: "US" as const,
      notes: "Beauty and skincare. High competition category.",
      isActive: false,
    },
  ];

  for (const data of clientData) {
    const client = await prisma.client.upsert({
      where: { id: data.id },
      update: {},
      create: {
        ...data,
        workspaceId: workspace.id,
        isActive: "isActive" in data ? Boolean((data as { isActive?: boolean }).isActive) : true,
      },
    });
    console.log(`✅ Client created: ${client.name}`);

    // Create Amazon connection (placeholder tokens)
    await prisma.amazonConnection.upsert({
      where: { clientId: client.id },
      update: {},
      create: {
        clientId: client.id,
        syncStatus: "never",
      },
    });

    // Seed campaigns
    const campaignNames = [
      { name: "SP - Auto - All Products", type: "SPONSORED_PRODUCTS" as const, budget: 150 },
      { name: "SP - Manual - Branded", type: "SPONSORED_PRODUCTS" as const, budget: 80 },
      { name: "SP - Manual - Competitor", type: "SPONSORED_PRODUCTS" as const, budget: 100 },
      { name: "SP - Manual - Category", type: "SPONSORED_PRODUCTS" as const, budget: 120 },
      { name: "SB - Brand Defense", type: "SPONSORED_BRANDS" as const, budget: 50 },
      { name: "SD - Remarketing", type: "SPONSORED_DISPLAY" as const, budget: 40 },
    ];

    for (const c of campaignNames) {
      await prisma.campaign.create({
        data: {
          name: c.name,
          campaignType: c.type,
          dailyBudget: c.budget,
          state: "ENABLED",
          clientId: client.id,
        },
      });
    }

    // Seed products
    const productData = [
      { asin: "B08N5WRWNW", sku: "TG-HP-001", title: "Premium Wireless Headphones Active Noise Canceling", price: 89.99 },
      { asin: "B07XJ8C8F5", sku: "TG-CB-002", title: "USB-C Fast Charging Cable 6ft 3-Pack", price: 18.99 },
      { asin: "B09B8VGCR3", sku: "TG-LS-003", title: "Adjustable Aluminum Laptop Stand Portable", price: 39.99 },
    ];

    for (const p of productData) {
      await prisma.product.upsert({
        where: { clientId_asin: { clientId: client.id, asin: p.asin } },
        update: {},
        create: { ...p, clientId: client.id, brand: data.brandName },
      });
    }

    // Seed 30 days of ad metrics
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const spend = Math.random() * 1500 + 500;
      const sales = spend * (Math.random() * 3 + 2);
      const clicks = Math.floor(Math.random() * 800 + 200);
      const impressions = clicks * Math.floor(Math.random() * 40 + 20);
      const orders = Math.floor(Math.random() * 80 + 15);

      await prisma.adMetric.create({
        data: {
          clientId: client.id,
          date,
          impressions,
          clicks,
          spend: Math.round(spend * 100) / 100,
          sales: Math.round(sales * 100) / 100,
          orders,
          acos: Math.round((spend / sales) * 1000) / 10,
          roas: Math.round((sales / spend) * 100) / 100,
          cpc: Math.round((spend / clicks) * 100) / 100,
          ctr: Math.round((clicks / impressions) * 10000) / 100,
          cvr: Math.round((orders / clicks) * 10000) / 100,
        },
      });
    }

    // Seed SQP data
    const queries = [
      "wireless headphones noise canceling",
      "bluetooth headphones over ear",
      "noise canceling headphones office",
      "premium wireless headphones",
      "headphones microphone zoom",
      "usb c charging cable fast",
      "laptop stand adjustable",
      "ergonomic desk accessories",
    ];

    for (const query of queries) {
      const impressionShare = Math.random() * 40 + 5;
      const clickShare = impressionShare * (Math.random() * 0.7 + 0.1);
      const purchaseShare = clickShare * (Math.random() * 0.5 + 0.1);
      const ppcSpend = Math.random() * 2000 + 100;
      const ppcSales = ppcSpend * (Math.random() * 5 + 1.5);

      await prisma.sQPMetric.create({
        data: {
          clientId: client.id,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          query,
          impressionShare: Math.round(impressionShare * 10) / 10,
          clickShare: Math.round(clickShare * 10) / 10,
          purchaseShare: Math.round(purchaseShare * 10) / 10,
          ppcSpend: Math.round(ppcSpend * 100) / 100,
          ppcSales: Math.round(ppcSales * 100) / 100,
          acos: Math.round((ppcSpend / ppcSales) * 1000) / 10,
          roas: Math.round((ppcSales / ppcSpend) * 100) / 100,
        },
      });
    }

    // Create a sample chat session
    await prisma.chatSession.create({
      data: {
        title: "Q4 Strategy Review",
        clientId: client.id,
        userId: user.id,
        messages: {
          create: [
            {
              role: "USER",
              content: "Why did our ACOS increase last week?",
            },
            {
              role: "ASSISTANT",
              content:
                "Based on your campaign data, ACOS increased by approximately 4.2pp last week. The primary drivers are:\n\n1. **SP - Manual - Competitor** campaign: ACOS jumped from 28% to 41% after a competitor entered the category and drove up CPCs by 23%.\n2. **SP - Auto - All Products**: Click volume increased but CVR dropped — this may indicate traffic quality degradation or a product listing issue.\n\nRecommend reviewing bids on competitor targeting and checking your main image and price competitiveness.",
            },
          ],
        },
      },
    });
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
