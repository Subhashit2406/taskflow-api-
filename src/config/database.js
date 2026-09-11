/**
 * TaskFlow API - PostgreSQL Database Connection & Pooling
 * Demonstrates raw SQL querying with node-postgres (pg) pool management.
 */

const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

// Pool configuration options
const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: config.db.ssl,
      max: config.db.poolMax,
      idleTimeoutMillis: config.db.poolIdleTimeoutMs,
      connectionTimeoutMillis: config.db.poolConnTimeoutMs,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl,
      max: config.db.poolMax,
      idleTimeoutMillis: config.db.poolIdleTimeoutMs,
      connectionTimeoutMillis: config.db.poolConnTimeoutMs,
    };

// Let tests inject a custom mock pool if needed
let activePool = new Pool(poolConfig);

// Handle unexpected errors on idle pool clients
activePool.on('error', (err) => {
  logger.error('Unexpected idle PostgreSQL client error:', err.message);
});

/**
 * Executes a parameterized SQL query using the connection pool.
 * Measures query duration for performance diagnostics.
 *
 * @param {string} text - Parameterized SQL query
 * @param {Array} [params] - Query parameters ($1, $2, ...)
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`[SQL] Executed query in ${duration}ms | Rows: ${res.rowCount}`);
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`[SQL ERROR] (${duration}ms) Query failed: ${text}`);
    throw error;
  }
}

/**
 * Acquires a single dedicated client from the pool.
 * Must be manually released with client.release()!
 * Used for database transactions.
 *
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  const client = await activePool.connect();
  return client;
}

/**
 * Health check verification for database connectivity.
 * @returns {Promise<{ healthy: boolean, latencyMs: number }>}
 */
async function testConnection() {
  const start = Date.now();
  try {
    await activePool.query('SELECT 1 AS health_check');
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { healthy: false, latencyMs: Date.now() - start, error: error.message };
  }
}

/**
 * Gracefully close the database pool on application shutdown.
 */
async function closePool() {
  await activePool.end();
}

/**
 * Setter to swap pool (used by test suites for mock/in-memory DBs)
 */
function setPool(customPool) {
  activePool = customPool;
}

module.exports = {
  pool: activePool,
  query,
  getClient,
  testConnection,
  closePool,
  setPool,
};
