/**
 * TaskFlow API - Centralized Error Handling Middleware
 * Translates PostgreSQL errors, validation issues, and operational exceptions
 * into uniform, well-structured REST JSON error payloads.
 */

const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Maps PostgreSQL specific error codes to user-friendly AppError instances.
 */
function handlePostgresError(err) {
  if (process.env.NODE_ENV === 'test') {
    // Debug log for test runs
  }
  switch (err.code) {
    case '23505': { // unique_violation
      const detail = err.detail || 'A record with this unique field already exists.';
      return new AppError(`Duplicate entry error: ${detail}`, 409, 'DUPLICATE_RESOURCE', [{ message: detail }]);
    }
    case '23503': { // foreign_key_violation
      const detail = err.detail || 'Referenced parent resource does not exist.';
      return new AppError(`Referential integrity error: ${detail}`, 400, 'FOREIGN_KEY_VIOLATION', [{ message: detail }]);
    }
    case '23502': { // not_null_violation
      return new AppError(`Missing required database field: ${err.column}`, 400, 'MISSING_REQUIRED_FIELD', [
        { field: err.column, message: 'This field cannot be null' },
      ]);
    }
    case '22P02': { // invalid_text_representation (e.g. invalid UUID format)
      return new AppError('Invalid parameter format or ID provided.', 400, 'INVALID_INPUT_SYNTAX');
    }
    case 'ECONNREFUSED': {
      return new AppError('Database service connection refused.', 503, 'DATABASE_UNAVAILABLE');
    }
    default:
      return null;
  }
}

/**
 * 404 Not Found catch-all middleware for undefined routes.
 */
function notFoundHandler(req, res, next) {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404, 'ROUTE_NOT_FOUND'));
}

/**
 * Centralized Global Error Handler Middleware
 */
function errorHandler(err, req, res, _next) {
  let error = err;

  // Handle JSON parsing syntax errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received in request body.', 400, 'MALFORMED_JSON');
  }

  // Handle PostgreSQL errors
  if (err.code && typeof err.code === 'string') {
    const pgError = handlePostgresError(err);
    if (pgError) error = pgError;
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired.', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'An unexpected internal server error occurred.';
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const details = error.details || null;

  // Log unhandled 500 internal errors
  if (statusCode >= 500) {
    logger.error(`[UNHANDLED ERROR] [${req.id || 'N/A'}] ${req.method} ${req.originalUrl}:`, {
      message: err.message,
      stack: err.stack,
    });
  }

  // Respond with consistent REST envelope
  const payload = {
    code,
    message,
  };

  if (details) {
    payload.details = details;
  }

  if (!config.isProduction && statusCode >= 500 && err.stack) {
    payload.stack = err.stack;
  }

  return ApiResponse.error(res, message, statusCode, code, details);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
