const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/votesController');

/*
 * Votes routes
 *
 * Purpose:
 * Provide voting-related endpoints: request token, cast vote, and view results.
 *
 * Parameters/Return:
 * Routes are protected by authentication middleware and exported as a router.
 */

router.get(
  '/election/:electionId/token',
  verifyToken,
  ctrl.getOrCreateTokenForStudent
); // student requests token in-session
// student requests token in-session
router.post('/', verifyToken, ctrl.castVote);
// student casts vote (uses token in server session)
// admin/public after publish
router.get('/election/:electionId/results', verifyToken, ctrl.getResults);

module.exports = router;
