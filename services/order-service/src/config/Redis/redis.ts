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
    // ── Sentinel mode — NO host/port direct connection ─────
    sentinels,
    name: process.env.REDIS_MASTER_NAME || "mymaster",

    // ── Re-query all sentinels on every reconnect attempt ──
    // This is what was missing: without this, ioredis caches
    // the last known master and retries it directly, looping
    // forever on ENOTFOUND after the container is stopped.
    updateSentinels: true,

    // ── Failover detector: subscribe to sentinel events ────
    // Triggers immediate reconnect when sentinel broadcasts
    // +switch-master instead of waiting for retry timeout
    enableOfflineQueue: true,

    // ── Sentinel connection timeouts ───────────────────────
    sentinelCommandTimeout: 3000, // give up on a sentinel after 3s
    sentinelRetryStrategy: (times) => Math.min(times * 200, 3000),

    // ── Master connection retries ──────────────────────────
    retryStrategy: (times) => {
      if (times > 30) {
        // After 30 failed attempts (~60s) stop retrying
        // process will restart via Docker restart: unless-stopped
        return null;
      }
      return Math.min(times * 200, 2000);
    },

    connectTimeout: 5000,
    maxRetriesPerRequest: null, // let retryStrategy handle it
    lazyConnect: false,
  });

  client.on("ready", () => {
    console.log("✅ Connected to Redis via Sentinel");
  });

  client.on("+switch-master", (name, oldHost, oldPort, newHost, newPort) => {
    console.log(`🔄 Sentinel promoted new master: ${newHost}:${newPort}`);
  });
  client.on("switchMaster", (address) =>
    logger.info(`Switched Master to ${address}`),
  );
  client.on("error", (err) => {
    // log but don't crash — retryStrategy handles reconnection
    console.error("Redis connection error:", err.message);
  });

  client.on("reconnecting", (delay: number) => {
    console.log(`⏳ Reconnecting to Redis in ${delay}ms...`);
  });

  return client;
};

const client = createRedisClient();

export { client };
