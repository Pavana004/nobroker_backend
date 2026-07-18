import { PrismaClient } from "@prisma/client";
import { isProd } from "./env";

declare global {
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

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
