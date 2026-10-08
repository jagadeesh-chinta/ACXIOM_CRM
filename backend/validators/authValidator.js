const { body } = require('express-validator');
const validate = require('./validate');

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
];

const registerRules = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First Name must be 2-50 characters.'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last Name must be 2-50 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage('Enter a valid phone number.')
];

module.exports = {
  validateLogin: validate(loginRules),
  validateRegister: validate(registerRules)
};
