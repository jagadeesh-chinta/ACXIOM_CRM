const { errorResponse } = require('../utils/responseHelper');

/**
 * Centralized error handler
 * Never expose internal SQL errors, stack traces, or credentials in response!
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific MySQL duplicate entry error cleanly
  if (err.code === 'ER_DUP_ENTRY') {
    let field = 'record';
    if (err.message.includes('email')) field = 'Email';
    else if (err.message.includes('phone')) field = 'Phone number';
    else if (err.message.includes('customer_code')) field = 'Customer code';
    else if (err.message.includes('lead_code')) field = 'Lead code';
    else if (err.message.includes('opportunity_code')) field = 'Opportunity code';

    return errorResponse(res, `Duplicate entry: A record with this ${field} already exists.`, { field }, 409);
  }

  // Handle foreign key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(res, 'Database relational constraint violation.', null, 400);
  }

  // Standard safe response
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An internal server error occurred. Please contact support.';

  return errorResponse(res, message, null, statusCode);
};

module.exports = errorHandler;
