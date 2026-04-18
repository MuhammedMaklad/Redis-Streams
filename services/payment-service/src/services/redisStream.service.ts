import { type Redis } from "ioredis";
import { logger } from "../config/Logger/pino";
import { client } from "../config/Redis/redis";

export class RedisStreamService {
  private readonly redis: Redis = client;
  private readonly STREAM_NAME = "order:stream";
  private readonly GROUP_NAME = "payment-group";
  private readonly CONSUMER_NAME = `payment-consumer-${process.pid}`;

  /**
   * Initializes the Consumer Group if it doesn't exist
   */
  async initConsumerGroup() {
    try {
      // MKSTREAM creates the stream if it doesn't exist
      await this.redis.xgroup(
        "CREATE",
        this.STREAM_NAME,
        this.GROUP_NAME,
        "0",
        "MKSTREAM",
      );
      logger.info(
        { group: this.GROUP_NAME, stream: this.STREAM_NAME },
        "Consumer group created",
      );
    } catch (error: any) {
      if (error.message.includes("BUSYGROUP")) {
        logger.info(
          { group: this.GROUP_NAME },
          "Consumer group already exists",
        );
      } else {
        logger.error({ err: error }, "Failed to initialize consumer group");
        throw error;
      }
    }
  }

  private readonly STALE_THRESHOLD_MS = 10000; // 10 seconds

  /**
   * Starts the consumer loop
   */
  async startConsumer() {
    logger.info(
      { consumer: this.CONSUMER_NAME },
      "Starting stream consumer...",
    );

    while (true) {
      try {
        // 1. First, try to claim stale messages from other consumers
        await this.claimStaleMessages();

        // 2. Read new messages
        const results = await this.redis.xreadgroup(
          "GROUP",
          this.GROUP_NAME,
          this.CONSUMER_NAME,
          "COUNT",
          "1",
          "BLOCK",
          "5000",
          "STREAMS",
          this.STREAM_NAME,
          ">",
        );

        if (!results || results.length === 0) continue;

        for (const [stream, messages] of results) {
          for (const [id, fields] of messages) {
            await this.handleMessage(id, fields);
          }
        }
      } catch (error) {
        logger.error({ err: error }, "Error in consumer loop");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Looks for messages that have been pending (not ACKed) for too long
   * and claims them for this consumer.
   */
  private async claimStaleMessages() {
    try {
      // XPENDING <stream> <group> <start> <end> <count>
      // Returns: [id, consumer, idleTimeMs, deliveryCount]
      const pendingInfo: any = await this.redis.xpending(
        this.STREAM_NAME,
        this.GROUP_NAME,
        "-",
        "+",
        10
      );

      if (!pendingInfo || pendingInfo.length === 0) return;

      const idsToClaim: string[] = [];

      for (const [id, consumer, idleTime, deliveryCount] of pendingInfo) {
        // If message has been idle for more than our threshold
        if (idleTime > this.STALE_THRESHOLD_MS && consumer !== this.CONSUMER_NAME) {
          logger.warn({ msgId: id, consumer, idleTime }, "Found stale message, attempting to claim");
          idsToClaim.push(id);
        }
      }

      if (idsToClaim.length > 0) {
        // XCLAIM <stream> <group> <consumer> <min-idle-time> <ID...>
        const claimedMessages = await this.redis.xclaim(
          this.STREAM_NAME,
          this.GROUP_NAME,
          this.CONSUMER_NAME,
          this.STALE_THRESHOLD_MS,
          ...idsToClaim
        );

        for (const [id, fields] of (claimedMessages as any)) {
          logger.info({ msgId: id }, "Successfully claimed message");
          await this.handleMessage(id, fields);
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to claim stale messages");
    }
  }

  /**
   * Processes a single message from the stream
   */
  private async handleMessage(id: string, fields: string[]) {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      // --- SIMULATED FAILURE LOGIC ---
      // We will simulate a failure 30% of the time to see XPENDING in action
      if (Math.random() < 0.3) {
        logger.error({ msgId: id }, "💥 Simulated random processing failure! Message will remain pending.");
        return; // Exit WITHOUT calling XACK
      }
      // -------------------------------

      logger.info({ msgId: id, data }, "Processing order message");
      await this.processPayment(data);

      await this.redis.xack(this.STREAM_NAME, this.GROUP_NAME, id);
      logger.info({ msgId: id }, "Message acknowledged");
    } catch (error) {
      logger.error({ err: error, msgId: id }, "Failed to process message");
    }
  }

  private async processPayment(data: Record<string, any>) {
    // Simulate payment processing logic
    logger.info(
      { orderId: data.orderId },
      "Payment processed successfully for order",
    );
  }
}

export const redisStreamService = new RedisStreamService();
