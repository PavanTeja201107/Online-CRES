const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/policyController');

// Get both policies
router.get('/', verifyToken, ctrl.getPolicies);
// Accept a policy (requires policy_id)
router.post('/accept', verifyToken, ctrl.acceptPolicy);
// List policies (admin)
router.get('/all', verifyToken, requireRole('ADMIN'), ctrl.listPolicies);
// Update policy (admin)
router.put('/update', verifyToken, requireRole('ADMIN'), ctrl.updatePolicy);
// Block create/delete
router.post('/', verifyToken, requireRole('ADMIN'), ctrl.createPolicy);
router.delete('/:id', verifyToken, requireRole('ADMIN'), ctrl.deletePolicy);

module.exports = router;
