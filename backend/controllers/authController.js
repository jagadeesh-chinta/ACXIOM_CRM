const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { jwtSecret, jwtExpiresIn, maxFailedLogins, lockoutTimeMinutes } = require('../config');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateCode } = require('../utils/codeGenerator');
const { logAudit } = require('../services/auditService');

/**
 * User Login with failed attempt tracking and account lockout
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const query = `
      SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone,
             u.password_hash, u.status, u.failed_login_attempts, u.lock_until,
             u.department, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ?
    `;

    const [users] = await pool.query(query, [email]);

    if (!users || users.length === 0) {
      // Record failed login audit with anonymous email
      await logAudit({
        action: 'FAILED_LOGIN',
        entityName: 'USER',
        newValue: { reason: 'User not found', attemptedEmail: email },
        req
      });
      return errorResponse(res, 'Invalid email or password.', null, 401);
    }

    const user = users[0];

    // Check if account is locked
    if (user.status === 'LOCKED') {
      const lockUntil = user.lock_until ? new Date(user.lock_until) : null;
      const now = new Date();

      if (lockUntil && lockUntil > now) {
        const remainingMinutes = Math.ceil((lockUntil - now) / (60 * 1000));
        await logAudit({
          userId: user.user_id,
          action: 'FAILED_LOGIN',
          entityName: 'USER',
          recordId: user.user_id,
          newValue: { reason: 'Account currently locked', remainingMinutes },
          req
        });
        return errorResponse(
          res,
          `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
          { locked: true, remainingMinutes },
          403
        );
      } else {
        // Lock expired, unlock automatically
        await pool.query(
          `UPDATE users SET status = 'ACTIVE', failed_login_attempts = 0, lock_until = NULL WHERE user_id = ?`,
          [user.user_id]
        );
        user.status = 'ACTIVE';
        user.failed_login_attempts = 0;
      }
    }

    if (user.status === 'INACTIVE') {
      return errorResponse(res, 'Your account is deactivated. Please contact an administrator.', null, 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const nextAttempts = (user.failed_login_attempts || 0) + 1;
      let shouldLock = nextAttempts >= maxFailedLogins;

      if (shouldLock) {
        const lockDurationSql = `DATE_ADD(NOW(), INTERVAL ${lockoutTimeMinutes} MINUTE)`;
        await pool.query(
          `UPDATE users SET failed_login_attempts = ?, status = 'LOCKED', lock_until = ${lockDurationSql} WHERE user_id = ?`,
          [nextAttempts, user.user_id]
        );

        await logAudit({
          userId: user.user_id,
          action: 'ACCOUNT_LOCKOUT',
          entityName: 'USER',
          recordId: user.user_id,
          newValue: { reason: 'Exceeded max failed logins', attempts: nextAttempts },
          req
        });

        return errorResponse(
          res,
          `Too many failed login attempts. Your account is locked for ${lockoutTimeMinutes} minutes.`,
          { locked: true, lockoutTimeMinutes },
          403
        );
      } else {
        await pool.query(
          `UPDATE users SET failed_login_attempts = ? WHERE user_id = ?`,
          [nextAttempts, user.user_id]
        );

        await logAudit({
          userId: user.user_id,
          action: 'FAILED_LOGIN',
          entityName: 'USER',
          recordId: user.user_id,
          newValue: { reason: 'Incorrect password', attempts: nextAttempts },
          req
        });

        const attemptsLeft = maxFailedLogins - nextAttempts;
        return errorResponse(
          res,
          `Invalid email or password. You have ${attemptsLeft} attempt(s) remaining before account lockout.`,
          { attemptsLeft },
          401
        );
      }
    }

    // Password is valid - reset attempts and update last_login_at
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, lock_until = NULL, last_login_at = NOW() WHERE user_id = ?`,
      [user.user_id]
    );

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role_name
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // Audit log
    await logAudit({
      userId: user.user_id,
      action: 'LOGIN',
      entityName: 'USER',
      recordId: user.user_id,
      newValue: { role: user.role_name, email: user.email },
      req
    });

    const sanitizedUser = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role_name: user.role_name,
      role_id: user.role_id
    };

    return successResponse(res, 'Authentication successful.', {
      token,
      user: sanitizedUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public User Registration
 */
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, company_name } = req.body;

    // Check if email already exists
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'An account with this email address already exists.', { email: 'Email already registered' }, 409);
    }

    // Default public registration gets CUSTOMER role (id 4)
    const roleId = 4;
    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, status, department)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 'Client Services')`,
      [roleId, first_name, last_name, email, phone || null, passwordHash]
    );

    const newUserId = userResult.insertId;

    // Always create or link customer profile record for CUSTOMER role with unique code
    const customerCode = await generateCode('CUST', 'customers', 'customer_code');
    await pool.query(
      `INSERT INTO customers (customer_code, customer_name, email, phone, company_name, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), customer_name = VALUES(customer_name)`,
      [customerCode, `${first_name} ${last_name}`, email, phone || `+1-555-${newUserId}000`, company_name || `${first_name}'s Organization`, newUserId]
    );

    await logAudit({
      userId: newUserId,
      action: 'REGISTER',
      entityName: 'USER',
      recordId: newUserId,
      newValue: { email, role: 'CUSTOMER' },
      req
    });

    const token = jwt.sign(
      { userId: newUserId, email, role: 'CUSTOMER' },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return successResponse(
      res,
      'Registration successful. Welcome to AcxiomCRM.',
      {
        token,
        user: {
          user_id: newUserId,
          first_name,
          last_name,
          email,
          phone,
          role_name: 'CUSTOMER',
          role_id: roleId
        }
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.user_id,
        action: 'LOGOUT',
        entityName: 'USER',
        recordId: req.user.user_id,
        req
      });
    }
    return successResponse(res, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * Get Current User Profile
 */
const getCurrentUser = async (req, res) => {
  return successResponse(res, 'User session verified.', { user: req.user });
};

/**
 * Password Reset / Forgot Password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email is required.', null, 400);
    }

    const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (user.length > 0) {
      await logAudit({
        userId: user[0].user_id,
        action: 'PASSWORD_RESET_REQUEST',
        entityName: 'USER',
        recordId: user[0].user_id,
        req
      });
    }

    // Always return success message to prevent user enumeration
    return successResponse(
      res,
      'If an account exists with that email, a password recovery link has been generated.'
    );
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password || new_password.length < 6) {
      return errorResponse(res, 'Email and new password (min 6 chars) are required.', null, 400);
    }

    const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return errorResponse(res, 'User not found.', null, 404);
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ?, failed_login_attempts = 0, lock_until = NULL, status = "ACTIVE" WHERE user_id = ?', [
      passwordHash,
      user[0].user_id
    ]);

    await logAudit({
      userId: user[0].user_id,
      action: 'PASSWORD_RESET',
      entityName: 'USER',
      recordId: user[0].user_id,
      req
    });

    return successResponse(res, 'Password updated successfully. You can now log in.');
  } catch (err) {
    next(err);
  }
};

/**
 * Check if Master Administrator exists in the database
 */
const getAdminStatus = async (req, res, next) => {
  try {
    const [[result]] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN')"
    );
    const adminExists = (result.count || 0) > 0;
    return successResponse(res, 'Admin status retrieved.', {
      adminExists,
      adminCount: result.count
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Master Administrator Registration - ONLY ONE ADMIN ALLOWED
 */
const registerAdmin = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, department } = req.body;

    // Check if an admin already exists (strictly single admin permitted)
    const [[adminCheck]] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN')"
    );
    if ((adminCheck.count || 0) > 0) {
      return errorResponse(
        res,
        'An Administrator account has already been registered. Only a single master administrator account is permitted in AcxiomCRM.',
        { adminExists: true },
        403
      );
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'An account with this email address already exists.', { email: 'Email already registered' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, status, department)
       VALUES (1, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [first_name, last_name, email, phone || null, passwordHash, department || 'Executive Leadership']
    );

    const newUserId = userResult.insertId;

    await logAudit({
      userId: newUserId,
      action: 'REGISTER_ADMIN',
      entityName: 'USER',
      recordId: newUserId,
      newValue: { email, role: 'ADMIN' },
      req
    });

    const token = jwt.sign(
      { userId: newUserId, email, role: 'ADMIN' },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return successResponse(
      res,
      'Master Administrator account initialized successfully.',
      {
        token,
        user: {
          user_id: newUserId,
          first_name,
          last_name,
          email,
          phone,
          department: department || 'Executive Leadership',
          role_name: 'ADMIN',
          role_id: 1
        }
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Manager Portal Registration
 */
const registerManager = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, department } = req.body;

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'An account with this email address already exists.', { email: 'Email already registered' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, status, department)
       VALUES (2, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [first_name, last_name, email, phone || null, passwordHash, department || 'Sales Management']
    );

    const newUserId = userResult.insertId;

    await logAudit({
      userId: newUserId,
      action: 'REGISTER_MANAGER',
      entityName: 'USER',
      recordId: newUserId,
      newValue: { email, role: 'MANAGER' },
      req
    });

    const token = jwt.sign(
      { userId: newUserId, email, role: 'MANAGER' },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return successResponse(
      res,
      'Manager account created successfully.',
      {
        token,
        user: {
          user_id: newUserId,
          first_name,
          last_name,
          email,
          phone,
          department: department || 'Sales Management',
          role_name: 'MANAGER',
          role_id: 2
        }
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Sales Executive Portal Registration
 */
const registerSalesExec = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, department } = req.body;

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'An account with this email address already exists.', { email: 'Email already registered' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, status, department)
       VALUES (3, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [first_name, last_name, email, phone || null, passwordHash, department || 'Enterprise Sales']
    );

    const newUserId = userResult.insertId;

    await logAudit({
      userId: newUserId,
      action: 'REGISTER_SALES_EXEC',
      entityName: 'USER',
      recordId: newUserId,
      newValue: { email, role: 'SALES_EXECUTIVE' },
      req
    });

    const token = jwt.sign(
      { userId: newUserId, email, role: 'SALES_EXECUTIVE' },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return successResponse(
      res,
      'Sales Executive account created successfully.',
      {
        token,
        user: {
          user_id: newUserId,
          first_name,
          last_name,
          email,
          phone,
          department: department || 'Enterprise Sales',
          role_name: 'SALES_EXECUTIVE',
          role_id: 3
        }
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Public Dynamic Stats - Real Database Counts for Landing Page and Features
 */
const getPublicStats = async (req, res, next) => {
  try {
    const [[customers]] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [[leads]] = await pool.query('SELECT COUNT(*) as count FROM leads');
    const [[opps]] = await pool.query('SELECT COUNT(*) as count FROM opportunities');
    const [[wonOpps]] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_won FROM opportunities WHERE status = "WON"');
    const [[pipeline]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_pipeline FROM opportunities WHERE status = "OPEN"');
    const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[managers]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 2');
    const [[salesExecs]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 3');
    const [[customerUsers]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 4');
    const [[followups]] = await pool.query('SELECT COUNT(*) as count FROM followups');
    const [[activities]] = await pool.query('SELECT COUNT(*) as count FROM activities');

    return successResponse(res, 'Live dynamic CRM statistics.', {
      totalCustomers: customers.count,
      totalLeads: leads.count,
      totalOpportunities: opps.count,
      wonDealsCount: wonOpps.count,
      totalWonRevenue: Number(wonOpps.total_won),
      totalPipelineValue: Number(pipeline.total_pipeline),
      totalUsers: users.count,
      totalManagers: managers.count,
      totalSalesExecs: salesExecs.count,
      totalCustomerUsers: customerUsers.count,
      totalFollowups: followups.count,
      totalActivities: activities.count,
      database: 'acxiomcrm (Live MySQL Connected)'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Profile for logged-in user (Any Role)
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, phone, department, company_name } = req.body;

    if (req.user.role_name === 'CUSTOMER' && phone) {
      const [existingPhone] = await pool.query(
        'SELECT customer_id FROM customers WHERE phone = ? AND user_id != ? AND email != ?',
        [phone, userId, req.user.email]
      );
      if (existingPhone.length > 0) {
        return errorResponse(res, 'This phone number is already registered to another customer account.', null, 409);
      }
    }

    await pool.query(
      `UPDATE users SET 
         first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         phone = COALESCE(?, phone),
         department = COALESCE(?, department)
       WHERE user_id = ?`,
      [first_name || null, last_name || null, phone || null, department || null, userId]
    );

    // If customer, also sync customer record
    if (req.user.role_name === 'CUSTOMER') {
      const custName = `${first_name || req.user.first_name} ${last_name || req.user.last_name}`;
      await pool.query(
        `UPDATE customers SET 
           customer_name = COALESCE(?, customer_name),
           phone = COALESCE(?, phone),
           company_name = COALESCE(?, company_name)
         WHERE user_id = ? OR email = ?`,
        [custName, phone || null, company_name || null, userId, req.user.email]
      );
    }

    const [updatedUsers] = await pool.query(
      `SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone,
              u.status, u.department, r.role_name, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    await logAudit({
      userId,
      action: 'UPDATE_PROFILE',
      entityName: 'USER',
      recordId: userId,
      newValue: updatedUsers[0],
      req
    });

    return successResponse(res, 'Profile updated successfully.', updatedUsers[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Permanently Delete Account (Self-Service)
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    await logAudit({
      userId,
      action: 'ACCOUNT_DELETED',
      entityName: 'USER',
      recordId: userId,
      newValue: { email: req.user.email, role: req.user.role_name },
      req
    });

    // Clean up references and delete user
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    await pool.query('UPDATE customers SET user_id = NULL WHERE user_id = ?', [userId]);
    await pool.query('UPDATE customers SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('UPDATE opportunities SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('UPDATE followups SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('UPDATE activities SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('DELETE FROM customer_requests WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);

    return successResponse(res, 'Your account has been permanently deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  getAdminStatus,
  registerAdmin,
  registerManager,
  registerSalesExec,
  getPublicStats,
  updateProfile,
  deleteAccount
};
