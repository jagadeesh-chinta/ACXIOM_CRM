const { body, param } = require('express-validator');
const validate = require('./validate');

const validTypes = ['CALL', 'MEETING', 'EMAIL', 'DEMO'];
const validStatuses = ['PLANNED', 'COMPLETED', 'MISSED', 'CANCELLED'];

const createFollowupRules = [
  body('followup_date')
    .notEmpty().withMessage('Follow-up date & time is required.')
    .isISO8601().withMessage('Follow-up date must be a valid date.')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      // Allow a small buffer of 5 minutes for clock drift
      today.setMinutes(today.getMinutes() - 5);
      if (inputDate < today) {
        throw new Error('New planned follow-up date cannot be earlier than today.');
      }
      return true;
    }),
  body('followup_type')
    .notEmpty().withMessage('Follow-up type is required.')
    .isIn(validTypes).withMessage(`Follow-up type must be one of: ${validTypes.join(', ')}`),
  body('remarks')
    .optional()
    .trim(),
  body('customer_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Customer ID must be a positive integer.'),
  body('lead_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Lead ID must be a positive integer.')
];

const updateFollowupRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid Follow-up ID is required.'),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`),
  body('followup_date')
    .optional()
    .isISO8601().withMessage('Follow-up date must be a valid date.')
];

module.exports = {
  validateCreateFollowup: validate(createFollowupRules),
  validateUpdateFollowup: validate(updateFollowupRules)
};
