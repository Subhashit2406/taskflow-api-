/**
 * TaskFlow API - Authentication Middleware
 * Supports JWT Bearer tokens and API-Key authorization.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/appError');

/**
 * Require valid JWT or API Key authentication.
 */
function requireAuth(req, res, next) {
  // 1. Check for API-Key in header
  const apiKey = req.headers['x-api-key'] || req.headers['x-api-token'];
  if (apiKey && apiKey === config.apiKey) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'service.account@taskflow.dev',
      name: 'API Key Service Account',
      role: 'admin',
    };
    return next();
  }

  // 2. Extract Bearer token from Authorization header
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token or X-API-Key header.', 401, 'UNAUTHORIZED'));
  }

  // 3. Verify JWT
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
}

/**
 * Optional authentication - extracts user context if token is valid, but does not block if omitted.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch (_err) {
      // Ignore token verification failure for optional auth
    }
  }
  next();
}

/**
 * Role-based access control guard.
 * @param  {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
};
