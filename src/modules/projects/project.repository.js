/**
 * TaskFlow API - Project Repository (Raw SQL)
 * Demonstrates high-performance parameterized SQL queries and database aggregates.
 */

const { query } = require('../../config/database');

class ProjectRepository {
  /**
   * Find paginated projects with dynamic filtering and task count aggregates.
   */
  async findAndCountAll({ page = 1, limit = 10, status, search, sortBy = 'created_at', order = 'desc' }) {
    const offset = (page - 1) * limit;
    const values = [];
    const whereConditions = [];

    if (status) {
      values.push(status);
      whereConditions.push(`p.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      whereConditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Allowed sort columns to prevent SQL injection via column identifiers
    const safeSortColumns = {
      name: 'p.name',
      status: 'p.status',
      created_at: 'p.created_at',
      updated_at: 'p.updated_at',
    };
    const sortCol = safeSortColumns[sortBy.toLowerCase()] || 'p.created_at';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Get total count
    const countSql = `SELECT COUNT(*) AS total FROM projects p ${whereClause};`;
    const countResult = await query(countSql, values);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    // 2. Fetch records with task aggregate statistics
    const selectValues = [...values, limit, offset];
    const selectSql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.user_id,
        p.created_at,
        p.updated_at,
        COUNT(t.id)::int AS task_count,
        COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::int AS completed_task_count,
        COUNT(CASE WHEN t.status IN ('TODO', 'IN_PROGRESS') THEN 1 END)::int AS pending_task_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${sortCol} ${sortDirection}
      LIMIT $${selectValues.length - 1} OFFSET $${selectValues.length};
    `;

    const result = await query(selectSql, selectValues);

    return {
      projects: result.rows,
      totalItems,
    };
  }

  /**
   * Find project by ID with detailed task breakdown and owner details.
   */
  async findById(id) {
    const sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.user_id,
        p.created_at,
        p.updated_at,
        u.owner_name,
        u.owner_email,
        COUNT(t.id)::int AS task_count,
        COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::int AS completed_task_count
      FROM projects p
      LEFT JOIN (
        SELECT id AS user_pk, name AS owner_name, email AS owner_email FROM users
      ) u ON u.user_pk = p.user_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.description, p.status, p.user_id, p.created_at, p.updated_at, u.owner_name, u.owner_email;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new project.
   */
  async create({ name, description, status = 'ACTIVE', userId = null }) {
    const sql = `
      INSERT INTO projects (name, description, status, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, status, user_id, created_at, updated_at;
    `;
    const result = await query(sql, [name, description || null, status, userId]);
    return result.rows[0];
  }

  /**
   * Update all fields of a project (PUT).
   */
  async update(id, { name, description, status }) {
    const sql = `
      UPDATE projects
      SET name = $1, description = $2, status = $3
      WHERE id = $4
      RETURNING id, name, description, status, user_id, created_at, updated_at;
    `;
    const result = await query(sql, [name, description || null, status, id]);
    return result.rows[0] || null;
  }

  /**
   * Partially update project fields (PATCH).
   */
  async patch(id, fields) {
    const updates = [];
    const values = [];

    const fieldMap = {
      name: 'name',
      description: 'description',
      status: 'status',
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
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, name, description, status, user_id, created_at, updated_at;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete project and cascade delete associated tasks.
   */
  async delete(id) {
    const sql = 'DELETE FROM projects WHERE id = $1 RETURNING id;';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new ProjectRepository();
