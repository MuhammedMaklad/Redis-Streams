import { Redis } from "ioredis";
import { logger } from "../Logger/pino";

const parseSentinels = (hostsEnv: string) =>
  hostsEnv.split(",").map((s) => {
    const [host, port] = s.trim().split(":");
    return { host, port: parseInt(port, 10) };
  });

const createRedisClient = () => {
  const sentinels = parseSentinels(
    process.env.REDIS_SENTINEL_HOSTS ||
      "redis-sentinel-1:26379,redis-sentinel-2:26379,redis-sentinel-3:26379",
  );

  const client = new Redis({
    sentinels,
    name: process.env.REDIS_MASTER_NAME || "mymaster",
    updateSentinels: true,
    enableOfflineQueue: true,
    sentinelCommandTimeout: 3000,
    sentinelRetryStrategy: (times) => Math.min(times * 200, 3000),
    retryStrategy: (times) => {
      if (times > 30) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

  client.on("ready", () => {
    logger.info("✅ Connected to Redis via Sentinel");
  });

  client.on("+switch-master", (name, oldHost, oldPort, newHost, newPort) => {
    logger.info(`🔄 Sentinel promoted new master: ${newHost}:${newPort}`);
  });

  client.on("error", (err) => {
    logger.error("Redis connection error:", err.message);
  });

  client.on("reconnecting", (delay: number) => {
    logger.info(`⏳ Reconnecting to Redis in ${delay}ms...`);
  });

  return client;
};

const client = createRedisClient();

export { client };
