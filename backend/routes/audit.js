const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 1000');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
