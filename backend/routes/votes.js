const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const VoteController = require('../controllers/voteController');

router.post('/', verifyToken, VoteController.castVote);
router.get('/election/:electionId/results', verifyToken, VoteController.getResults); // Not totally implemented ... Need to do laterr->bala.

module.exports = router;
