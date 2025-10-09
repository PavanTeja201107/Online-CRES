const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/login', AuthController.login);              // password + generate OTP and/or verify
router.post('/verify-otp', AuthController.verifyOtp);     // verify OTP -> issue JWT + create session
router.post('/change-password', AuthController.changePassword); // first-time password change
router.post('/request-reset', AuthController.requestPasswordReset); // send OTP to reset
router.post('/reset-password', AuthController.resetPassword); // reset via OTP

module.exports = router;
