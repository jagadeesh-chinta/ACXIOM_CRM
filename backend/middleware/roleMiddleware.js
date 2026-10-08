const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware to restrict route access by role
 * @param  {...string} allowedRoles (e.g. 'ADMIN', 'MANAGER', 'SALES_EXECUTIVE', 'CUSTOMER')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before authorization.', null, 401);
    }

    const userRole = req.user.role_name;

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(
        res,
        `Access denied. Your role (${userRole}) is not permitted to perform this action.`,
        { requiredRoles: allowedRoles, currentRole: userRole },
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
