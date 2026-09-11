/**
 * TaskFlow API - Seed Runner
 * Populates the database with initial development & testing dataset.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function runSeed() {
  const client = await pool.connect();
  try {
    logger.info('Starting database seeding...');
    const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await client.query('BEGIN');
    await client.query(seedSql);
    await client.query('COMMIT');

    const [userRes, projRes, taskRes] = await Promise.all([
      client.query('SELECT COUNT(*) FROM users;'),
      client.query('SELECT COUNT(*) FROM projects;'),
      client.query('SELECT COUNT(*) FROM tasks;')
    ]);

    logger.info(` Database seeded successfully:`);
    logger.info(`   - Users: ${userRes.rows[0].count}`);
    logger.info(`   - Projects: ${projRes.rows[0].count}`);
    logger.info(`   - Tasks: ${taskRes.rows[0].count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(' Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
