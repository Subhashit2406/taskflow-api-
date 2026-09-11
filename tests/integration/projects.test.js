/**
 * TaskFlow API - Projects Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const config = require('../../src/config/env');

describe('Projects API (/api/v1/projects)', () => {
  let authToken;
  let createdProjectId;

  beforeAll(async () => {
    // Register user for auth tests
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Project Manager',
        email: 'pm@taskflow.dev',
        password: 'Password123!',
      });
    authToken = res.body.data.token;
  });

  describe('GET /api/v1/projects', () => {
    it('should return paginated list of projects (200 OK)', async () => {
      const res = await request(app).get('/api/v1/projects');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.pagination).toBeDefined();
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should reject unauthenticated project creation (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Unauthorized Project',
          description: 'Should fail',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should create project successfully with Bearer JWT (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Core Architecture Redesign',
          description: 'Refactoring services to hexagonal domain layers',
          status: 'ACTIVE',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Core Architecture Redesign');
      expect(res.body.data.id).toBeDefined();

      createdProjectId = res.body.data.id;
    });

    it('should create project successfully with X-API-Key header (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('X-API-Key', config.apiKey)
        .send({
          name: 'API Key Generated Project',
          description: 'Created via automated CI system account',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('API Key Generated Project');
    });

    it('should reject creation with invalid name length (422 Validation Error)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A', // Too short
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should retrieve single project by UUID (200 OK)', async () => {
      const res = await request(app).get(`/api/v1/projects/${createdProjectId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdProjectId);
      expect(res.body.data.name).toBe('Core Architecture Redesign');
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000009999';
      const res = await request(app).get(`/api/v1/projects/${fakeUuid}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 422/400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/v1/projects/invalid-id-format');

      expect(res.statusCode).toBe(422);
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    it('should update full project attributes (200 OK)', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Core Architecture Redesign v2',
          description: 'Updated description',
          status: 'COMPLETED',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Core Architecture Redesign v2');
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    it('should partially update project status (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'ACTIVE',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project and return 204 No Content', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(204);

      // Verify it no longer exists
      const checkRes = await request(app).get(`/api/v1/projects/${createdProjectId}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });
});
