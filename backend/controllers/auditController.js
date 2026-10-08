const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Get audit logs with filtering and pagination
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action = '', entity = '', userId = '', search = '', page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const whereConditions = [];

    if (action) {
      whereConditions.push('a.action = ?');
      params.push(action);
    }

    if (entity) {
      whereConditions.push('a.entity_name = ?');
      params.push(entity);
    }

    if (userId) {
      whereConditions.push('a.user_id = ?');
      params.push(userId);
    }

    if (search.trim()) {
      whereConditions.push('(a.action LIKE ? OR a.entity_name LIKE ? OR a.ip_address LIKE ? OR u.email LIKE ?)');
      const wild = `%${search.trim()}%`;
      params.push(wild, wild, wild, wild);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT a.*, 
             u.first_name, u.last_name, u.email as user_email, u.department
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [auditLogs] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Audit logs retrieved.', {
      auditLogs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs
};
