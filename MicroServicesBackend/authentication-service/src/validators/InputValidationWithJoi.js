const Joi = require('joi');

const schema = Joi.object({
  fullName: Joi.string()
    .pattern(/^[A-Za-z\s]+$/)
    .pattern(/^[A-Za-zÀ-ÿ\s'-]{3,}$/)
    .min(3)
    .required()
    .messages({
      'string.pattern.base': 'Fullname must contain only letters and spaces and cannot contain special characters or digits',
      'string.min': 'Fullname must be at least 3 characters long',
      'any.required': 'Fullname is required'
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  phone: Joi.string()
    .pattern(/^\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must contain exactly 8 digits',
      'any.required': 'Phone number is required'
    }),
  address: Joi.string()
    .pattern(/^[A-Za-z0-9\s]+$/)
    .min(4)
    .required()
    .messages({
      'string.pattern.base': 'Address must contain only letters, digits, and spaces. Special characters are not allowed.',
      'string.min': 'Address must be at least 4 characters long',
      'any.required': 'Address is required'
    }),
  role: Joi.string().valid('artisan','habitant', 'account_manager').required(),
  cin: Joi.string()
    .pattern(/^\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'CIN must contain exactly 8 digits',
      'any.required': 'Cin is required'
    }),

});

const inputValidatorJoi = (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    console.log(error) 
    return res.status(400).json({ error: error.details.map(err => err.message) });
     }
  next();
};

module.exports = inputValidatorJoi;
