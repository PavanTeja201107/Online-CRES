const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ElectionsController = require('../controllers/electionsController');

// Admin endpoints
router.post('/', verifyToken, requireRole('ADMIN'), ElectionsController.createElection);
router.put('/:id', verifyToken, requireRole('ADMIN'), ElectionsController.updateElection);
router.get('/:id', verifyToken, ElectionsController.getElection);
router.get('/', verifyToken, ElectionsController.listElections);

// public: get active elections for a class
router.get('/class/:classId/active', verifyToken, ElectionsController.getActiveElectionForClass);

module.exports = router;
