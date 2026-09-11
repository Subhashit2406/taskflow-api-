/**
 * TaskFlow API - Task Repository (Raw SQL)
 * High-performance parameterized queries with dynamic filters, sorting, and pagination.
 */

const { query } = require('../../config/database');

class TaskRepository {
  /**
   * Find paginated tasks with dynamic filtering and sorting.
   */
  async findAndCountAll({
    page = 1,
    limit = 10,
    projectId,
    status,
    priority,
    search,
    sortBy = 'created_at',
    order = 'desc',
  }) {
    const offset = (page - 1) * limit;
    const values = [];
    const whereConditions = [];

    if (projectId) {
      values.push(projectId);
      whereConditions.push(`t.project_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      whereConditions.push(`t.status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      whereConditions.push(`t.priority = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      whereConditions.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Safe sorting whitelist to protect against SQL injection in ORDER BY clause
    const safeSortColumns = {
      created_at: 't.created_at',
      updated_at: 't.updated_at',
      due_date: 't.due_date',
      priority: `CASE t.priority 
        WHEN 'URGENT' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
        ELSE 5 END`,
      title: 't.title',
      status: 't.status',
    };

    const sortCol = safeSortColumns[sortBy.toLowerCase()] || 't.created_at';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Total items count query
    const countSql = `SELECT COUNT(*) AS total FROM tasks t ${whereClause};`;
    const countResult = await query(countSql, values);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    // 2. Paginated rows query with project name join
    const selectValues = [...values, limit, offset];
    const selectSql = `
      SELECT
        t.id,
        t.project_id,
        p.name AS project_name,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDirection}
      LIMIT $${selectValues.length - 1} OFFSET $${selectValues.length};
    `;

    const result = await query(selectSql, selectValues);

    return {
      tasks: result.rows,
      totalItems,
    };
  }

  /**
   * Find single task by UUID with project details.
   */
  async findById(id) {
    const sql = `
      SELECT
        t.id,
        t.project_id,
        p.name AS project_name,
        p.status AS project_status,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      WHERE t.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new task.
   */
  async create({ projectId, title, description, status = 'TODO', priority = 'MEDIUM', dueDate = null }) {
    const sql = `
      INSERT INTO tasks (project_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, title, description, status, priority, due_date, created_at, updated_at;
    `;
    const result = await query(sql, [
      projectId,
      title,
      description || null,
      status,
      priority,
      dueDate || null,
    ]);
    return result.rows[0];
  }

  /**
   * Update all fields of a task (PUT).
   */
  async update(id, { projectId, title, description, status, priority, dueDate }) {
    const sql = `
      UPDATE tasks
      SET project_id = $1, title = $2, description = $3, status = $4, priority = $5, due_date = $6
      WHERE id = $7
      RETURNING id, project_id, title, description, status, priority, due_date, created_at, updated_at;
    `;
    const result = await query(sql, [
      projectId,
      title,
      description || null,
      status,
      priority,
      dueDate || null,
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Partially update task fields (PATCH).
   */
  async patch(id, fields) {
    const updates = [];
    const values = [];

    const fieldMap = {
      projectId: 'project_id',
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      dueDate: 'due_date',
    };

    for (const [key, val] of Object.entries(fields)) {
      if (fieldMap[key] !== undefined) {
        values.push(val);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const sql = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, project_id, title, description, status, priority, due_date, created_at, updated_at;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete task by ID.
   */
  async delete(id) {
    const sql = 'DELETE FROM tasks WHERE id = $1 RETURNING id;';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new TaskRepository();
