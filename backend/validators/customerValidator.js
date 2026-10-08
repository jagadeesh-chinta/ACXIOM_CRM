const { body, param } = require('express-validator');
const validate = require('./validate');

const createCustomerRules = [
  body('customer_name')
    .trim()
    .notEmpty().withMessage('Customer Name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Customer Name must be between 2 and 150 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Customer Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage('Enter a valid phone number (e.g. +1-555-0199).'),
  body('company_name')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

const updateCustomerRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid customer ID is required.'),
  body('customer_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Customer Name cannot be empty.')
    .isLength({ min: 2, max: 150 }).withMessage('Customer Name must be 2 to 150 characters.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage('Enter a valid phone number.'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

module.exports = {
  validateCreateCustomer: validate(createCustomerRules),
  validateUpdateCustomer: validate(updateCustomerRules)
};
