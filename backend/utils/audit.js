const pool = require('../config/db');

async function logAction(userId, ipAddress, actionType, details) {
  try {
    await pool.query(
      'INSERT INTO AuditLog (user_id, ip_address, action_type, details) VALUES (?, ?, ?, ?)',
      [userId || 'SYSTEM', ipAddress || null, actionType, details || null]
    );
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

module.exports = { logAction };
