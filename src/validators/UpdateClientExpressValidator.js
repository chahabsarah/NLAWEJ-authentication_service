const { body, validationResult } = require('express-validator');

const updateClientValidatorExpress = [
  body('fullName')
    .notEmpty().withMessage('Fullname is required')
    .isLength({ min: 3 }).withMessage('Fullname must be at least 3 characters long')
    .matches(/^[A-Za-z\s]+$/).withMessage('Fullname must contain only letters and spaces')
    .matches(/^[^\d!@#$%^&*(),.?":{}|<>\/]+(\s[^\d!@#$%^&*(),.?":{}|<>\/]+)*$/)
    .withMessage('Fullname cannot contain special characters or digits'),
  body('phone')
    .isLength({ min: 8, max: 8 }).withMessage('Phone number must contain exactly 8 digits')
    .isNumeric().withMessage('Phone number must contain only digits'),
  body('address')
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 4 }).withMessage('Address must be at least 4 characters long')
    .matches(/^[A-Za-z0-9\s]+$/).withMessage('Address must contain only letters, digits, and spaces, and no special characters')
];

const handleUpdateClientValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  updateClientValidatorExpress,
  handleUpdateClientValidation,
};
