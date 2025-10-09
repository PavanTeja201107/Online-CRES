const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // verify session still valid in Session table
    const [rows] = await pool.query('SELECT * FROM Session WHERE session_id = ? AND user_id = ?', [payload.sessionId, payload.userId]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Session invalid or expired' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { verifyToken, requireRole };
