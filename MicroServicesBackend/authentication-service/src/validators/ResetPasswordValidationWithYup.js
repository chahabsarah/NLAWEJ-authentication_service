const yup = require("yup");


const ResetPasswordValidationYup = async (req, res, next) => {
    try {
        const Schema = yup.object().shape({
            newPassword: yup.string()
                .required('newPassword is required')
                .min(8, 'newPassword should be at least 8 characters long')
                .matches(/[A-Z]/, 'newPassword should contain at least one uppercase letter')
                .matches(/[a-z]/, 'newPassword should contain at least one lowercase letter')
                .matches(/\d/, 'newPassword should contain at least one number'),
            currentPassword: yup.string()
                .required('currentPassword is required')
        });
        await Schema.validate(req.body);
        next();
    } catch (error) {
        res.status(400).json({ error: error.errors });
    }
};

module.exports = ResetPasswordValidationYup;