const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditService');

/**
 * Get Activities with filters and role scoping
 */
const getActivities = async (req, res, next) => {
  try {
    const {
      type = '',
      status = '',
      customerId = '',
      leadId = '',
      opportunityId = '',
      assignedTo = '',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const whereConditions = [];

    // Role scoping
    if (req.user.role_name === 'CUSTOMER') {
      whereConditions.push('(c.user_id = ? OR c.email = ?)');
      params.push(req.user.user_id, req.user.email);
    } else if (req.user.role_name === 'SALES_EXECUTIVE') {
      whereConditions.push('(a.assigned_to = ? OR a.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (type) {
      whereConditions.push('a.activity_type = ?');
      params.push(type);
    }

    if (status) {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    if (customerId) {
      whereConditions.push('a.customer_id = ?');
      params.push(customerId);
    }

    if (leadId) {
      whereConditions.push('a.lead_id = ?');
      params.push(leadId);
    }

    if (opportunityId) {
      whereConditions.push('a.opportunity_id = ?');
      params.push(opportunityId);
    }

    if (assignedTo && (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER')) {
      whereConditions.push('a.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM activities a
      LEFT JOIN customers c ON a.customer_id = c.customer_id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT a.*,
             c.customer_name, c.company_name as customer_company,
             l.lead_name, l.company_name as lead_company,
             o.opportunity_name,
             u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
             u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
      FROM activities a
      LEFT JOIN customers c ON a.customer_id = c.customer_id
      LEFT JOIN leads l ON a.lead_id = l.lead_id
      LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
      LEFT JOIN users u_assign ON a.assigned_to = u_assign.user_id
      LEFT JOIN users u_create ON a.created_by = u_create.user_id
      ${whereClause}
      ORDER BY a.activity_date DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [activities] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Activities retrieved successfully.', {
      activities,
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

/**
 * Log New Activity
 */
const createActivity = async (req, res, next) => {
  try {
    const {
      activity_type,
      subject,
      description,
      activity_date,
      customer_id,
      lead_id,
      opportunity_id,
      status = 'COMPLETED',
      assigned_to
    } = req.body;

    const createdBy = req.user.user_id;
    const targetAssignedTo = assigned_to || req.user.user_id;

    const query = `
      INSERT INTO activities 
      (activity_type, subject, description, activity_date, customer_id, lead_id, opportunity_id, status, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      activity_type,
      subject,
      description || null,
      activity_date,
      customer_id || null,
      lead_id || null,
      opportunity_id || null,
      status,
      createdBy,
      targetAssignedTo
    ]);

    const newId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'CREATE',
      entityName: 'ACTIVITY',
      recordId: newId,
      newValue: { activity_type, subject, activity_date },
      req
    });

    const [created] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [newId]);

    return successResponse(res, 'Activity logged successfully.', created[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Activity
 */
const updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activity_type, subject, description, activity_date, status, assigned_to } = req.body;

    const [current] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Activity not found.', null, 404);
    }

    const oldRecord = current[0];

    if (req.user.role_name === 'SALES_EXECUTIVE' && oldRecord.assigned_to !== req.user.user_id && oldRecord.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to update this activity.', null, 403);
    }

    const updateQuery = `
      UPDATE activities SET
        activity_type = COALESCE(?, activity_type),
        subject = COALESCE(?, subject),
        description = COALESCE(?, description),
        activity_date = COALESCE(?, activity_date),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to)
      WHERE activity_id = ?
    `;

    await pool.query(updateQuery, [
      activity_type || null,
      subject || null,
      description || null,
      activity_date || null,
      status || null,
      assigned_to || null,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE',
      entityName: 'ACTIVITY',
      recordId: id,
      oldValue: oldRecord,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Activity updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Activity
 */
const deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Only Administrators and Managers can delete activities.', null, 403);
    }

    const [existing] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Activity not found.', null, 404);
    }

    await pool.query('DELETE FROM activities WHERE activity_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'DELETE',
      entityName: 'ACTIVITY',
      recordId: id,
      oldValue: existing[0],
      req
    });

    return successResponse(res, 'Activity deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity
};
