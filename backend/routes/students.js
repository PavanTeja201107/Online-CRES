const express = require('express');
const router = express.Router();
// Student-facing endpoints (profile, preferences)
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/studentController');

router.get('/me', verifyToken, requireRole('STUDENT'), ctrl.getMe);

module.exports = router;
