/**
 * TaskFlow API - Custom Application Error Class
 * Distinguishes operational errors (e.g. invalid input, not found) from programming/system bugs.
 */

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 409, 422, 500)
   * @param {string} [code] - Machine-readable error code (e.g. 'NOT_FOUND', 'VALIDATION_ERROR')
   * @param {Array|Object} [details] - Detailed field errors or diagnostic info
   */
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  getDefaultCode(statusCode) {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }

  static badRequest(msg = 'Bad request', details = null) {
    return new AppError(msg, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(msg = 'Authentication required', details = null) {
    return new AppError(msg, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(msg = 'You do not have permission to perform this action', details = null) {
    return new AppError(msg, 403, 'FORBIDDEN', details);
  }

  static notFound(msg = 'Resource not found', details = null) {
    return new AppError(msg, 404, 'NOT_FOUND', details);
  }

  static conflict(msg = 'Resource conflict or duplicate entry', details = null) {
    return new AppError(msg, 409, 'CONFLICT', details);
  }

  static unprocessable(msg = 'Validation failed', details = null) {
    return new AppError(msg, 422, 'VALIDATION_ERROR', details);
  }

  static internal(msg = 'An unexpected internal error occurred', details = null) {
    return new AppError(msg, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

module.exports = AppError;
