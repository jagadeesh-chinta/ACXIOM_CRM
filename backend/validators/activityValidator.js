const { body, param } = require('express-validator');
const validate = require('./validate');

const validTypes = ['CALL', 'MEETING', 'EMAIL', 'TASK'];
const validStatuses = ['PLANNED', 'COMPLETED', 'CANCELLED'];

const createActivityRules = [
  body('activity_type')
    .notEmpty().withMessage('Activity type is required.')
    .isIn(validTypes).withMessage(`Activity type must be one of: ${validTypes.join(', ')}`),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required.')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be 2 to 200 characters.'),
  body('activity_date')
    .notEmpty().withMessage('Activity date is required.')
    .isISO8601().withMessage('Activity date must be a valid ISO date.'),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
];

const updateActivityRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid Activity ID is required.'),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
];

module.exports = {
  validateCreateActivity: validate(createActivityRules),
  validateUpdateActivity: validate(updateActivityRules)
};
