import "server-only";
import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev and across warm
// serverless invocations on Vercel. Without this, Next.js dev would spin up a
// new client (and a new connection) on every code change, quickly exhausting
// the database connection pool.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrlForRuntime(): string | undefined {
  // In local dev, prefer a direct (non-pooler) connection when available.
  // Pooler endpoints can be unreachable from some networks and are mainly
  // intended for serverless runtimes.
  if (process.env.NODE_ENV !== "production") {
    return process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  }
  return process.env.DATABASE_URL ?? process.env.DIRECT_URL;
}

const runtimeDbUrl = getDatabaseUrlForRuntime();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(runtimeDbUrl
      ? {
          datasources: {
            db: { url: runtimeDbUrl },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
