import "./config/Redis/redis";
import { logger } from "./config/Logger/pino";
import { redisStreamService } from "./services/redisStream.service";

/**
 * Dedicated Worker Entry Point
 * This process only handles Redis Stream consumption and does not start an HTTP server.
 */
async function bootstrap() {
  logger.info("Payment Worker starting...");

  try {
    // 1. Initialize the consumer group
    await redisStreamService.initConsumerGroup();

    // 2. Start the consumer loop
    // In a dedicated worker, we CAN await this if it's the only task,
    // or just let it run.
    await redisStreamService.startConsumer();
  } catch (error) {
    logger.error({ err: error }, "Fatal error in Payment Worker");
    process.exit(1);
  }
}

// Graceful shutdown logic for the worker
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received: shutting down worker`);
  // Add any specific cleanup for the worker here
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught exception in worker");
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ reason }, "Unhandled promise rejection in worker");
  process.exit(1);
});

bootstrap();
