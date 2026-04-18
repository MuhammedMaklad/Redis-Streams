import app from "./server";
import "./config/Redis/redis";
import { logger } from "./config/Logger/pino";

const port: number = (process.env.PORT ?? 3001) as number;

const server = app.listen(port, () => {
  logger.info(
    `Payment API is running on port ${port}\n URL: http://localhost:${port}/`,
  );
});

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received: starting graceful shutdown`);

  server.close(() => {
    logger.info("HTTP server closed - no longer accepting connections");
    logger.info("Cleanup completed - exiting process");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timeout exceeded - forcing exit");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error: Error) => {
  logger.fatal(
    {
      err: error,
      stack: error.stack,
      type: "uncaughtException",
    },
    "Uncaught exception detected",
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error(
    {
      reason,
      type: "unhandledRejection",
    },
    "Unhandled promise rejection detected",
  );
  process.exit(1);
});

logger.info(
  {
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    env: process.env.NODE_ENV || "development",
  },
  "Server startup diagnostics",
);
