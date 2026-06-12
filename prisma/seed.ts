import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { CampaignStatus, ChatRole, ConnectionStatus, ConnectionType, JobStatus, Marketplace, MatchType, PrismaClient, RecordStatus, Role, SyncStatus } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://user:password@localhost:5432/amazon_intel?schema=public",
  }),
});

type ClientBlueprint = {
  brandName: string;
  marketplace: Marketplace;
  accountName: string;
  profileId: string;
  currency: string;
  campaigns: Array<{
    name: string;
    budget: number;
    channel: string;
    biddingStrategy: string;
    keywords: string[];
  }>;
  products: Array<{
    asin: string;
    sku: string;
    title: string;
    price: number;
    category: string;
  }>;
  sqpQueries: string[];
};

const clientBlueprints: ClientBlueprint[] = [
  {
    brandName: "Northwind Nutrition",
    marketplace: Marketplace.US,
    accountName: "Northwind Nutrition Ads",
    profileId: "NW-US-001",
    currency: "USD",
    campaigns: [
      {
        name: "Protein - Hero ASIN",
        budget: 280,
        channel: "sponsoredProducts",
        biddingStrategy: "dynamicDownOnly",
        keywords: ["whey isolate", "grass fed protein", "high protein powder"],
      },
      {
        name: "Creatine - Scale",
        budget: 190,
        channel: "sponsoredProducts",
        biddingStrategy: "dynamicUpAndDown",
        keywords: ["creatine monohydrate", "micronized creatine", "gym creatine"],
      },
      {
        name: "Brand Defense",
        budget: 120,
        channel: "sponsoredBrands",
        biddingStrategy: "fixedBids",
        keywords: ["northwind nutrition", "northwind whey", "northwind creatine"],
      },
    ],
    products: [
      {
        asin: "B0NW1001",
        sku: "NW-WHEY-01",
        title: "Northwind Grass-Fed Whey Isolate",
        price: 49.99,
        category: "Protein",
      },
      {
        asin: "B0NW1002",
        sku: "NW-CREA-01",
        title: "Northwind Micronized Creatine",
        price: 24.99,
        category: "Performance",
      },
      {
        asin: "B0NW1003",
        sku: "NW-COLL-01",
        title: "Northwind Marine Collagen Peptides",
        price: 34.99,
        category: "Recovery",
      },
    ],
    sqpQueries: [
      "grass fed whey isolate",
      "best creatine monohydrate",
      "protein powder low sugar",
      "northwind nutrition creatine",
      "marine collagen peptides",
    ],
  },
  {
    brandName: "Alpine Glow Beauty",
    marketplace: Marketplace.UK,
    accountName: "Alpine Glow Beauty Ads",
    profileId: "AG-UK-001",
    currency: "GBP",
    campaigns: [
      {
        name: "Vitamin C Serum - Prospecting",
        budget: 210,
        channel: "sponsoredProducts",
        biddingStrategy: "dynamicUpAndDown",
        keywords: ["vitamin c serum", "brightening serum", "glow serum"],
      },
      {
        name: "Moisturizer - Retargeting",
        budget: 145,
        channel: "sponsoredDisplay",
        biddingStrategy: "fixedBids",
        keywords: ["hydrating moisturizer", "ceramide cream", "face moisturizer"],
      },
      {
        name: "Brand Search",
        budget: 95,
        channel: "sponsoredBrands",
        biddingStrategy: "dynamicDownOnly",
        keywords: ["alpine glow", "alpine glow serum", "alpine glow skincare"],
      },
    ],
    products: [
      {
        asin: "B0AG1001",
        sku: "AG-SERUM-01",
        title: "Alpine Glow Vitamin C Serum",
        price: 27.99,
        category: "Serums",
      },
      {
        asin: "B0AG1002",
        sku: "AG-CREAM-01",
        title: "Alpine Glow Ceramide Moisturizer",
        price: 22.49,
        category: "Moisturizers",
      },
      {
        asin: "B0AG1003",
        sku: "AG-EYE-01",
        title: "Alpine Glow Caffeine Eye Cream",
        price: 18.99,
        category: "Eye Care",
      },
    ],
    sqpQueries: [
      "vitamin c serum sensitive skin",
      "ceramide moisturizer face",
      "caffeine eye cream depuff",
      "alpine glow serum",
      "brightening serum for dark spots",
    ],
  },
];

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
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
  await prisma.product.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.amazonConnection.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();
}

