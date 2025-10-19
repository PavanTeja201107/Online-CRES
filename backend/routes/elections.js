const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/electionsController');

// Create & list must come before id routes; specific routes before parameterized
router.post('/', verifyToken, requireRole('ADMIN'), ctrl.createElection);
router.get('/', verifyToken, ctrl.listElections);

// Student convenience routes (must be before numeric :id)
router.get('/my/active', verifyToken, requireRole('STUDENT'), ctrl.getMyActiveElection);
router.get('/my', verifyToken, requireRole('STUDENT'), ctrl.getMyElections);

// Class-scoped route (place before generic id)
router.get('/class/:classId(\\d+)/active', verifyToken, ctrl.getActiveElectionForClass);

// Admin actions on a specific election (numeric id only)
router.put('/:id(\\d+)', verifyToken, requireRole('ADMIN'), ctrl.updateElection);
router.post('/:id(\\d+)/activate', verifyToken, requireRole('ADMIN'), ctrl.activateElection); // generate tokens
router.post('/:id(\\d+)/publish', verifyToken, requireRole('ADMIN'), ctrl.publishResults);
router.post('/:id(\\d+)/notify/nomination-open', verifyToken, requireRole('ADMIN'), ctrl.notifyNominationOpen);
router.post('/:id(\\d+)/notify', verifyToken, requireRole('ADMIN'), ctrl.notifyVotingOpen);

// Bulk operations
router.post('/publish/bulk', verifyToken, requireRole('ADMIN'), ctrl.publishResultsBulk);

// Get one election by id (numeric)
router.get('/:id(\\d+)', verifyToken, ctrl.getElection);

module.exports = router;
