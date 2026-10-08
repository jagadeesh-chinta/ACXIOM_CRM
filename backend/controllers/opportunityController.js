const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateCode } = require('../utils/codeGenerator');
const { logAudit } = require('../services/auditService');

/**
 * Get Opportunities with search, stage filtering, pagination, and weighted pipeline
 */
const getOpportunities = async (req, res, next) => {
  try {
    const {
      search = '',
      stage = '',
      status = '',
      customerId = '',
      assignedTo = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
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
      whereConditions.push('(o.assigned_to = ? OR o.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (search.trim()) {
      whereConditions.push('(o.opportunity_name LIKE ? OR o.opportunity_code LIKE ? OR c.company_name LIKE ? OR c.customer_name LIKE ?)');
      const wild = `%${search.trim()}%`;
      params.push(wild, wild, wild, wild);
    }

    if (stage) {
      whereConditions.push('o.stage = ?');
      params.push(stage);
    }

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    if (customerId) {
      whereConditions.push('o.customer_id = ?');
      params.push(customerId);
    }

    if (assignedTo && (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER')) {
      whereConditions.push('o.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total,
             COALESCE(SUM(o.amount), 0) as total_pipeline_value,
             COALESCE(SUM(o.amount * (o.probability / 100)), 0) as total_weighted_value
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;
    const totalPipelineValue = Number(countResult[0].total_pipeline_value);
    const totalWeightedValue = Number(countResult[0].total_weighted_value);

    const allowedSortColumns = ['opportunity_id', 'opportunity_code', 'opportunity_name', 'amount', 'stage', 'probability', 'expected_close_date', 'status', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? `o.${sortBy}` : 'o.created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT o.*,
             (o.amount * (o.probability / 100)) as weighted_amount,
             c.customer_name, c.company_name, c.email as customer_email,
             u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
             u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN users u_assign ON o.assigned_to = u_assign.user_id
      LEFT JOIN users u_create ON o.created_by = u_create.user_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [opportunities] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Opportunities retrieved successfully.', {
      opportunities,
      summary: {
        totalPipelineValue,
        totalWeightedValue
      },
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
 * Get Opportunity by ID
 */
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT o.*,
              (o.amount * (o.probability / 100)) as weighted_amount,
              c.customer_name, c.company_name, c.email as customer_email, c.phone as customer_phone, c.user_id as customer_user_id,
              u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
              u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
       FROM opportunities o
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN users u_assign ON o.assigned_to = u_assign.user_id
       LEFT JOIN users u_create ON o.created_by = u_create.user_id
       WHERE o.opportunity_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Opportunity not found.', null, 404);
    }

    const opp = rows[0];

    // Customer role scoping
    if (req.user.role_name === 'CUSTOMER' && opp.customer_user_id !== req.user.user_id && opp.customer_email !== req.user.email) {
      return errorResponse(res, 'Unauthorized to view this opportunity.', null, 403);
    }

    // Sales Executive scoping
    if (req.user.role_name === 'SALES_EXECUTIVE' && opp.assigned_to !== req.user.user_id && opp.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized: Deal is not assigned to you.', null, 403);
    }

    // Related follow-ups and activities
    const [followups] = await pool.query('SELECT * FROM followups WHERE opportunity_id = ? ORDER BY followup_date DESC', [id]);
    const [activities] = await pool.query('SELECT * FROM activities WHERE opportunity_id = ? ORDER BY activity_date DESC', [id]);

    return successResponse(res, 'Opportunity details retrieved.', {
      opportunity: opp,
      followups,
      activities
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Opportunity
 */
const createOpportunity = async (req, res, next) => {
  try {
    const {
      opportunity_name,
      customer_id,
      lead_id,
      amount,
      stage = 'QUALIFICATION',
      probability = 20,
      expected_close_date,
      status = 'OPEN',
      notes,
      assigned_to
    } = req.body;

    // Verify customer exists
    const [custRows] = await pool.query('SELECT customer_id FROM customers WHERE customer_id = ?', [customer_id]);
    if (custRows.length === 0) {
      return errorResponse(res, 'Selected customer does not exist.', null, 404);
    }

    const oppCode = await generateCode('OPP', 'opportunities', 'opportunity_code');
    const createdBy = req.user.user_id;
    const targetAssignedTo = assigned_to || req.user.user_id;

    // Auto status sync
    let finalStatus = status;
    let finalProb = probability;
    if (stage === 'WON') {
      finalStatus = 'WON';
      finalProb = 100;
    } else if (stage === 'LOST') {
      finalStatus = 'LOST';
      finalProb = 0;
    }

    const query = `
      INSERT INTO opportunities 
      (opportunity_code, opportunity_name, customer_id, lead_id, amount, stage, probability, expected_close_date, status, notes, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      oppCode,
      opportunity_name,
      customer_id,
      lead_id || null,
      amount,
      stage,
      finalProb,
      expected_close_date,
      finalStatus,
      notes || null,
      createdBy,
      targetAssignedTo
    ]);

    const newOppId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'CREATE',
      entityName: 'OPPORTUNITY',
      recordId: newOppId,
      newValue: { opportunity_code: oppCode, opportunity_name, amount, stage, probability: finalProb },
      req
    });

    const [newOpp] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [newOppId]);

    return successResponse(res, 'Opportunity created successfully.', newOpp[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Opportunity
 */
const updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      opportunity_name,
      amount,
      stage,
      probability,
      expected_close_date,
      status,
      notes,
      assigned_to
    } = req.body;

    const [current] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Opportunity not found.', null, 404);
    }

    const oldOpp = current[0];

    // Ownership check
    if (req.user.role_name === 'SALES_EXECUTIVE' && oldOpp.assigned_to !== req.user.user_id && oldOpp.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to update this opportunity.', null, 403);
    }
    if (req.user.role_name === 'CUSTOMER') {
      return errorResponse(res, 'Customers cannot modify commercial deal terms.', null, 403);
    }

    let finalStage = stage || oldOpp.stage;
    let finalStatus = status || oldOpp.status;
    let finalProb = probability !== undefined ? probability : oldOpp.probability;

    if (stage === 'WON') {
      finalStatus = 'WON';
      finalProb = 100;
    } else if (stage === 'LOST') {
      finalStatus = 'LOST';
      finalProb = 0;
    }

    const newAssignedTo = (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER') && assigned_to !== undefined
      ? assigned_to
      : oldOpp.assigned_to;

    const updateQuery = `
      UPDATE opportunities SET
        opportunity_name = COALESCE(?, opportunity_name),
        amount = COALESCE(?, amount),
        stage = ?,
        probability = ?,
        expected_close_date = COALESCE(?, expected_close_date),
        status = ?,
        notes = COALESCE(?, notes),
        assigned_to = COALESCE(?, assigned_to)
      WHERE opportunity_id = ?
    `;

    await pool.query(updateQuery, [
      opportunity_name || null,
      amount !== undefined ? amount : null,
      finalStage,
      finalProb,
      expected_close_date || null,
      finalStatus,
      notes || null,
      newAssignedTo,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE',
      entityName: 'OPPORTUNITY',
      recordId: id,
      oldValue: oldOpp,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Opportunity updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Opportunity
 */
const deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Only Administrators and Managers can delete opportunities.', null, 403);
    }

    const [existing] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Opportunity not found.', null, 404);
    }

    await pool.query('DELETE FROM opportunities WHERE opportunity_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'DELETE',
      entityName: 'OPPORTUNITY',
      recordId: id,
      oldValue: existing[0],
      req
    });

    return successResponse(res, 'Opportunity deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
