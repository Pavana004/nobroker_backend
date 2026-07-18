import app from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./config/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API running on ${env.API_BASE_URL} (${env.NODE_ENV})`);
  console.log(`📚 Swagger docs at ${env.API_BASE_URL}/api-docs`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
