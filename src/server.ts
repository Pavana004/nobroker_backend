import app from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./config/prisma";

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API running on ${env.API_BASE_URL} (${env.NODE_ENV})`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs at ${env.API_BASE_URL}/api-docs`);
});

// Graceful shutdown: stop accepting new connections, let in-flight requests
// finish, then close the DB pool cleanly. Matters most under PM2/Docker,
// which send SIGTERM before killing the process.
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  // Force-exit if shutdown hangs for more than 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Promise Rejection:", reason);
});
