/**
 * TaskFlow API - Task Routes
 * Modular router for /api/v1/tasks
 */

const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const {
  taskIdParamSchema,
  listTasksQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  patchTaskSchema,
} = require('./task.schema');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const cacheService = require('../../services/cache.service');

// Public / Cached Read Routes
router.get(
  '/',
  validate(listTasksQuerySchema),
  cacheService.middleware('tasks', 30),
  taskController.getAllTasks
);

router.get(
  '/:id',
  validate(taskIdParamSchema),
  cacheService.middleware('tasks', 60),
  taskController.getTaskById
);

// Protected Write Routes (Requires JWT or API Key)
router.post(
  '/',
  requireAuth,
  validate(createTaskSchema),
  taskController.createTask
);

router.put(
  '/:id',
  requireAuth,
  validate(updateTaskSchema),
  taskController.updateTask
);

router.patch(
  '/:id',
  requireAuth,
  validate(patchTaskSchema),
  taskController.patchTask
);

router.delete(
  '/:id',
  requireAuth,
  validate(taskIdParamSchema),
  taskController.deleteTask
);

module.exports = router;
