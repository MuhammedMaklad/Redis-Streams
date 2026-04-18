import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import { v4 as uuid } from "uuid";
import { logger } from "../config/Logger/pino";
import { redisService } from "../services/redis.services";
import type { ICreateOrderBody } from "../types/order.types";

/**
 * Handles the creation of a new order and publishes it to a Redis stream
 */
const createOrder = async (
  req: Request<{}, {}, ICreateOrderBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, productId, amount } = req.body;
    const orderId = uuid();

    const messageData = {
      order_id: orderId,
      user_id: userId,
      product_id: productId,
      amount: amount.toString(),
      timestamp: new Date().toISOString(),
    };

    // Add order message to Redis Stream for downstream processing
    const msgId = await redisService.addToStream("order:stream", messageData);

    return res.status(status.CREATED).json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderId,
        streamMessageId: msgId,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Order creation controller failed");
    next(error); // Pass to global error handler
  }
};

export { createOrder as Create };
