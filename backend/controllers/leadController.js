const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateCode } = require('../utils/codeGenerator');
const { logAudit } = require('../services/auditService');

/**
 * Valid Lead State Transitions Map
 */
const allowedTransitions = {
  NEW: ['CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'UNQUALIFIED', 'LOST'],
  QUALIFIED: ['CONVERTED', 'LOST', 'UNQUALIFIED'],
  UNQUALIFIED: ['CONTACTED', 'QUALIFIED', 'LOST'],
  LOST: ['CONTACTED', 'QUALIFIED'],
  CONVERTED: [] // Terminal state
};

/**
 * Get leads with search, filter, pagination, role scoping
 */
const getLeads = async (req, res, next) => {
  try {
    const {
      search = '',
      status = '',
      priority = '',
      assignedTo = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const whereConditions = [];

    // Role-based visibility: CUSTOMER cannot access leads
    if (req.user.role_name === 'CUSTOMER') {
      return errorResponse(res, 'Access denied: Customer portal users cannot access internal leads.', null, 403);
    }

    if (req.user.role_name === 'SALES_EXECUTIVE') {
      whereConditions.push('(l.assigned_to = ? OR l.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    // Search filter
    if (search.trim()) {
      whereConditions.push('(l.lead_name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.company_name LIKE ? OR l.lead_code LIKE ?)');
      const wild = `%${search.trim()}%`;
      params.push(wild, wild, wild, wild, wild);
    }

    // Status filter
    if (status) {
      whereConditions.push('l.status = ?');
      params.push(status);
    }

    // Priority filter
    if (priority) {
      whereConditions.push('l.priority = ?');
      params.push(priority);
    }

    // Assigned filter
    if (assignedTo && (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER')) {
      whereConditions.push('l.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM leads l ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const allowedSortColumns = ['lead_id', 'lead_code', 'lead_name', 'email', 'company_name', 'status', 'priority', 'expected_value', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? `l.${sortBy}` : 'l.created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT l.*,
             u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
             u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
      FROM leads l
      LEFT JOIN users u_assign ON l.assigned_to = u_assign.user_id
      LEFT JOIN users u_create ON l.created_by = u_create.user_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [leads] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Leads retrieved successfully.', {
      leads,
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
 * Get Lead by ID
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role_name === 'CUSTOMER') {
      return errorResponse(res, 'Access denied.', null, 403);
    }

    const [rows] = await pool.query(
      `SELECT l.*,
              u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
              u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
       FROM leads l
       LEFT JOIN users u_assign ON l.assigned_to = u_assign.user_id
       LEFT JOIN users u_create ON l.created_by = u_create.user_id
       WHERE l.lead_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Lead not found.', null, 404);
    }

    const lead = rows[0];

    if (req.user.role_name === 'SALES_EXECUTIVE' && lead.assigned_to !== req.user.user_id && lead.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to view this lead.', null, 403);
    }

    // Get linked follow-ups and activities
    const [followups] = await pool.query('SELECT * FROM followups WHERE lead_id = ? ORDER BY followup_date DESC', [id]);
    const [activities] = await pool.query('SELECT * FROM activities WHERE lead_id = ? ORDER BY activity_date DESC', [id]);

    return successResponse(res, 'Lead details retrieved.', {
      lead,
      followups,
      activities
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Lead
 */
const createLead = async (req, res, next) => {
  try {
    const {
      lead_name,
      email,
      phone,
      company_name,
      source = 'Website',
      status = 'NEW',
      priority = 'WARM',
      expected_value = 0,
      notes,
      assigned_to
    } = req.body;

    const leadCode = await generateCode('LEAD', 'leads', 'lead_code');
    const createdBy = req.user.user_id;
    const targetAssignedTo = assigned_to || req.user.user_id;

    const query = `
      INSERT INTO leads 
      (lead_code, lead_name, email, phone, company_name, source, status, priority, expected_value, notes, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      leadCode,
      lead_name,
      email,
      phone,
      company_name || null,
      source,
      status,
      priority,
      expected_value,
      notes || null,
      createdBy,
      targetAssignedTo
    ]);

    const newLeadId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'CREATE',
      entityName: 'LEAD',
      recordId: newLeadId,
      newValue: { lead_name, email, lead_code: leadCode, status, priority, expected_value },
      req
    });

    const [newLead] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [newLeadId]);

    return successResponse(res, 'Lead created successfully.', newLead[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Lead with workflow transition verification
 */
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      lead_name,
      email,
      phone,
      company_name,
      source,
      status,
      priority,
      expected_value,
      notes,
      assigned_to
    } = req.body;

    const [current] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Lead not found.', null, 404);
    }

    const oldLead = current[0];

    // Ownership check
    if (req.user.role_name === 'SALES_EXECUTIVE' && oldLead.assigned_to !== req.user.user_id && oldLead.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to update this lead.', null, 403);
    }

    // Workflow state transition check
    if (status && status !== oldLead.status) {
      if (oldLead.status === 'CONVERTED') {
        return errorResponse(res, 'A converted lead is finalized and cannot change status.', null, 400);
      }

      const validNext = allowedTransitions[oldLead.status] || [];
      if (!validNext.includes(status)) {
        return errorResponse(
          res,
          `Invalid status transition: Cannot transition from ${oldLead.status} to ${status}. Valid options: ${validNext.join(', ')}`,
          { currentStatus: oldLead.status, targetStatus: status, allowedTransitions: validNext },
          400
        );
      }
    }

    const newAssignedTo = (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER') && assigned_to !== undefined
      ? assigned_to
      : oldLead.assigned_to;

    const updateQuery = `
      UPDATE leads SET
        lead_name = COALESCE(?, lead_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        company_name = COALESCE(?, company_name),
        source = COALESCE(?, source),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        expected_value = COALESCE(?, expected_value),
        notes = COALESCE(?, notes),
        assigned_to = COALESCE(?, assigned_to)
      WHERE lead_id = ?
    `;

    await pool.query(updateQuery, [
      lead_name || null,
      email || null,
      phone || null,
      company_name || null,
      source || null,
      status || null,
      priority || null,
      expected_value !== undefined ? expected_value : null,
      notes || null,
      newAssignedTo,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE',
      entityName: 'LEAD',
      recordId: id,
      oldValue: oldLead,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Lead updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Lead
 */
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Only Administrators and Managers can delete leads.', null, 403);
    }

    const [existing] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Lead not found.', null, 404);
    }

    await pool.query('DELETE FROM leads WHERE lead_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'DELETE',
      entityName: 'LEAD',
      recordId: id,
      oldValue: existing[0],
      req
    });

    return successResponse(res, 'Lead deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * Lead Conversion: Converts a qualified lead into Customer and Opportunity
 */
const convertLead = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { opportunity_name, amount, expected_close_date } = req.body;

    const [leadRows] = await connection.query('SELECT * FROM leads WHERE lead_id = ?', [id]);
    if (leadRows.length === 0) {
      connection.release();
      return errorResponse(res, 'Lead not found.', null, 404);
    }

    const lead = leadRows[0];

    if (lead.status === 'CONVERTED') {
      connection.release();
      return errorResponse(res, 'Lead has already been converted.', null, 400);
    }

    await connection.beginTransaction();

    // 1. Check if customer already exists by email/phone or create new
    let customerId;
    const [existingCust] = await connection.query(
      'SELECT customer_id FROM customers WHERE email = ? OR phone = ?',
      [lead.email, lead.phone]
    );

    if (existingCust.length > 0) {
      customerId = existingCust[0].customer_id;
    } else {
      const custCode = await generateCode('CUST', 'customers', 'customer_code');
      const [newCust] = await connection.query(
        `INSERT INTO customers 
         (customer_code, customer_name, email, phone, company_name, status, created_by, assigned_to)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [
          custCode,
          lead.lead_name,
          lead.email,
          lead.phone,
          lead.company_name || `${lead.lead_name}'s Company`,
          req.user.user_id,
          lead.assigned_to || req.user.user_id
        ]
      );
      customerId = newCust.insertId;
    }

    // 2. Create Opportunity
    const oppCode = await generateCode('OPP', 'opportunities', 'opportunity_code');
    const oppAmount = amount || lead.expected_value || 10000;
    const closeDate = expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [newOpp] = await connection.query(
      `INSERT INTO opportunities 
       (opportunity_code, opportunity_name, customer_id, lead_id, amount, stage, probability, expected_close_date, status, created_by, assigned_to)
       VALUES (?, ?, ?, ?, ?, 'QUALIFICATION', 25, ?, 'OPEN', ?, ?)`,
      [
        oppCode,
        opportunity_name || `${lead.company_name || lead.lead_name} Expansion Deal`,
        customerId,
        id,
        oppAmount,
        closeDate,
        req.user.user_id,
        lead.assigned_to || req.user.user_id
      ]
    );

    const opportunityId = newOpp.insertId;

    // 3. Mark Lead as CONVERTED
    await connection.query(
      `UPDATE leads SET 
         status = 'CONVERTED', 
         converted_customer_id = ?, 
         converted_opportunity_id = ? 
       WHERE lead_id = ?`,
      [customerId, opportunityId, id]
    );

    await connection.commit();
    connection.release();

    await logAudit({
      userId: req.user.user_id,
      action: 'CONVERT_LEAD',
      entityName: 'LEAD',
      recordId: id,
      newValue: {
        lead_id: id,
        customer_id: customerId,
        opportunity_id: opportunityId,
        amount: oppAmount
      },
      req
    });

    return successResponse(res, 'Lead converted into Customer and Opportunity successfully!', {
      customer_id: customerId,
      opportunity_id: opportunityId,
      status: 'CONVERTED'
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLead
};
