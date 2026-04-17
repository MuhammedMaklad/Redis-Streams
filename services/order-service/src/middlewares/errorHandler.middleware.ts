import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/Logger/pino";
import status from "http-status";

const handler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Use default status code if not provided
  const statusCode = error.statusCode || status.INTERNAL_SERVER_ERROR;
  const message = error.message || "Something went wrong";
  const errors = error.errors || [];

  // Log the error with request context
  logger.error({
    err: {
        message: error.message,
        stack: error.stack,
        ...error
    },
    path: req.path,
    method: req.method,
    statusCode
  }, "An error occurred during request processing");

  // Send a consistent error response
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    // Include stack trace only in development environment
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export {
  handler as ErrorHandlerMiddleware
};
