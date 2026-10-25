import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Prefer pooled Neon URL on serverless hosts. */
function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL_POOLED ||
    process.env.DATABASE_URL ||
    ""
  );
}

export const hasDatabase = Boolean(resolveDatabaseUrl());

export const prisma =
  hasDatabase
    ? globalForPrisma.prisma ??
      new PrismaClient({
        datasources: {
          db: { url: resolveDatabaseUrl() },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      })
    : (null as unknown as PrismaClient);

if (hasDatabase && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
