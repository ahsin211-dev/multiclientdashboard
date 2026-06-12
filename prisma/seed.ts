import { prisma } from "../lib/db/prisma";
import { runFullSync } from "../lib/amazon/sync";
import { saveConnection } from "../lib/amazon/oauth";
import crypto from "crypto";
import type { Marketplace } from "@prisma/client";

/**
 * Seeds a demo workspace with multiple clients and a full set of mock metrics.
 * Idempotent: re-running upserts the same demo records and re-syncs metrics.
 */

function hashPassword(pw: string) {
  // Demo-only password hashing (not for production auth).
  return crypto.createHash("sha256").update(pw).digest("hex");
}

const CLIENTS: { brandName: string; marketplace: Marketplace; currency: string }[] = [
  { brandName: "NorthPeak Nutrition", marketplace: "US", currency: "USD" },
  { brandName: "ChefCraft Kitchen", marketplace: "US", currency: "USD" },
  { brandName: "Lumière Beauty", marketplace: "UK", currency: "GBP" },
  { brandName: "PawPalace Pets", marketplace: "CA", currency: "CAD" },
  { brandName: "Summit Outdoors Co.", marketplace: "DE", currency: "EUR" },
];

async function main() {
  console.log("Seeding database…");

  const user = await prisma.user.upsert({
    where: { email: "demo@adsiq.app" },
    create: {
      email: "demo@adsiq.app",
      name: "Demo Owner",
      passwordHash: hashPassword("demo1234"),
    },
    update: {},
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@adsiq.app" },
    create: {
      email: "analyst@adsiq.app",
      name: "Alex Analyst",
      passwordHash: hashPassword("demo1234"),
    },
    update: {},
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-agency" },
    create: { name: "Demo Agency", slug: "demo-agency" },
    update: {},
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    create: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
    update: { role: "OWNER" },
  });
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: analyst.id, workspaceId: workspace.id } },
    create: { userId: analyst.id, workspaceId: workspace.id, role: "ANALYST" },
    update: { role: "ANALYST" },
  });

  for (const c of CLIENTS) {
    const existing = await prisma.client.findFirst({
      where: { workspaceId: workspace.id, brandName: c.brandName },
    });
    const client =
      existing ??
      (await prisma.client.create({
        data: {
          workspaceId: workspace.id,
          brandName: c.brandName,
          marketplace: c.marketplace,
          currency: c.currency,
        },
      }));

    // Store demo connections (encrypted tokens via saveConnection).
    await saveConnection(
      client.id,
      "ADS",
      { access_token: "demo-access", refresh_token: "demo-refresh", expires_in: 3600 },
      `profile-${client.id.slice(0, 6)}`
    );
    await saveConnection(
      client.id,
      "SP_API",
      { access_token: "demo-access", refresh_token: "demo-refresh", expires_in: 3600 },
      `seller-${client.id.slice(0, 6)}`
    );

    console.log(`  Syncing mock data for ${c.brandName}…`);
    await runFullSync(client.id, (m) => console.log(`    [${c.brandName}] ${m}`));
  }

  console.log("\nSeed complete.");
  console.log("Demo login: demo@adsiq.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
