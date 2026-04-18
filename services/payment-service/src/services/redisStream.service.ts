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
        // Read new messages (">" means messages not yet delivered to other consumers)
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
        logger.debug({ results }, "Read from stream");
        if (!results || results.length === 0) continue;
        //@ts-ignore
        for (const [stream, messages] of results) {
          for (const [id, fields] of messages) {
            await this.handleMessage(id, fields);
          }
        }
      } catch (error) {
        logger.error({ err: error }, "Error reading from stream");
        // Wait a bit before retrying to avoid tight loop on persistent errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Processes a single message from the stream
   */
  private async handleMessage(id: string, fields: string[]) {
    try {
      // Convert flat array [key1, val1, key2, val2] to object
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      logger.info({ msgId: id, data }, "Processing order message");

      // Logic to process the "payment"
      await this.processPayment(data);

      // Acknowledge the message
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
