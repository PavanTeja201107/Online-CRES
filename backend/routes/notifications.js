const express = require('express');
const router = express.Router();
// Notifications endpoints derived from elections for students
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/notificationsController');

router.get('/mine', verifyToken, requireRole('STUDENT'), ctrl.getMyNotifications);

module.exports = router;
