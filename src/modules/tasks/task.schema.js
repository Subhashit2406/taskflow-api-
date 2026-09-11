/**
 * TaskFlow API - Task Zod Validation Schemas
 */

const { z } = require('zod');

// Schema for UUID URL parameter
const taskIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Task ID must be a valid UUID format'),
  }),
});

// Query string validation for Task list endpoint
const listTasksQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    projectId: z.string().uuid('Project ID must be a valid UUID format').optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['due_date', 'created_at', 'updated_at', 'priority', 'title', 'status']).default('created_at'),
    order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
  }),
});

// POST /api/v1/tasks (Create Task)
const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Project ID must be a valid UUID format'),
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().trim().max(5000).optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  }),
});

// PUT /api/v1/tasks/:id (Full Task Update)
const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Task ID must be a valid UUID format'),
  }),
  body: z.object({
    projectId: z.string().uuid('Project ID must be a valid UUID format'),
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().trim().max(5000).optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  }),
});

// PATCH /api/v1/tasks/:id (Partial Task Update)
const patchTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Task ID must be a valid UUID format'),
  }),
  body: z
    .object({
      projectId: z.string().uuid('Project ID must be a valid UUID format').optional(),
      title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200).optional(),
      description: z.string().trim().max(5000).optional().nullable(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

module.exports = {
  taskIdParamSchema,
  listTasksQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  patchTaskSchema,
};
