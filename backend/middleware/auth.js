// middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Authentication Middleware
 * 
 * This module provides middleware functions for verifying JWT tokens and enforcing role-based
 * access control. It ensures that requests are authenticated and authorized before reaching
 * protected routes.
 * 
 * Functions:
 * - verifyToken: Verifies the JWT token, checks session validity, and attaches user info to req.
 * - requireRole: Returns middleware to enforce specific roles for protected routes.
 * 
 * Usage:
 * - Attach verifyToken to routes requiring authentication.
 * - Chain requireRole after verifyToken for role-based access control.
 */
async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.split(' ')[1];
  try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // verify session exists, role matches, and not expired
  const [rows] = await pool.query('SELECT * FROM Session WHERE session_id = ? AND user_id = ? AND role = ?', [payload.sessionId, payload.userId, payload.role]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid session' });
    const session = rows[0];
    if (new Date(session.expiry_time) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    // normalize user object
    req.user = { id: payload.userId, role: payload.role, sessionId: payload.sessionId };
    next();
  } catch (err) {
    // clearer error for expired tokens
    if (err && err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    console.error('verifyToken error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/*
  Helper: requireRole(role) returns middleware that ensures req.user has the specific role.
  Usage: router.get('/admin-only', verifyToken, requireRole('ADMIN'), handler)
*/
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { verifyToken, requireRole };
