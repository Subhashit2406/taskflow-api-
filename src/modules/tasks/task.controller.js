/**
 * TaskFlow API - Task Controller
 * HTTP Handler methods for Task operations with cache management.
 */

const taskRepository = require('./task.repository');
const projectRepository = require('../projects/project.repository');
const cacheService = require('../../services/cache.service');
const AppError = require('../../utils/appError');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/v1/tasks
 * Filter, sort, and paginate tasks.
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const { page, limit, projectId, status, priority, search, sortBy, order } = req.query;

  const { tasks, totalItems } = await taskRepository.findAndCountAll({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    projectId,
    status,
    priority,
    search,
    sortBy,
    order,
  });

  return ApiResponse.paginated(
    res,
    tasks,
    { totalItems, page, limit },
    'Tasks retrieved successfully'
  );
});

/**
 * GET /api/v1/tasks/:id
 * Retrieve single task by UUID.
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await taskRepository.findById(id);

  if (!task) {
    throw AppError.notFound(`Task with ID ${id} not found.`);
  }

  return ApiResponse.success(res, task, 'Task retrieved successfully');
});

/**
 * POST /api/v1/tasks
 * Create a new task under a project (Protected).
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId, title, description, status, priority, dueDate } = req.body;

  // Validate parent project existence
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw AppError.notFound(`Parent Project with ID ${projectId} does not exist.`);
  }

  const newTask = await taskRepository.create({
    projectId,
    title,
    description,
    status,
    priority,
    dueDate,
  });

  // Invalidate cached task lists and project statistics
  cacheService.invalidatePrefix('tasks', 'projects');

  return ApiResponse.created(res, newTask, 'Task created successfully');
});

/**
 * PUT /api/v1/tasks/:id
 * Full update of task attributes (Protected).
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { projectId, title, description, status, priority, dueDate } = req.body;

  const existing = await taskRepository.findById(id);
  if (!existing) {
    throw AppError.notFound(`Task with ID ${id} not found.`);
  }

  if (projectId && projectId !== existing.project_id) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound(`Parent Project with ID ${projectId} does not exist.`);
    }
  }

  const updatedTask = await taskRepository.update(id, {
    projectId,
    title,
    description,
    status,
    priority,
    dueDate,
  });

  // Invalidate cache
  cacheService.invalidatePrefix('tasks', 'projects');

  return ApiResponse.success(res, updatedTask, 'Task updated successfully');
});

/**
 * PATCH /api/v1/tasks/:id
 * Partial update of task attributes (e.g. status transition) (Protected).
 */
const patchTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await taskRepository.findById(id);
  if (!existing) {
    throw AppError.notFound(`Task with ID ${id} not found.`);
  }

  if (req.body.projectId && req.body.projectId !== existing.project_id) {
    const project = await projectRepository.findById(req.body.projectId);
    if (!project) {
      throw AppError.notFound(`Parent Project with ID ${req.body.projectId} does not exist.`);
    }
  }

  const patchedTask = await taskRepository.patch(id, req.body);

  // Invalidate cache
  cacheService.invalidatePrefix('tasks', 'projects');

  return ApiResponse.success(res, patchedTask, 'Task patched successfully');
});

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task (Protected).
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await taskRepository.delete(id);
  if (!deleted) {
    throw AppError.notFound(`Task with ID ${id} not found.`);
  }

  // Invalidate cache
  cacheService.invalidatePrefix('tasks', 'projects');

  return ApiResponse.noContent(res);
});

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
};