async function seedClient(workspaceId: string, blueprint: ClientBlueprint, seedIndex: number) {
  const client = await prisma.client.create({
    data: {
      workspaceId,
      brandName: blueprint.brandName,
      marketplace: blueprint.marketplace,
      syncStatus: SyncStatus.COMPLETED,
      lastSyncAt: daysAgo(1),
    },
  });

  const adsConnection = await prisma.amazonConnection.create({
    data: {
      clientId: client.id,
      type: ConnectionType.AMAZON_ADS,
      status: ConnectionStatus.CONNECTED,
      accountName: blueprint.accountName,
      marketplace: blueprint.marketplace,
      accessTokenEncrypted: `enc-access-${seedIndex}`,
      refreshTokenEncrypted: `enc-refresh-${seedIndex}`,
      tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
      metadata: {
        note: "Seeded placeholder connection",
        oauthReady: true,
      },
    },
  });

  await prisma.amazonConnection.create({
    data: {
      clientId: client.id,
      type: ConnectionType.SP_API,
      status: ConnectionStatus.CONNECTED,
      accountName: `${blueprint.brandName} Seller Central`,
      marketplace: blueprint.marketplace,
      accessTokenEncrypted: `enc-sp-access-${seedIndex}`,
      refreshTokenEncrypted: `enc-sp-refresh-${seedIndex}`,
      tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
      metadata: {
        sellerId: `seller-${seedIndex}`,
      },
    },
  });

  const adAccount = await prisma.adAccount.create({
    data: {
      clientId: client.id,
      amazonConnectionId: adsConnection.id,
      accountId: `acct-${seedIndex}`,
      profileId: blueprint.profileId,
      accountName: blueprint.accountName,
      currency: blueprint.currency,
      timezone: seedIndex === 0 ? "America/Los_Angeles" : "Europe/London",
    },
  });

  const products = [];
  for (const productDef of blueprint.products) {
    const product = await prisma.product.create({
      data: {
        clientId: client.id,
        asin: productDef.asin,
        sku: productDef.sku,
        title: productDef.title,
        price: productDef.price,
        category: productDef.category,
      },
    });

    products.push(product);
  }

  const campaigns = [];
  const keywords = [];
  for (const [campaignIndex, campaignDef] of blueprint.campaigns.entries()) {
    const campaign = await prisma.campaign.create({
      data: {
        clientId: client.id,
        adAccountId: adAccount.id,
        externalId: `${seedIndex}-${campaignIndex}-campaign`,
        name: campaignDef.name,
        status: campaignIndex === 2 ? CampaignStatus.ACTIVE : CampaignStatus.ACTIVE,
        channel: campaignDef.channel,
        budget: campaignDef.budget,
        biddingStrategy: campaignDef.biddingStrategy,
        startDate: daysAgo(120),
      },
    });

    const adGroup = await prisma.adGroup.create({
      data: {
        clientId: client.id,
        campaignId: campaign.id,
        externalId: `${seedIndex}-${campaignIndex}-ad-group`,
        name: `${campaignDef.name} - Main`,
        defaultBid: round(1.15 + campaignIndex * 0.22),
      },
    });

    const campaignKeywords = [];
    for (const [keywordIndex, keywordText] of campaignDef.keywords.entries()) {
      const keyword = await prisma.keyword.create({
        data: {
          clientId: client.id,
          adGroupId: adGroup.id,
          text: keywordText,
          matchType: [MatchType.EXACT, MatchType.PHRASE, MatchType.BROAD][keywordIndex % 3],
          bid: round(0.95 + campaignIndex * 0.18 + keywordIndex * 0.12),
        },
      });

      await prisma.searchTerm.create({
        data: {
          clientId: client.id,
          keywordId: keyword.id,
          term: keywordText,
          matchType: keyword.matchType,
          spend: round(120 + seedIndex * 18 + campaignIndex * 35 + keywordIndex * 16),
          sales: round(420 + seedIndex * 95 + campaignIndex * 120 + keywordIndex * 50),
          clicks: 85 + campaignIndex * 10 + keywordIndex * 8,
          orders: 12 + campaignIndex * 2 + keywordIndex,
          ctr: round(0.042 + keywordIndex * 0.004, 4),
          cvr: round(0.12 + keywordIndex * 0.015, 4),
          acos: round(0.24 + keywordIndex * 0.03, 4),
          roas: round(4.2 - keywordIndex * 0.35, 4),
        },
      });

      campaignKeywords.push(keyword);
      keywords.push(keyword);
    }

    campaigns.push({
      ...campaign,
      keywords: campaignKeywords,
    });
  }

  for (let day = 59; day >= 0; day -= 1) {
    const date = daysAgo(day);
    for (const [campaignIndex, campaign] of campaigns.entries()) {
      const spend = round(70 + seedIndex * 10 + campaignIndex * 15 + ((59 - day) % 7) * 4.4);
      const clicks = Math.round(spend * 10.5 + campaignIndex * 12);
      const impressions = clicks * (18 + campaignIndex * 3);
      const orders = Math.max(6, Math.round(clicks * (0.11 + campaignIndex * 0.008)));
      const sales = round(orders * (42 + campaignIndex * 7 + seedIndex * 5));

      await prisma.adMetric.create({
        data: {
          clientId: client.id,
          campaignId: campaign.id,
          adGroupId: null,
          keywordId: null,
          searchTermId: null,
          date,
          spend,
          sales,
          impressions,
          clicks,
          orders,
          ctr: round(ratio(clicks, impressions), 4),
          cpc: round(ratio(spend, clicks), 4),
          cvr: round(ratio(orders, clicks), 4),
          acos: round(ratio(spend, sales), 4),
          roas: round(ratio(sales, spend), 4),
        },
      });
    }

    for (const [productIndex, product] of products.entries()) {
      const sessions = 210 + seedIndex * 35 + productIndex * 26 + ((59 - day) % 6) * 18;
      const unitsOrdered = 18 + seedIndex * 3 + productIndex * 4 + ((59 - day) % 4);
      const revenue = round(unitsOrdered * (Number(product.price) * (0.96 + productIndex * 0.02)));
      const organicSales = round(revenue * (0.34 + productIndex * 0.03));
      const totalOrders = Math.round(unitsOrdered * 0.92);
      const spendReference = 82 + productIndex * 14 + seedIndex * 10;

      await prisma.salesMetric.create({
        data: {
          clientId: client.id,
          productId: product.id,
          date,
          sessions,
          unitsOrdered,
          totalOrders,
          revenue,
          organicSales,
          tacos: round(ratio(spendReference, revenue), 4),
          conversionRate: round(ratio(totalOrders, sessions), 4),
        },
      });
    }

    for (const [queryIndex, query] of blueprint.sqpQueries.entries()) {
      const spend = round(42 + seedIndex * 5 + queryIndex * 6 + ((59 - day) % 5) * 2.8);
      const clicks = 44 + queryIndex * 6 + ((59 - day) % 3) * 4;
      const orders = Math.max(3, Math.round(clicks * (0.12 + queryIndex * 0.01)));
      const sales = round(orders * (36 + seedIndex * 4 + queryIndex * 2.5));
      const purchaseShare = 0.08 + queryIndex * 0.03 + (seedIndex === 0 ? 0.02 : 0.01);

      await prisma.sQPMetric.create({
        data: {
          clientId: client.id,
          productId: products[queryIndex % products.length].id,
          date,
          query,
          impressionShare: round(0.14 + queryIndex * 0.05, 4),
          clickShare: round(0.1 + queryIndex * 0.03, 4),
          cartAddShare: round(0.07 + queryIndex * 0.025, 4),
          purchaseShare: round(purchaseShare, 4),
          spend,
          clicks,
          orders,
          sales,
          acos: round(ratio(spend, sales), 4),
          roas: round(ratio(sales, spend), 4),
          recommendedAction: queryIndex % 4 === 0 ? "scale" : queryIndex % 4 === 1 ? "cut" : queryIndex % 4 === 2 ? "test" : "defend",
        },
      });
    }
  }

  const auditFindings = [
    {
      category: "Wasted spend",
      severity: "high",
      insight: "Non-brand generic terms are absorbing spend above target ACOS without enough conversion.",
    },
    {
      category: "Winners",
      severity: "medium",
      insight: "Brand defense and hero ASIN campaigns are producing efficient ROAS and can absorb more budget.",
    },
    {
      category: "SQP gaps",
      severity: "medium",
      insight: "Several queries show strong purchase share but low paid investment, indicating under-scaled demand.",
    },
  ];

  const recommendations = [
    "Pause or downbid low-converting broad terms by 15-20%.",
    "Reallocate budget toward hero ASIN and branded campaigns.",
    "Promote high-purchase-share SQP queries into dedicated exact campaigns.",
  ];

  await prisma.auditReport.create({
    data: {
      clientId: client.id,
      title: `${blueprint.brandName} Weekly Audit`,
      summary: "Seeded audit covering efficiency losses, scale opportunities, and product conversion gaps.",
      findings: auditFindings,
      recommendations,
      status: RecordStatus.ACTIVE,
    },
  });

  await prisma.marketingPlan.create({
    data: {
      clientId: client.id,
      title: `${blueprint.brandName} 30-Day Growth Plan`,
      status: RecordStatus.ACTIVE,
      plan: {
        immediateFixes: [
          "Reduce bids on low-CVR generic search terms.",
          "Refresh underperforming creative for high-impression, low-click queries.",
        ],
        campaignRestructure: [
          "Separate branded, category, and product-conquesting themes.",
          "Create exact-match scale campaigns from SQP winners.",
        ],
        budgetReallocation: [
          "Shift 12% of spend from low-ROAS campaigns into branded and hero ASIN campaigns.",
        ],
      },
      roadmap: [
        { week: 1, focus: "Bid control and search term harvesting" },
        { week: 2, focus: "Creative and PDP optimization for high-impression queries" },
        { week: 3, focus: "SQP-led expansion and exact match buildout" },
        { week: 4, focus: "Budget pacing and retention campaign review" },
      ],
    },
  });

  const session = await prisma.chatSession.create({
    data: {
      clientId: client.id,
      userId: (await prisma.user.findFirstOrThrow({ where: { email: "owner@demo.com" } })).id,
      title: `${blueprint.brandName} Strategy Review`,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId: session.id,
        role: ChatRole.USER,
        content: "Why did ACOS move up last week?",
      },
      {
        sessionId: session.id,
        role: ChatRole.ASSISTANT,
        content: "Generic prospecting campaigns increased spend faster than revenue, while branded campaigns remained efficient.",
      },
    ],
  });

  await prisma.dataSyncJob.create({
    data: {
      clientId: client.id,
      type: "daily-sync",
      status: JobStatus.COMPLETED,
      attempts: 1,
      startedAt: daysAgo(1),
      completedAt: new Date(daysAgo(1).getTime() + 1000 * 60 * 4),
      log: {
        steps: [
          "Connected Amazon Ads profile",
          "Pulled campaigns, ad groups, and keywords",
          "Normalized SQP and sales metrics",
        ],
      },
    },
  });
}

async function main() {
  await resetDatabase();

  const workspace = await prisma.workspace.create({
    data: {
      name: "Agency Growth Partners",
      slug: "agency-growth-partners",
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Olivia Carter",
        email: "owner@demo.com",
        passwordHash: "demo-password",
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcus Lee",
        email: "analyst@demo.com",
        passwordHash: "demo-password",
      },
    }),
  ]);

  await prisma.workspaceMember.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: users[0].id,
        role: Role.OWNER,
      },
      {
        workspaceId: workspace.id,
        userId: users[1].id,
        role: Role.ANALYST,
      },
    ],
  });

  for (const [index, blueprint] of clientBlueprints.entries()) {
    await seedClient(workspace.id, blueprint, index);
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
