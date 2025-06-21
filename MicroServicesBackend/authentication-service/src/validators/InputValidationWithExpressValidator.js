const { body, validationResult } = require('express-validator');

const inputValidatorExpress = [
  body('fullName')
    .notEmpty().withMessage('Fullname is required')
    .isLength({ min: 3 }).withMessage('Fullname must be at least 3 characters long')
    .matches(/^[A-Za-z\s]+$/).withMessage('Fullname must contain only letters and spaces')
    .matches(/^[A-Za-zÀ-ÿ\s'-]{3,}$/)
    .withMessage('Fullname cannot contain special characters or digits'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password should be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password should contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password should contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password should contain at least one number'),

  body('retypePassword')
    .notEmpty().withMessage('Retype password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),

  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 8, max: 8 }).withMessage('Phone number must contain exactly 8 digits')
    .isNumeric().withMessage('Phone number must contain only digits'),

  body('address')
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 4 }).withMessage('Address must be at least 4 characters long')
    .matches(/^[A-Za-z0-9\s]+$/).withMessage('Address must contain only letters, digits, and spaces, and no special characters')
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  inputValidatorExpress,
  handleValidation,
};
