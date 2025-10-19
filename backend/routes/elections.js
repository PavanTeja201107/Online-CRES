const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/electionsController');

router.post('/', verifyToken, requireRole('ADMIN'), ctrl.createElection);
router.put('/:id', verifyToken, requireRole('ADMIN'), ctrl.updateElection);
router.get('/:id', verifyToken, ctrl.getElection);
router.get('/', verifyToken, ctrl.listElections);
router.get('/class/:classId/active', verifyToken, ctrl.getActiveElectionForClass);
router.get('/my/active', verifyToken, requireRole('STUDENT'), ctrl.getMyActiveElection);
router.get('/my', verifyToken, requireRole('STUDENT'), ctrl.getMyElections);
router.post('/:id/activate', verifyToken, requireRole('ADMIN'), ctrl.activateElection); // generate tokens
router.post('/:id/publish', verifyToken, requireRole('ADMIN'), ctrl.publishResults);
router.post('/publish/bulk', verifyToken, requireRole('ADMIN'), ctrl.publishResultsBulk);
router.post('/:id/notify', verifyToken, requireRole('ADMIN'), ctrl.notifyVotingOpen);
router.post('/:id/notify/nomination-open', verifyToken, requireRole('ADMIN'), ctrl.notifyNominationOpen);

module.exports = router;
