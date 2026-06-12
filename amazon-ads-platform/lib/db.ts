import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return a client that will error on query — useful during build
    const adapter = new PrismaPg({ connectionString: "postgresql://localhost/placeholder" });
    return new PrismaClient({ adapter });
  }
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
