/**
 * TaskFlow API - Migration Runner
 * Executes sql/schema.sql to set up the database tables and indexes.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function runMigration() {
  const client = await pool.connect();
  try {
    logger.info('Starting database migration...');
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');

    logger.info(' Database migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(' Database migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
