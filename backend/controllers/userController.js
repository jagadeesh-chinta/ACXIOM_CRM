const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditService');

/**
 * Get all users with role filtering & status
 */
const getUsers = async (req, res, next) => {
  try {
    const { roleId = '', status = '', search = '' } = req.query;
    const params = [];
    const whereConditions = [];

    if (roleId) {
      whereConditions.push('u.role_id = ?');
      params.push(roleId);
    }

    if (status) {
      whereConditions.push('u.status = ?');
      params.push(status);
    }

    if (search.trim()) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)');
      const wild = `%${search.trim()}%`;
      params.push(wild, wild, wild, wild);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone,
             u.status, u.failed_login_attempts, u.lock_until, u.department,
             u.last_login_at, u.created_at, r.role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const [users] = await pool.query(query, params);

    return successResponse(res, 'Users retrieved successfully.', users);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all available roles
 */
const getRoles = async (req, res, next) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY role_id ASC');
    return successResponse(res, 'Roles retrieved successfully.', roles);
  } catch (err) {
    next(err);
  }
};

/**
 * Create user (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role_id, phone, department = 'Sales' } = req.body;

    // Check duplicate email
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'Email is already registered.', { email: 'Duplicate email' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, status, department)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [role_id, first_name, last_name, email, phone || null, passwordHash, department]
    );

    const newUserId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: 'CREATE',
      entityName: 'USER',
      recordId: newUserId,
      newValue: { email, role_id, first_name, last_name, department },
      req
    });

    const [newUser] = await pool.query(
      `SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone, u.status, u.department, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [newUserId]
    );

    return successResponse(res, 'User created successfully.', newUser[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update user details & role
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role_id, phone, department } = req.body;

    const [current] = await pool.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (current.length === 0) {
      return errorResponse(res, 'User not found.', null, 404);
    }

    const oldRecord = current[0];

    // Check duplicate email if changed
    if (email && email !== oldRecord.email) {
      const [dup] = await pool.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, id]);
      if (dup.length > 0) {
        return errorResponse(res, 'Email already in use.', { email: 'Duplicate email' }, 409);
      }
    }

    await pool.query(
      `UPDATE users SET
         first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         email = COALESCE(?, email),
         role_id = COALESCE(?, role_id),
         phone = COALESCE(?, phone),
         department = COALESCE(?, department)
       WHERE user_id = ?`,
      [first_name || null, last_name || null, email || null, role_id || null, phone || null, department || null, id]
    );

    if (role_id && role_id !== oldRecord.role_id) {
      await logAudit({
        userId: req.user.user_id,
        action: 'ROLE_CHANGE',
        entityName: 'USER',
        recordId: id,
        oldValue: { role_id: oldRecord.role_id },
        newValue: { role_id },
        req
      });
    }

    const [updated] = await pool.query(
      `SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone, u.status, u.department, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [id]
    );

    await logAudit({
      userId: req.user.user_id,
      action: 'UPDATE',
      entityName: 'USER',
      recordId: id,
      oldValue: { first_name: oldRecord.first_name, last_name: oldRecord.last_name, email: oldRecord.email },
      newValue: updated[0],
      req
    });

    return successResponse(res, 'User updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Change user status (ACTIVE, INACTIVE, LOCKED) or unlock
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'LOCKED'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be ACTIVE, INACTIVE, or LOCKED.', null, 400);
    }

    const [user] = await pool.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (user.length === 0) {
      return errorResponse(res, 'User not found.', null, 404);
    }

    // If setting to ACTIVE, reset failed attempts and unlock
    if (status === 'ACTIVE') {
      await pool.query(
        'UPDATE users SET status = "ACTIVE", failed_login_attempts = 0, lock_until = NULL WHERE user_id = ?',
        [id]
      );
    } else {
      await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, id]);
    }

    await logAudit({
      userId: req.user.user_id,
      action: 'STATUS_CHANGE',
      entityName: 'USER',
      recordId: id,
      oldValue: { status: user[0].status },
      newValue: { status },
      req
    });

    return successResponse(res, `User status updated to ${status}.`);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin Reset Password
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', null, 400);
    }

    const [user] = await pool.query('SELECT email FROM users WHERE user_id = ?', [id]);
    if (user.length === 0) {
      return errorResponse(res, 'User not found.', null, 404);
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, failed_login_attempts = 0, lock_until = NULL, status = "ACTIVE" WHERE user_id = ?',
      [passwordHash, id]
    );

    await logAudit({
      userId: req.user.user_id,
      action: 'PASSWORD_RESET',
      entityName: 'USER',
      recordId: id,
      newValue: { reset_by: req.user.email, target_user: user[0].email },
      req
    });

    return successResponse(res, `Password for user ${user[0].email} has been reset successfully.`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword
};
