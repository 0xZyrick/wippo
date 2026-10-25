import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const prisma =
  hasDatabase
    ? globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      })
    : (null as unknown as PrismaClient);

if (hasDatabase && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
