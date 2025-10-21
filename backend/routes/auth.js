const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: process.env.NODE_ENV === 'production' ? 5 : 50,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => res.status(429).json({ error: 'Too many OTP attempts, try again later' })
});

// validators
const loginValidator = [
	body('studentId').isString().isLength({ min: 1 }).withMessage('studentId is required'),
	body('password').isString().isLength({ min: 6 }).withMessage('password must be at least 6 chars'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		next();
	}
];

const verifyOtpValidator = [
	body('studentId').isString().isLength({ min: 1 }).withMessage('studentId required'),
	body('otp').isString().isLength({ min: 4 }).withMessage('otp required'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		next();
	}
];

const resetValidator = [
	body('userId').isString().isLength({ min: 1 }).withMessage('userId required'),
	body('otp').isString().isLength({ min: 4 }).withMessage('otp required'),
	body('newPassword').isString().isLength({ min: 6 }).withMessage('newPassword at least 6 chars'),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		next();
	}
];

// routes
router.post('/admin/login', AuthController.adminLogin);
router.post('/login', loginValidator, AuthController.login);              // student login -> send OTP
router.post('/verify-otp', verifyOtpValidator, otpLimiter, AuthController.verifyOtp);     // verify OTP -> issue JWT + create session
// Protect change-password: must be authenticated (or change flow should use a one-time token)
router.post('/change-password', verifyToken, AuthController.changePassword);
// Apply OTP limiter to reset requests as well to prevent abuse
router.post('/request-reset', otpLimiter, AuthController.requestPasswordReset);
router.post('/reset-password', resetValidator, otpLimiter, AuthController.resetPassword);

// logout (invalidate session)
// Removed explicit logout endpoint (frontend clears token locally)

module.exports = router;
