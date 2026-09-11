/**
 * TaskFlow API - Route Index
 * Mounts sub-routers onto the versioned API router.
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/project.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const healthRoutes = require('./modules/health/health.routes');

// API V1 Route Registration
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

// Welcome / API index information
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'TaskFlow API',
    version: '1.0.0',
    description: 'Production-grade Task and Project Management REST API',
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
      },
      projects: {
        list: 'GET /api/v1/projects',
        get: 'GET /api/v1/projects/:id',
        create: 'POST /api/v1/projects [Auth Required]',
        update: 'PUT /api/v1/projects/:id [Auth Required]',
        patch: 'PATCH /api/v1/projects/:id [Auth Required]',
        delete: 'DELETE /api/v1/projects/:id [Auth Required]',
      },
      tasks: {
        list: 'GET /api/v1/tasks',
        get: 'GET /api/v1/tasks/:id',
        create: 'POST /api/v1/tasks [Auth Required]',
        update: 'PUT /api/v1/tasks/:id [Auth Required]',
        patch: 'PATCH /api/v1/tasks/:id [Auth Required]',
        delete: 'DELETE /api/v1/tasks/:id [Auth Required]',
      },
    },
  });
});

module.exports = router;
