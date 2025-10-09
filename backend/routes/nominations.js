const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const NominationController = require('../controllers/nominationController');

router.post('/', verifyToken, NominationController.submitNomination); // student
router.get('/election/:electionId', verifyToken, NominationController.listByElection); // list candidates
router.put('/:id/approve', verifyToken, NominationController.approveNomination); // admin only
router.put('/:id/reject', verifyToken, NominationController.rejectNomination); // admin only

module.exports = router;
