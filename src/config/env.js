/**
 * TaskFlow API - Environment Configuration
 * Centralizes and validates environment variables.
 */
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    connectionString: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'taskflow_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    poolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    poolConnTimeoutMs: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_super_secret_jwt_key_32_characters_long',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  apiKey: process.env.API_KEY || 'taskflow_live_api_key_demo_secret_2026',

  cache: {
    enabled: process.env.ENABLE_CACHE !== 'false',
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

module.exports = config;
