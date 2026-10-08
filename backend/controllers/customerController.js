const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateCode } = require('../utils/codeGenerator');
const { logAudit } = require('../services/auditService');

/**
 * Get customers with search, filtering, pagination, and role-based data scoping
 */
const getCustomers = async (req, res, next) => {
  try {
    const {
      search = '',
      status = '',
      assignedTo = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const whereConditions = [];

    // Role-based visibility enforcement
    if (req.user.role_name === 'CUSTOMER') {
      whereConditions.push('(c.user_id = ? OR c.email = ?)');
      params.push(req.user.user_id, req.user.email);
    } else if (req.user.role_name === 'SALES_EXECUTIVE') {
      whereConditions.push('(c.assigned_to = ? OR c.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    // Search filter
    if (search.trim()) {
      whereConditions.push('(c.customer_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company_name LIKE ? OR c.customer_code LIKE ?)');
      const searchWild = `%${search.trim()}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    // Status filter
    if (status) {
      whereConditions.push('c.status = ?');
      params.push(status);
    }

    // Assigned filter
    if (assignedTo && (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER')) {
      whereConditions.push('c.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total query
    const countQuery = `SELECT COUNT(*) as total FROM customers c ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Allowed sort columns
    const allowedSortColumns = ['customer_id', 'customer_code', 'customer_name', 'email', 'company_name', 'created_at', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? `c.${sortBy}` : 'c.created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Data query
    const dataQuery = `
      SELECT c.*, 
             u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name,
             u_create.first_name as creator_first_name, u_create.last_name as creator_last_name,
             (SELECT COUNT(*) FROM opportunities o WHERE o.customer_id = c.customer_id) as opportunities_count,
             (SELECT COUNT(*) FROM followups f WHERE f.customer_id = c.customer_id) as followups_count
      FROM customers c
      LEFT JOIN users u_assign ON c.assigned_to = u_assign.user_id
      LEFT JOIN users u_create ON c.created_by = u_create.user_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [customers] = await pool.query(dataQuery, queryParams);

    return successResponse(res, 'Customers retrieved successfully.', {
      customers,
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
 * Get single customer details with linked opportunities, follow-ups, activities
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT c.*, 
              u_assign.first_name as assigned_first_name, u_assign.last_name as assigned_last_name, u_assign.email as assigned_email,
              u_create.first_name as creator_first_name, u_create.last_name as creator_last_name
       FROM customers c
       LEFT JOIN users u_assign ON c.assigned_to = u_assign.user_id
       LEFT JOIN users u_create ON c.created_by = u_create.user_id
       WHERE c.customer_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Customer not found.', null, 404);
    }

    const customer = rows[0];

    // Role check: sales executive can only view assigned, customer can only view own
    if (req.user.role_name === 'CUSTOMER' && customer.user_id !== req.user.user_id && customer.email !== req.user.email) {
      return errorResponse(res, 'Unauthorized to view this customer record.', null, 403);
    }

    if (req.user.role_name === 'SALES_EXECUTIVE' && customer.assigned_to !== req.user.user_id && customer.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized: record is not assigned to you.', null, 403);
    }

    // Fetch related records
    const [opportunities] = await pool.query(
      `SELECT o.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM opportunities o
       LEFT JOIN users u ON o.assigned_to = u.user_id
       WHERE o.customer_id = ? ORDER BY o.created_at DESC`,
      [id]
    );

    const [followups] = await pool.query(
      `SELECT f.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM followups f
       LEFT JOIN users u ON f.assigned_to = u.user_id
       WHERE f.customer_id = ? ORDER BY f.followup_date DESC`,
      [id]
    );

    const [activities] = await pool.query(
      `SELECT a.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM activities a
       LEFT JOIN users u ON a.assigned_to = u.user_id
       WHERE a.customer_id = ? ORDER BY a.activity_date DESC`,
      [id]
    );

    const [requests] = await pool.query(
      `SELECT r.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM customer_requests r
       LEFT JOIN users u ON r.assigned_to = u.user_id
       WHERE r.customer_id = ? ORDER BY r.created_at DESC`,
      [id]
    );

    return successResponse(res, 'Customer details retrieved.', {
      customer,
      opportunities,
      followups,
      activities,
      requests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Customer with duplicate verification & code generation
 */
const createCustomer = async (req, res, next) => {
  try {
    const {
      customer_name,
      email,
      phone,
      company_name,
      address,
      city,
      state,
      postal_code,
      country = 'USA',
      status = 'ACTIVE',
      assigned_to
    } = req.body;

    // Check duplicate email
    const [existingEmail] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return errorResponse(res, 'A customer with this email already exists.', { email: 'Duplicate email detected' }, 409);
    }

    // Check duplicate phone
    const [existingPhone] = await pool.query('SELECT customer_id FROM customers WHERE phone = ?', [phone]);
    if (existingPhone.length > 0) {
      return errorResponse(res, 'A customer with this phone number already exists.', { phone: 'Duplicate phone detected' }, 409);
    }

    const customerCode = await generateCode('CUST', 'customers', 'customer_code');
    const createdBy = req.user.user_id;
    // Default assignment: if provided (Admin/Manager) use that, otherwise assign to creator
    const targetAssignedTo = assigned_to || req.user.user_id;

    const query = `
      INSERT INTO customers 
      (customer_code, customer_name, email, phone, company_name, address, city, state, postal_code, country, status, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      customerCode,
      customer_name,
      email,
      phone,
      company_name || null,
      address || null,
      city || null,
      state || null,
      postal_code || null,
      country,
      status,
      createdBy,
      targetAssignedTo
    ]);

    const newCustomerId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'CREATE',
      entityName: 'CUSTOMER',
      recordId: newCustomerId,
      newValue: { customer_name, email, phone, company_name, customer_code: customerCode },
      req
    });

    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [newCustomerId]);

    return successResponse(res, 'Customer created successfully.', newCustomer[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Customer
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      email,
      phone,
      company_name,
      address,
      city,
      state,
      postal_code,
      country,
      status,
      assigned_to
    } = req.body;

    const [current] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'Customer not found.', null, 404);
    }

    const oldRecord = current[0];

    // Role ownership check
    if (req.user.role_name === 'SALES_EXECUTIVE' && oldRecord.assigned_to !== req.user.user_id && oldRecord.created_by !== req.user.user_id) {
      return errorResponse(res, 'Unauthorized to update this customer.', null, 403);
    }
    if (req.user.role_name === 'CUSTOMER') {
      return errorResponse(res, 'Customers cannot edit enterprise customer records.', null, 403);
    }

    // Check duplicate email if changed
    if (email && email !== oldRecord.email) {
      const [dupEmail] = await pool.query('SELECT customer_id FROM customers WHERE email = ? AND customer_id != ?', [email, id]);
      if (dupEmail.length > 0) {
        return errorResponse(res, 'Email is already used by another customer.', { email: 'Duplicate email' }, 409);
      }
    }

    // Check duplicate phone if changed
    if (phone && phone !== oldRecord.phone) {
      const [dupPhone] = await pool.query('SELECT customer_id FROM customers WHERE phone = ? AND customer_id != ?', [phone, id]);
      if (dupPhone.length > 0) {
        return errorResponse(res, 'Phone is already used by another customer.', { phone: 'Duplicate phone' }, 409);
      }
    }

    const updateQuery = `
      UPDATE customers SET
        customer_name = COALESCE(?, customer_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        company_name = COALESCE(?, company_name),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        postal_code = COALESCE(?, postal_code),
        country = COALESCE(?, country),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to)
      WHERE customer_id = ?
    `;

    // Only Admin & Manager can re-assign
    const newAssignedTo = (req.user.role_name === 'ADMIN' || req.user.role_name === 'MANAGER') && assigned_to !== undefined
      ? assigned_to
      : oldRecord.assigned_to;

    await pool.query(updateQuery, [
      customer_name || null,
      email || null,
      phone || null,
      company_name || null,
      address || null,
      city || null,
      state || null,
      postal_code || null,
      country || null,
      status || null,
      newAssignedTo,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE',
      entityName: 'CUSTOMER',
      recordId: id,
      oldValue: oldRecord,
      newValue: updated[0],
      req
    });

    return successResponse(res, 'Customer updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Customer
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only ADMIN or MANAGER can delete
    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Permission denied: Only Administrators and Managers can delete customers.', null, 403);
    }

    const [existing] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Customer not found.', null, 404);
    }

    await pool.query('DELETE FROM customers WHERE customer_id = ?', [id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'DELETE',
      entityName: 'CUSTOMER',
      recordId: id,
      oldValue: existing[0],
      req
    });

    return successResponse(res, 'Customer deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
