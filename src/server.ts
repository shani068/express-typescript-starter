import app from "@/app";
import { env } from "@/env";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { closeRedis } from "@/lib/redis";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

let shuttingDown = false;

// Stop accepting connections, let in-flight requests finish, then close external clients.
const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  logger.info(`${signal} received, shutting down`);

  // Force exit if open connections keep the server from closing.
  setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await Promise.all([db.$disconnect(), closeRedis()]);

  logger.info("Shutdown complete");
};

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;

    shutdown(signal).then(
      () => process.exit(0),
      (err: unknown) => {
        logger.error("Shutdown failed", { error: err instanceof Error ? err.message : err });
        process.exit(1);
      }
    );
  });
}
