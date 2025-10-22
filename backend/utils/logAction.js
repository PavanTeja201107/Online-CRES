const pool = require('../config/db');

/**
 * Audit Logging Utility
 * 
 * This utility provides a centralized function to log user actions to the AuditLog table.
 * It captures metadata such as user ID, role, IP address, action type, and outcome.
 * 
 * Function:
 * - logAction: Logs an action to the database with structured metadata.
 * 
 * Parameters:
 * - userId: The ID of the user performing the action (or 'SYSTEM' for automated events).
 * - role: The role of the user (e.g., 'ADMIN', 'STUDENT').
 * - ip: The IP address of the client (optional).
 * - actionType: A short string describing the action (e.g., 'LOGIN').
 * - details: Additional metadata as a JSON object.
 * - outcome: The result of the action (e.g., 'SUCCESS', 'FAILURE').
 * 
 * Notes:
 * - Errors during logging are caught and logged to the console without interrupting the main flow.
 */
async function logAction(userId, role, ip, actionType, details, outcome = 'SUCCESS') {
  try {
    await pool.query(
      'INSERT INTO AuditLog (user_id, role, ip_address, action_type, details, outcome) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, role || 'SYSTEM', ip || null, actionType, JSON.stringify(details || {}), outcome]
    );
  } catch (err) {
    // Intentionally swallow audit logging errors to avoid breaking main flows.
    console.error('Audit log failed:', err);
  }
}

module.exports = logAction;
