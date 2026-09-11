/**
 * TaskFlow API - Project Controller
 * HTTP Handler methods for Project resource operations.
 */

const projectRepository = require('./project.repository');
const cacheService = require('../../services/cache.service');
const AppError = require('../../utils/appError');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/v1/projects
 * List projects with pagination, status filtering, and search.
 */
const getAllProjects = asyncHandler(async (req, res) => {
  const { page, limit, status, search, sortBy, order } = req.query;

  const { projects, totalItems } = await projectRepository.findAndCountAll({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    status,
    search,
    sortBy,
    order,
  });

  return ApiResponse.paginated(
    res,
    projects,
    { totalItems, page, limit },
    'Projects retrieved successfully'
  );
});

/**
 * GET /api/v1/projects/:id
 * Retrieve single project by UUID with task counts.
 */
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await projectRepository.findById(id);

  if (!project) {
    throw AppError.notFound(`Project with ID ${id} not found.`);
  }

  return ApiResponse.success(res, project, 'Project retrieved successfully');
});

/**
 * POST /api/v1/projects
 * Create a new project (Protected).
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  const userId = req.user ? req.user.id : null;

  const newProject = await projectRepository.create({
    name,
    description,
    status,
    userId,
  });

  // Invalidate cached project lists
  cacheService.invalidatePrefix('projects');

  return ApiResponse.created(res, newProject, 'Project created successfully');
});

/**
 * PUT /api/v1/projects/:id
 * Full update of existing project (Protected).
 */
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const existing = await projectRepository.findById(id);
  if (!existing) {
    throw AppError.notFound(`Project with ID ${id} not found.`);
  }

  const updatedProject = await projectRepository.update(id, { name, description, status });

  // Invalidate cached project lists & single item
  cacheService.invalidatePrefix('projects');

  return ApiResponse.success(res, updatedProject, 'Project updated successfully');
});

/**
 * PATCH /api/v1/projects/:id
 * Partial update of project attributes (Protected).
 */
const patchProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await projectRepository.findById(id);
  if (!existing) {
    throw AppError.notFound(`Project with ID ${id} not found.`);
  }

  const updatedProject = await projectRepository.patch(id, req.body);

  // Invalidate cached project lists & single item
  cacheService.invalidatePrefix('projects');

  return ApiResponse.success(res, updatedProject, 'Project patched successfully');
});

/**
 * DELETE /api/v1/projects/:id
 * Delete project and associated tasks (Protected).
 */
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await projectRepository.delete(id);
  if (!deleted) {
    throw AppError.notFound(`Project with ID ${id} not found.`);
  }

  // Invalidate cached projects and tasks
  cacheService.invalidatePrefix('projects', 'tasks');

  return ApiResponse.noContent(res);
});

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  patchProject,
  deleteProject,
};
