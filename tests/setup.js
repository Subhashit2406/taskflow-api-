/**
 * TaskFlow API - Global Test Setup
 */

const { createMockDb } = require('./mocks/dbMock');
const { setPool } = require('../src/config/database');
const cacheService = require('../src/services/cache.service');

let mockInstance;

beforeAll(() => {
  mockInstance = createMockDb();
  setPool(mockInstance.pool);
});

beforeEach(() => {
  cacheService.clear();
});

afterAll(async () => {
  if (mockInstance && mockInstance.pool) {
    await mockInstance.pool.end();
  }
});
