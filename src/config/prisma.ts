import { PrismaClient } from "@prisma/client";
import { isProd } from "./env";

// Singleton pattern: in dev, hot-reload via ts-node/nodemon would otherwise
// spawn a new PrismaClient (and a new connection pool) on every file change,
// quickly exhausting Postgres' max_connections. We cache the instance on the
// global object to prevent that.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProd ? ["error", "warn"] : ["query", "error", "warn"],
  });

if (!isProd) {
  global.__prisma = prisma;
}

// Connection pooling itself is configured via the DATABASE_URL connection
// string (?connection_limit=10&pool_timeout=20) or, at higher scale, by
// putting PgBouncer in front of Postgres in transaction-pooling mode — see
// docs/PERFORMANCE.md.

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
