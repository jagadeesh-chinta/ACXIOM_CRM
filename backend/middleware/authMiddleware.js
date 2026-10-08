const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { jwtSecret } = require('../config');
const { errorResponse } = require('../utils/responseHelper');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Authentication token required. Please sign in.', null, 401);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    const query = `
      SELECT u.user_id, u.role_id, u.first_name, u.last_name, u.email, u.phone, 
             u.status, u.department, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `;

    const [users] = await pool.query(query, [decoded.userId]);

    if (!users || users.length === 0) {
      return errorResponse(res, 'User session invalid. Please log in again.', null, 401);
    }

    const user = users[0];

    if (user.status === 'LOCKED') {
      return errorResponse(res, 'Your account is locked due to security policy. Please contact administrator.', null, 403);
    }

    if (user.status === 'INACTIVE') {
      return errorResponse(res, 'Your account has been deactivated. Please contact administrator.', null, 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session token expired. Please log in again.', null, 401);
    }
    return errorResponse(res, 'Invalid authentication token.', null, 401);
  }
};

module.exports = {
  authenticateToken
};
