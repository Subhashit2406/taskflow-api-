/**
 * TaskFlow API - HTTP Server Entrypoint
 * Handles process lifecycle, graceful shutdowns, and database pool termination.
 */

const app = require('./app');
const config = require('./config/env');
const { testConnection, closePool } = require('./config/database');
const logger = require('./utils/logger');

const server = app.listen(config.port, async () => {
  logger.info(`========================================================`);
  logger.info(` TaskFlow API server running on port: ${config.port}`);
  logger.info(` Environment: ${config.env}`);
  logger.info(` Health check: http://localhost:${config.port}/health`);
  logger.info(` API base URL: http://localhost:${config.port}${config.apiPrefix}`);
  logger.info(`========================================================`);

  // Verify database connectivity on boot
  const dbHealth = await testConnection();
  if (dbHealth.healthy) {
    logger.info(` Database connection established successfully (${dbHealth.latencyMs}ms latency).`);
  } else {
    logger.warn(` Database connection failed: ${dbHealth.error || 'Check configuration'}`);
  }
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await closePool();
      logger.info('Database connection pool terminated cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database pool teardown:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown exceeds 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Process signal listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions & unhandled promise rejections
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down immediately...', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = server;
