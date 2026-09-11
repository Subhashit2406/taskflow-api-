/**
 * TaskFlow API - Test In-Memory Database Setup using pg-mem
 * Allows fast, isolated, zero-dependency integration test execution.
 */

const { newDb } = require('pg-mem');
const crypto = require('crypto');

function createMockDb() {
  const db = newDb();

  // Register gen_random_uuid() function in pg-mem (impure: true ensures a fresh UUID on each invocation)
  db.public.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: 'text',
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  // Create tables with DEFAULT gen_random_uuid() in memory
  db.public.none(`
    CREATE TABLE users (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'user' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE projects (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
      user_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE tasks (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id VARCHAR(36) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'TODO' NOT NULL,
      priority VARCHAR(50) DEFAULT 'MEDIUM' NOT NULL,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    INSERT INTO users (id, email, password_hash, name, role)
    VALUES ('00000000-0000-0000-0000-000000000000', 'service.account@taskflow.dev', '$2a$04$fakehash', 'API Key Service Account', 'admin');
  `);

  const { Pool } = db.adapters.createPg();
  const mockPool = new Pool();

  return {
    db,
    pool: mockPool,
  };
}

module.exports = {
  createMockDb,
};
