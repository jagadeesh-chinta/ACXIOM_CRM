const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditService');

/**
 * Get Follow-ups with filter tabs: all, today, upcoming, overdue, completed
 */
const getFollowups = async (req, res, next) => {
  try {
    const {
      view = 'all', // all, today, upcoming, overdue, completed, missed
      status = '',
      type = '',
      assignedTo = '',
      customerId = '',
      leadId = '',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const whereConditions = [];

    // Role-based scoping
    if (req.user.role_name === 'CUSTOMER') {
      whereConditions.push('(c.user_id = ? OR c.email = ?)');
      params.push(req.user.user_id, req.user.email);
    } else if (req.user.role_name === 'SALES_EXECUTIVE') {
      whereConditions.push('(f.assigned_to = ? OR f.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    // View filter
    if (view === 'today') {
      whereConditions.push('DATE(f.followup_date) = CURRENT_DATE()');
    } else if (view === 'upcoming') {
      whereConditions.push('f.followup_date > NOW() AND f.status = "PLANNED"');
    } else if (view === 'overdue') {
      whereConditions.push('f.followup_date < NOW() AND f.status = "PLANNED"');
    } else if (view === 'completed') {
      whereConditions.push('f.status = "COMPLETED"');
    } else if (view === 'missed') {
      whereConditions.push('f.status = "MISSED"');
    }

    if (status) {
      whereConditions.push('f.status = ?');
      params.push(status);
    }

    if (type) {
      whereConditions.push('f.followup_type = ?');
      params.push(type);
    }

    if (customerId) {
      whereConditions.push('f.customer_id = ?');
      params.push(customerId);
    }

    if (leadId) {
      whereConditions.push('f.lead_id = ?');
      params.push(leadId);
    }

    if (assignedTo && (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER')) {
      whereConditions.push('f.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM followups f
      LEFT JOIN customers c ON f.customer_id = c.customer_id
      LEFT JOIN leads l ON f.lead_id = l.lead_id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT f.*,
             c.customer_name, c.company_name as customer_company,
             l.lead_name, l.company_name as lead_company,
             o.opportunity_name,
             u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
             u_create.first_name as creator_first_name, u_create.last_name as creator_last_name,
             CASE 
               WHEN f.status = 'PLANNED' AND f.followup_date < NOW() THEN 'OVERDUE'
               WHEN f.status = 'PLANNED' AND DATE(f.followup_date) = CURRENT_DATE() THEN 'TODAY'
               WHEN f.status = 'PLANNED' AND f.followup_date > NOW() THEN 'UPCOMING'
               ELSE f.status
             END as urgency_state
      FROM followups f
      LEFT JOIN customers c ON f.customer_id = c.customer_id
      LEFT JOIN leads l ON f.lead_id = l.lead_id
      LEFT JOIN opportunities o ON f.opportunity_id = o.opportunity_id
      LEFT JOIN users u_assign ON f.assigned_to = u_assign.user_id
      LEFT JOIN users u_create ON f.created_by = u_create.user_id
      ${whereClause}
      ORDER BY f.followup_date ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [followups] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Follow-ups retrieved successfully.', {
      followups,
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
 * Schedule New Follow-up
 */
const createFollowup = async (req, res, next) => {
  try {
    const {
      customer_id,
      lead_id,
      opportunity_id,
      followup_date,
      followup_type = 'CALL',
      remarks,
      status = 'PLANNED',
      assigned_to
    } = req.body;

    // Validate either customer or lead is linked
    if (!customer_id && !lead_id) {
      return errorResponse(res, 'A follow-up must be associated with either a customer or a lead.', null, 400);
    }

    // Business rule: Planned follow-up date cannot be earlier than today
    const scheduledDate = new Date(followup_date);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    if (scheduledDate < now && status === 'PLANNED') {
      return errorResponse(res, 'Planned follow-up date cannot be in the past.', { followup_date: 'Must be current or future date' }, 400);
    }

    const createdBy = req.user.user_id;
    const targetAssignedTo = assigned_to || req.user.user_id;

    const query = `
      INSERT INTO followups 
      (customer_id, lead_id, opportunity_id, followup_date, followup_type, remarks, status, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      customer_id || null,
      lead_id || null,
      opportunity_id || null,
      followup_date,
      followup_type,
      remarks || null,
      status,
      createdBy,
      targetAssignedTo
    ]);

    const newId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'SCHEDULE_FOLLOWUP',
      entityName: 'FOLLOWUP',
      recordId: newId,
      newValue: { followup_type, followup_date, customer_id, lead_id },
      req
    });

    const [created] = await pool.query('SELECT * FROM followups WHERE followup_id = ?', [newId]);

    return successResponse(res, 'Follow-up scheduled successfully.', created[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update / Reschedule / Complete Follow-up
 */
const updateFollowup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      followup_date,
      followup_type,
      remarks,
      status,
      assigned_to
    } = req.body;

    const [current] = await pool.query('SELECT * FROM followups WHERE followup_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Follow-up not found.', null, 404);
    }

    const oldRecord = current[0];

    // Ownership check
    if (req.user.role_name === 'SALES_EXECUTIVE' && oldRecord.assigned_to !== req.user.user_id && oldRecord.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to modify this follow-up.', null, 403);
    }
    if (req.user.role_name === 'CUSTOMER') {
      return errorResponse(res, 'Customers cannot modify follow-ups directly.', null, 403);
    }

    // If rescheduling to a new date, check rule: cannot be in the past
    if (followup_date) {
      const newDate = new Date(followup_date);
      const now = new Date();
      now.setMinutes(now.getMinutes() - 5);
      if (newDate < now && status === 'PLANNED') {
        return errorResponse(res, 'Rescheduled follow-up date cannot be earlier than today.', { followup_date: 'Date cannot be in past' }, 400);
      }
    }

    const newAssignedTo = (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER') && assigned_to !== undefined
      ? assigned_to
      : oldRecord.assigned_to;

    const updateQuery = `
      UPDATE followups SET
        followup_date = COALESCE(?, followup_date),
        followup_type = COALESCE(?, followup_type),
        remarks = COALESCE(?, remarks),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to)
      WHERE followup_id = ?
    `;

    await pool.query(updateQuery, [
      followup_date || null,
      followup_type || null,
      remarks || null,
      status || null,
      newAssignedTo,
      id
    ]);

    // If status changed to COMPLETED, also automatically record an activity entry!
    if (status === 'COMPLETED' && oldRecord.status !== 'COMPLETED') {
      await pool.query(
        `INSERT INTO activities (activity_type, subject, description, activity_date, customer_id, lead_id, opportunity_id, status, created_by, assigned_to)
         VALUES (?, ?, ?, NOW(), ?, ?, ?, 'COMPLETED', ?, ?)`,
        [
          oldRecord.followup_type || 'CALL',
          `Follow-up Completed: ${oldRecord.remarks || oldRecord.followup_type}`,
          oldRecord.remarks || 'Follow-up executed successfully.',
          oldRecord.customer_id,
          oldRecord.lead_id,
          oldRecord.opportunity_id,
          req.user.user_id,
          oldRecord.assigned_to
        ]
      );
    }

    const [updated] = await pool.query('SELECT * FROM followups WHERE followup_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: status === 'COMPLETED' ? 'COMPLETE_FOLLOWUP' : 'UPDATE_FOLLOWUP',
      entityName: 'FOLLOWUP',
      recordId: id,
      oldValue: oldRecord,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Follow-up updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Follow-up
 */
const deleteFollowup = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Only Administrators and Managers can delete follow-ups.', null, 403);
    }

    const [existing] = await pool.query('SELECT * FROM followups WHERE followup_id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Follow-up not found.', null, 404);
    }

    await pool.query('DELETE FROM followups WHERE followup_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'DELETE',
      entityName: 'FOLLOWUP',
      recordId: id,
      oldValue: existing[0],
      req
    });

    return successResponse(res, 'Follow-up deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFollowups,
  createFollowup,
  updateFollowup,
  deleteFollowup
};
