/**
 * TaskFlow API - Custom Request Logging & Correlation ID Middleware
 * Assigns a unique X-Request-ID to each incoming HTTP request and records latency.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  // Generate or accept incoming Correlation ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = process.hrtime();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Log on response finish
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const responseTimeMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
    const statusCode = res.statusCode;

    const logMessage = `[${requestId.slice(0, 8)}] ${method} ${url} ${statusCode} - ${responseTimeMs}ms (${ip})`;

    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.http(logMessage);
    }
  });

  next();
}

module.exports = requestLogger;
