const { body, param } = require('express-validator');
const validate = require('./validate');

const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'];
const validPriorities = ['HOT', 'WARM', 'COLD'];

const createLeadRules = [
  body('lead_name')
    .trim()
    .notEmpty().withMessage('Lead Name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Lead Name must be 2 to 150 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Lead Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage('Enter a valid phone number.'),
  body('company_name')
    .optional()
    .trim(),
  body('source')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`),
  body('priority')
    .optional()
    .isIn(validPriorities).withMessage(`Priority must be one of: ${validPriorities.join(', ')}`),
  body('expected_value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Expected Value must be a non-negative number.')
];

const updateLeadRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid Lead ID is required.'),
  body('lead_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Lead Name cannot be empty.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Enter a valid email address.'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage('Enter a valid phone number.'),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`),
  body('priority')
    .optional()
    .isIn(validPriorities).withMessage(`Priority must be one of: ${validPriorities.join(', ')}`),
  body('expected_value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Expected Value must be a non-negative number.')
];

module.exports = {
  validateCreateLead: validate(createLeadRules),
  validateUpdateLead: validate(updateLeadRules)
};
