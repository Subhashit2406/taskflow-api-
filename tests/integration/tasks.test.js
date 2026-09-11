/**
 * TaskFlow API - Tasks Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Tasks API (/api/v1/tasks)', () => {
  let authToken;
  let testProjectId;
  let testTaskId;

  beforeAll(async () => {
    // 1. Authenticate user
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Task Tester',
        email: 'tasktester@taskflow.dev',
        password: 'Password123!',
      });
    authToken = authRes.body.data.token;

    // 2. Create parent project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E-Commerce Infrastructure',
        description: 'Payment gateway and shopping cart backend services',
        status: 'ACTIVE',
      });
    testProjectId = projRes.body.data.id;
  });

  describe('POST /api/v1/tasks', () => {
    it('should reject unauthenticated task creation (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({
          projectId: testProjectId,
          title: 'Unauthenticated Task',
        });

      expect(res.statusCode).toBe(401);
    });

    it('should create a task under existing project (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          title: 'Integrate Stripe Webhooks',
          description: 'Handle customer.subscription.created and charge.succeeded events',
          status: 'TODO',
          priority: 'URGENT',
          dueDate: '2026-10-15T00:00:00Z',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Integrate Stripe Webhooks');
      expect(res.body.data.priority).toBe('URGENT');
      expect(res.body.data.project_id).toBe(testProjectId);

      testTaskId = res.body.data.id;
    });

    it('should reject task creation for non-existent project (404 Not Found)', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000008888';
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: fakeProjectId,
          title: 'Orphaned Task',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeAll(async () => {
      // Create additional tasks for filtering and sorting
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          title: 'Implement Redis Session Store',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        });

      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          title: 'Write Swagger OpenAPI Specs',
          status: 'DONE',
          priority: 'LOW',
        });
    });

    it('should list all tasks with pagination metadata (200 OK)', async () => {
      const res = await request(app).get('/api/v1/tasks?page=1&limit=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.pagination.currentPage).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(2);
    });

    it('should filter tasks by status=DONE', async () => {
      const res = await request(app).get('/api/v1/tasks?status=DONE');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((t) => t.status === 'DONE')).toBe(true);
    });

    it('should filter tasks by priority=URGENT', async () => {
      const res = await request(app).get('/api/v1/tasks?priority=URGENT');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((t) => t.priority === 'URGENT')).toBe(true);
    });

    it('should filter tasks by projectId', async () => {
      const res = await request(app).get(`/api/v1/tasks?projectId=${testProjectId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((t) => t.project_id === testProjectId)).toBe(true);
    });

    it('should support in-memory caching headers (X-Cache MISS then HIT)', async () => {
      // First request -> MISS
      const res1 = await request(app).get(`/api/v1/tasks?projectId=${testProjectId}&status=DONE`);
      expect(res1.statusCode).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      // Second identical request -> HIT
      const res2 = await request(app).get(`/api/v1/tasks?projectId=${testProjectId}&status=DONE`);
      expect(res2.statusCode).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should retrieve single task with parent project details', async () => {
      const res = await request(app).get(`/api/v1/tasks/${testTaskId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(testTaskId);
      expect(res.body.data.project_name).toBe('E-Commerce Infrastructure');
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should update full task attributes (200 OK)', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          title: 'Integrate Stripe Webhooks & Billing Portal',
          description: 'Updated description with billing portal support',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: '2026-10-20T00:00:00Z',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Integrate Stripe Webhooks & Billing Portal');
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should partially update task status to DONE (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'DONE',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('DONE');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete task and return 204 No Content', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(204);

      // Verify deletion
      const checkRes = await request(app).get(`/api/v1/tasks/${testTaskId}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });
});
