const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateCode } = require('../utils/codeGenerator');
const { logAudit } = require('../services/auditService');

/**
 * Get Customer self profile
 */
const getCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    let [custRows] = await pool.query(
      `SELECT c.*, 
              u.first_name as rep_first_name, u.last_name as rep_last_name, 
              u.email as rep_email, u.phone as rep_phone, u.department as rep_dept
       FROM customers c
       LEFT JOIN users u ON c.assigned_to = u.user_id
       WHERE c.user_id = ? OR c.email = ?`,
      [userId, req.user.email]
    );

    // If customer record doesn't exist yet, automatically create one so details are always dynamic and real
    if (!custRows || custRows.length === 0) {
      const customerCode = await generateCode('CUST', 'customers', 'customer_code');
      const fallbackPhone = req.user.phone || `+1-555-${userId.toString().padStart(4, '0')}`;
      await pool.query(
        `INSERT INTO customers (customer_code, customer_name, email, phone, company_name, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [customerCode, `${req.user.first_name} ${req.user.last_name}`, req.user.email, fallbackPhone, `${req.user.first_name}'s Enterprise`, userId]
      );
      [custRows] = await pool.query(
        `SELECT c.*, 
                u.first_name as rep_first_name, u.last_name as rep_last_name, 
                u.email as rep_email, u.phone as rep_phone, u.department as rep_dept
         FROM customers c
         LEFT JOIN users u ON c.assigned_to = u.user_id
         WHERE c.user_id = ? OR c.email = ?`,
        [userId, req.user.email]
      );
    }

    return successResponse(res, 'Customer profile retrieved.', {
      user: req.user,
      customerRecord: custRows[0] || null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Customer Requests
 */
const getCustomerRequests = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Determine customer id
    const [custRows] = await pool.query(
      'SELECT customer_id FROM customers WHERE user_id = ? OR email = ?',
      [userId, req.user.email]
    );
    const customerId = custRows[0] ? custRows[0].customer_id : null;

    let query;
    let params;

    if (req.user.role_name === 'CUSTOMER') {
      query = `
        SELECT r.*, 
               u.first_name as rep_first_name, u.last_name as rep_last_name,
               c.customer_name, c.company_name
        FROM customer_requests r
        LEFT JOIN users u ON r.assigned_to = u.user_id
        LEFT JOIN customers c ON r.customer_id = c.customer_id
        WHERE r.customer_id = ? OR r.user_id = ?
        ORDER BY r.created_at DESC
      `;
      params = [customerId, userId];
    } else {
      // Internal staff view
      query = `
        SELECT r.*, 
               u.first_name as rep_first_name, u.last_name as rep_last_name,
               c.customer_name, c.company_name
        FROM customer_requests r
        LEFT JOIN users u ON r.assigned_to = u.user_id
        LEFT JOIN customers c ON r.customer_id = c.customer_id
        ORDER BY r.created_at DESC
      `;
      params = [];
    }

    const [requests] = await pool.query(query, params);
    return successResponse(res, 'Customer requests retrieved.', requests);
  } catch (err) {
    next(err);
  }
};

/**
 * Submit Customer Request
 */
const createCustomerRequest = async (req, res, next) => {
  try {
    const { subject, message, priority = 'MEDIUM' } = req.body;
    const userId = req.user.user_id;

    if (!subject || !message) {
      return errorResponse(res, 'Subject and message are required.', null, 400);
    }

    // Find linked customer record
    let [custRows] = await pool.query(
      'SELECT customer_id, assigned_to FROM customers WHERE user_id = ? OR email = ?',
      [userId, req.user.email]
    );

    let customerId;
    let assignedTo;

    if (custRows.length > 0) {
      customerId = custRows[0].customer_id;
      assignedTo = custRows[0].assigned_to;
    } else {
      // Auto create a client customer record if none exists yet
      const custCode = await generateCode('CUST', 'customers', 'customer_code');
      const fallbackPhone = req.user.phone || `+1-555-${userId.toString().padStart(4, '0')}`;
      const [newCust] = await pool.query(
        `INSERT INTO customers (customer_code, customer_name, email, phone, company_name, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [
          custCode,
          `${req.user.first_name} ${req.user.last_name}`,
          req.user.email,
          fallbackPhone,
          `${req.user.first_name}'s Organization`,
          userId
        ]
      );
      customerId = newCust.insertId || custRows[0]?.customer_id;
      assignedTo = 3; // Default to Alex Turner
    }

    const query = `
      INSERT INTO customer_requests (customer_id, user_id, subject, message, priority, status, assigned_to)
      VALUES (?, ?, ?, ?, ?, 'OPEN', ?)
    `;

    const [result] = await pool.query(query, [customerId, userId, subject, message, priority, assignedTo || 3]);
    const requestId = result.insertId;

    await logAudit({
      userId,
      action: 'CREATE_REQUEST',
      entityName: 'CUSTOMER_REQUEST',
      recordId: requestId,
      newValue: { subject, priority },
      req
    });

    const [created] = await pool.query('SELECT * FROM customer_requests WHERE request_id = ?', [requestId]);

    return successResponse(res, 'Support request submitted successfully. Our team will contact you shortly.', created[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Respond to / Update Customer Request (Internal agent response)
 */
const updateCustomerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response, status, assigned_to } = req.body;

    const [current] = await pool.query('SELECT * FROM customer_requests WHERE request_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Request not found.', null, 404);
    }

    const updateQuery = `
      UPDATE customer_requests SET
        response = COALESCE(?, response),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        responded_at = CASE WHEN ? IS NOT NULL THEN NOW() ELSE responded_at END
      WHERE request_id = ?
    `;

    await pool.query(updateQuery, [
      response || null,
      status || null,
      assigned_to || null,
      response || null,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM customer_requests WHERE request_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE_REQUEST',
      entityName: 'CUSTOMER_REQUEST',
      recordId: id,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Request updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Customer Self Profile
 */
const updateCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, phone, company_name, address, city, state, postal_code, country } = req.body;

    if (phone) {
      const [existingPhone] = await pool.query(
        'SELECT customer_id FROM customers WHERE phone = ? AND user_id != ? AND email != ?',
        [phone, userId, req.user.email]
      );
      if (existingPhone.length > 0) {
        return errorResponse(res, 'This phone number is already registered to another customer account.', null, 409);
      }
    }

    if (first_name || last_name || phone) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE user_id = ?',
        [first_name || null, last_name || null, phone || null, userId]
      );
    }

    const customerName = `${first_name || req.user.first_name} ${last_name || req.user.last_name}`;
    await pool.query(
      `UPDATE customers SET 
         customer_name = COALESCE(?, customer_name),
         phone = COALESCE(?, phone),
         company_name = COALESCE(?, company_name),
         address = COALESCE(?, address),
         city = COALESCE(?, city),
         state = COALESCE(?, state),
         postal_code = COALESCE(?, postal_code),
         country = COALESCE(?, country)
       WHERE user_id = ? OR email = ?`,
      [customerName, phone || null, company_name || null, address || null, city || null, state || null, postal_code || null, country || null, userId, req.user.email]
    );

    return successResponse(res, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomerProfile,
  getCustomerRequests,
  createCustomerRequest,
  updateCustomerRequest,
  updateCustomerProfile
};
