const { body, param } = require('express-validator');
const validate = require('./validate');

const createUserRules = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('First Name must be 2-100 characters.'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Last Name must be 2-100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role_id')
    .notEmpty().withMessage('Role selection is required.')
    .isInt({ min: 1, max: 4 }).withMessage('Valid role ID is required.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('department')
    .optional()
    .trim()
];

const updateUserRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid User ID is required.'),
  body('first_name')
    .optional()
    .trim()
    .notEmpty().withMessage('First Name cannot be empty.'),
  body('last_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Last Name cannot be empty.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('role_id')
    .optional()
    .isInt({ min: 1, max: 4 }).withMessage('Valid role ID is required.')
];

module.exports = {
  validateCreateUser: validate(createUserRules),
  validateUpdateUser: validate(updateUserRules)
};
