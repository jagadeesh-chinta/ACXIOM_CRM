const { body, param } = require('express-validator');
const validate = require('./validate');

const validStages = ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const validStatuses = ['OPEN', 'WON', 'LOST'];

const createOpportunityRules = [
  body('opportunity_name')
    .trim()
    .notEmpty().withMessage('Opportunity Name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Opportunity Name must be 2 to 150 characters.'),
  body('customer_id')
    .notEmpty().withMessage('Customer selection is required.')
    .isInt({ min: 1 }).withMessage('Valid Customer ID is required.'),
  body('amount')
    .notEmpty().withMessage('Opportunity Amount is required.')
    .isFloat({ gt: 0 }).withMessage('Opportunity Amount must be greater than 0.'),
  body('probability')
    .notEmpty().withMessage('Win Probability is required.')
    .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100.'),
  body('expected_close_date')
    .notEmpty().withMessage('Expected Close Date is required.')
    .isISO8601().withMessage('Expected Close Date must be a valid date.')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        throw new Error('Expected Close Date cannot be in the past for active opportunities.');
      }
      return true;
    }),
  body('stage')
    .optional()
    .isIn(validStages).withMessage(`Stage must be one of: ${validStages.join(', ')}`),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
];

const updateOpportunityRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid Opportunity ID is required.'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Opportunity Amount must be greater than 0.'),
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100.'),
  body('stage')
    .optional()
    .isIn(validStages).withMessage(`Stage must be one of: ${validStages.join(', ')}`),
  body('status')
    .optional()
    .isIn(validStatuses).withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
];

module.exports = {
  validateCreateOpportunity: validate(createOpportunityRules),
  validateUpdateOpportunity: validate(updateOpportunityRules)
};
