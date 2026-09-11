/**
 * TaskFlow API - Project Zod Validation Schemas
 */

const { z } = require('zod');

// Schema for UUID URL parameter
const projectIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Project ID must be a valid UUID format'),
  }),
});

// Query string parameters for project list
const listProjectsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['name', 'status', 'created_at', 'updated_at']).default('created_at'),
    order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
  }),
});

// POST /api/v1/projects body
const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).default('ACTIVE'),
  }),
});

// PUT /api/v1/projects/:id (Full update)
const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Project ID must be a valid UUID format'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']),
  }),
});

// PATCH /api/v1/projects/:id (Partial update)
const patchProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Project ID must be a valid UUID format'),
  }),
  body: z
    .object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150).optional(),
      description: z.string().trim().max(2000).optional().nullable(),
      status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

module.exports = {
  projectIdParamSchema,
  listProjectsQuerySchema,
  createProjectSchema,
  updateProjectSchema,
  patchProjectSchema,
};
