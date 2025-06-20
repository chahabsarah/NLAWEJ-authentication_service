const express = require('express');
const router = express.Router();
const passport = require("../config/passport");
const AuthController = require('../controllers/AuthController');
const {checkAdminRole} = require('../middlewares/RoleMiddleware');
const { authenticateUserByJwt } = require('../middlewares/JWT');
const inputValidatorJoi = require('../validators/InputValidationWithJoi');
const GoogleAuthenticator2FA = require('../config/GoogleAuthenticator2FA');
const ResetPasswordValidationYup = require('../validators/ResetPasswordValidationWithYup');

// Client and Admin Registration
router.post('/addUser', authenticateUserByJwt, checkAdminRole, inputValidatorJoi, AuthController.addUser);//✅
router.post('/signupadmin',AuthController.signUpAdmin);//✅
router.post('/signupuser', AuthController.registerClients);//✅


// Email Verification
router.post('/verifyEmail', AuthController.verifyEmail);//✅

// Login / Logout
router.post('/login', AuthController.login);//✅
router.post('/logout', AuthController.logout);//✅



// Password Handling
router.put('/resetPassword', authenticateUserByJwt,ResetPasswordValidationYup,AuthController.resetPassword);//✅
router.post('/forgetPassword', AuthController.resetForgetPassword);//✅



// Two-Factor Authentication (2FA)
router.post('/GetQrCode', authenticateUserByJwt, GoogleAuthenticator2FA.setup2FA);//✅

// OAuth with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));//✅
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login-failed' }), (req, res) => {
  res.json({ msg: "Login successful!", user: req.user });
});//✅

// OAuth with Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));//✅
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login-failed' }), (req, res) => {
  res.json({ msg: "Login successful!", user: req.user });
});//✅

// OAuth with GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));//✅
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login-failed' }), (req, res) => {
  res.json({ msg: "Login successful!", user: req.user });
});//✅

module.exports = router;
