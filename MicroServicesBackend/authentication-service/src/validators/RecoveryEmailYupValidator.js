const yup = require("yup");

const RecoveryEmailYupValidator = async (req, res, next) => {
    try {
        const Schema = yup.object().shape({
            email: yup.string().email().required('Email is required'),
            SecondEmail: yup.string().email()
                .matches(/^[A-Za-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid recovery email address')
                .test('recoveryEmailTest', 'Recovery email must be different from the main email', function (value) {
                    if (!value || !this.parent.email) {
                        return true;
                    }
                    return value.trim().toLowerCase() !== this.parent.email.trim().toLowerCase();
                })
        });
        await Schema.validate(req.body);
        next();
    } catch (error) {
        res.status(400).json({ error: error.errors });
    }
};

module.exports = RecoveryEmailYupValidator;
