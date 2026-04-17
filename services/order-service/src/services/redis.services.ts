import { type Redis } from "ioredis";
import { redis } from "../config/Redis/redis";
import { logger } from "../config/Logger/pino";

export class RedisService {
  private readonly redis: Redis = redis;

  /**
   * Adds a message to a Redis Stream
   * @param streamName Name of the stream
   * @param message Object representing the message data
   * @returns The generated message ID
   */
  async addToStream(streamName: string, message: Record<string, string>): Promise<string | null> {
    try {
      const flattenedMessage = Object.entries(message).flat();
      const msgId = await this.redis.xadd(streamName,'MAXLEN','~',1000, "*", ...flattenedMessage);

      logger.info({streamName, msgId}, "Message successfully added to Redis stream");
      return msgId;
    } catch (error) {
      logger.error({err: error, streamName, message}, "Failed to add message to Redis stream");
      throw error;
    }
  }
}

export const redisService = new RedisService();
