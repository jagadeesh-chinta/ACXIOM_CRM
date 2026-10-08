const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHelper');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors nicely
    const extractedErrors = {};
    errors.array().forEach((err) => {
      if (!extractedErrors[err.path]) {
        extractedErrors[err.path] = err.msg;
      }
    });

    return errorResponse(res, 'Validation failed: Please check your input fields.', extractedErrors, 422);
  };
};

module.exports = validate;
