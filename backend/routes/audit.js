const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/auditController');

/*
 * Audit routes
 *
 * Purpose:
 * Expose audit log endpoints for administrators to view recorded actions.
 *
 * Parameters/Return:
 * Uses auth middleware; exports an Express router.
 */

router.get('/', verifyToken, requireRole('ADMIN'), ctrl.listAudit);

module.exports = router;
