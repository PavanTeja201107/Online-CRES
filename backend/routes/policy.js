const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const policyController = require('../controllers/policyController');

router.get('/', verifyToken, policyController.getPolicy);
router.post('/accept', verifyToken, policyController.acceptPolicy);

module.exports = router;
