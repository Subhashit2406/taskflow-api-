/**
 * TaskFlow API - Project Routes
 * Modular router for /api/v1/projects
 */

const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const {
  projectIdParamSchema,
  listProjectsQuerySchema,
  createProjectSchema,
  updateProjectSchema,
  patchProjectSchema,
} = require('./project.schema');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const cacheService = require('../../services/cache.service');

// Public / Cached Read Routes
router.get(
  '/',
  validate(listProjectsQuerySchema),
  cacheService.middleware('projects', 30),
  projectController.getAllProjects
);

router.get(
  '/:id',
  validate(projectIdParamSchema),
  cacheService.middleware('projects', 60),
  projectController.getProjectById
);

// Protected Write Routes (Requires JWT or API Key)
router.post(
  '/',
  requireAuth,
  validate(createProjectSchema),
  projectController.createProject
);

router.put(
  '/:id',
  requireAuth,
  validate(updateProjectSchema),
  projectController.updateProject
);

router.patch(
  '/:id',
  requireAuth,
  validate(patchProjectSchema),
  projectController.patchProject
);

router.delete(
  '/:id',
  requireAuth,
  validate(projectIdParamSchema),
  projectController.deleteProject
);

module.exports = router;
