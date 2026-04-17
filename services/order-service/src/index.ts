import app from "./server"
import "./config/Redis/redis"
import { logger } from "./config/Logger/pino"

const port: number = (process.env.PORT ?? 3000) as number

// ============================================================================
// SERVER STARTUP
// ============================================================================
const server = app.listen(port, () => {
  logger.info(`Order Service is running on port ${port}\n URL: http://localhost:${port}/`)
})

// ============================================================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================================================

/**
 * Handles graceful shutdown for the application
 *
 * Process:
 * 1. Stop accepting new connections
 * 2. Wait for existing requests to complete
 * 3. Close database/Redis connections
 * 4. Exit cleanly
 *
 * @param signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 */
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received: starting graceful shutdown`)

  // Stop accepting new connections
  server.close(() => {
    logger.info("HTTP server closed - no longer accepting connections")

    // ========================================================================
    // CLEANUP OPERATIONS
    // ========================================================================

    /**
     * TODO: Add your cleanup operations here:
     *
     * 1. Close Redis connection:
     *    await redisClient.quit()
     *
     * 2. Close database connections:
     *    await db.disconnect()
     *
     * 3. Finish pending jobs:
     *    await jobQueue.close()
     *
     * 4. Flush logs:
     *    await logger.flush()
     */

    logger.info("Cleanup completed - exiting process")
    process.exit(0) // Exit with success code
  })

  /**
   * Force shutdown timeout
   * - If graceful shutdown takes too long, force exit
   * - Prevents hanging processes in production
   * - 10 seconds is a reasonable timeout (adjust based on your app)
   */
  setTimeout(() => {
    logger.error("Graceful shutdown timeout exceeded - forcing exit")
    process.exit(1) // Exit with error code
  }, 10000) // 10 seconds timeout
}

// ============================================================================
// SIGNAL HANDLERS
// ============================================================================

/**
 * SIGTERM - Termination signal
 *
 * Sent by:
 * - Docker/Kubernetes when stopping containers
 * - Process managers (PM2, systemd)
 * - Cloud platforms (AWS ECS, Google Cloud Run)
 *
 * Critical for: Container orchestration and cloud deployments
 */
process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM")
})

/**
 * SIGINT - Interrupt signal
 *
 * Sent by:
 * - Ctrl+C in terminal
 * - Manual kill commands
 *
 * Critical for: Local development and manual intervention
 */
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT")
})

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * uncaughtException - Synchronous errors that weren't caught
 *
 * Examples:
 * - throw new Error("Something broke")
 * - JSON.parse(invalidJSON) without try/catch
 * - Accessing undefined.property
 *
 * Why fatal:
 * - Application state may be corrupted
 * - Continuing could cause data inconsistency
 * - Best practice is to log and restart
 *
 * Production strategy:
 * - Let process manager (PM2, Docker, K8s) restart the app
 * - Log full error for debugging
 */
process.on("uncaughtException", (error: Error) => {
  logger.fatal(
    {
      err: error,
      stack: error.stack,
      type: "uncaughtException"
    },
    "Uncaught exception detected - application state may be corrupted"
  )

  // Exit immediately - don't attempt cleanup as state is unknown
  process.exit(1)
})

/**
 * unhandledRejection - Promise rejections without .catch()
 *
 * Examples:
 * - async function that throws without try/catch
 * - Promise.reject() without .catch()
 * - await somePromise() outside try/catch
 *
 * Why critical:
 * - In Node.js 15+, unhandled rejections terminate the process by default
 * - Indicates programming error (missing error handling)
 * - Can cause silent failures in older Node versions
 *
 * Production strategy:
 * - Log the error with full context
 * - Exit and let orchestrator restart
 */
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  logger.error(
    {
      reason,
      promise,
      type: "unhandledRejection"
    },
    "Unhandled promise rejection detected"
  )

  // Exit to prevent undefined behavior
  process.exit(1)
})

/**
 * warning - Node.js warnings (deprecations, max listeners, etc.)
 *
 * Examples:
 * - Deprecated API usage
 * - Too many event listeners
 * - Memory leak warnings
 *
 * Why log:
 * - Helps catch issues before they become critical
 * - Identifies deprecated code before Node.js upgrades
 */
process.on("warning", (warning: Error) => {
  logger.warn(
    {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    },
    "Node.js warning emitted"
  )
})

// ============================================================================
// OPTIONAL: HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * Health check for load balancers and orchestrators
 * - Returns 200 if server is running
 * - Can be enhanced to check Redis/DB connections
 *
 * Uncomment if needed:
 *
 * app.get("/health", (req, res) => {
 *   res.status(200).json({
 *     status: "healthy",
 *     uptime: process.uptime(),
 *     timestamp: Date.now()
 *   })
 * })
 */

// ============================================================================
// STARTUP DIAGNOSTICS
// ============================================================================

/**
 * Log important startup information
 * - Helps diagnose configuration issues
 * - Visible in container logs
 */
logger.info({
  nodeVersion: process.version,
  platform: process.platform,
  pid: process.pid,
  memory: process.memoryUsage(),
  env: process.env.NODE_ENV || "development"
}, "Server startup diagnostics")