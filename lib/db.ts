import { PrismaClient } from "@prisma/client";

// Lazy Prisma client. Returns null when DATABASE_URL is not set so static
// builds and pre-database deploys keep working; pages fall back to an
// empty/coming-soon state instead of crashing.
let client: PrismaClient | null | undefined;

export function getDb(): PrismaClient | null {
  if (client !== undefined) return client;
  if (!process.env.DATABASE_URL) {
    client = null;
    return client;
  }
  client = new PrismaClient();
  return client;
}
