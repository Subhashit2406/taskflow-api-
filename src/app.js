/**
 * TaskFlow API - Express Application Definition
 * Configures middleware, security policies, routes, and error handling.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const healthRoutes = require('./modules/health/health.routes');

const app = express();

// 1. Security Headers & Protection
app.use(
  helmet({
    contentSecurityPolicy: false, // REST API mode
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Cache'],
  })
);

// 3. Body Parsers with size safety limits
// Event loop protection: Prevents massive JSON payloads from blocking JSON.parse on the main thread
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Custom Request Logging & Correlation IDs
app.use(requestLogger);

// 5. Global Rate Limiter
app.use(apiLimiter);

// 6. Root & Health Check Endpoints
app.use('/health', healthRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'TaskFlow API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/health',
  });
});

// 7. Mount Main API Router
app.use(config.apiPrefix, routes);

// 8. 404 Undefined Route Handler
app.use(notFoundHandler);

// 9. Centralized Error Handler (Must be last middleware)
app.use(errorHandler);

module.exports = app;
