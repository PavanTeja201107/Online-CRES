// controllers/policyController.js
const pool = require('../config/db');
const logAction = require('../utils/logAction');

/*
 * Purpose: Expose endpoints for retrieving, accepting, and updating election-related policies.
 * Notes: The system keeps exactly two policies: 'Nomination Policy' and 'Voting Policy'.
 */

// Get both policies by name
/*
 * Purpose: Retrieve the two canonical policies (Nomination and Voting) used by the system.
 * Parameters: req - not used; res - returns array of policy records.
 */
exports.getPolicies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Policy WHERE name IN ('Nomination Policy', 'Voting Policy') ORDER BY FIELD(name, 'Nomination Policy', 'Voting Policy')"
    );
    if (rows.length !== 2)
      return res.status(404).json({ error: 'Policies not found' });
    res.json(rows);
  } catch (err) {
    console.error('getPolicies error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// No-op: only two policies exist
exports.listPolicies = async (req, res) => {
  return exports.getPolicies(req, res);
};

exports.acceptPolicy = async (req, res) => {
  try {
    let { policy_id, name } = req.body || {};
    if (!policy_id && name) {
      // resolve policy_id by name
      const [rows] = await pool.query(
        'SELECT policy_id FROM Policy WHERE name = ? LIMIT 1',
        [name]
      );
      if (!rows.length)
        return res.status(404).json({ error: 'Policy not found' });
      policy_id = rows[0].policy_id;
    }
    if (!policy_id)
      return res.status(400).json({ error: 'policy_id or name required' });
    await pool.query(
      'INSERT INTO PolicyAcceptance (user_id, policy_id, timestamp) VALUES (?, ?, NOW())',
      [req.user.id, policy_id]
    );
    await logAction(req.user.id, req.user.role, req.ip, 'POLICY_ACCEPT', {
      policy_id,
    });
    res.json({ message: 'Policy accepted successfully' });
  } catch (err) {
    console.error('acceptPolicy error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// No-op: cannot create more policies
exports.createPolicy = async (req, res) => {
  res
    .status(403)
    .json({ error: 'Cannot create more policies. Only two allowed.' });
};

// No-op: cannot delete policies
exports.deletePolicy = async (req, res) => {
  res
    .status(403)
    .json({ error: 'Cannot delete policies. Only update allowed.' });
};
// Update policy text by name
exports.updatePolicy = async (req, res) => {
  try {
    const { name, policy_text } = req.body;
    if (!name || !policy_text)
      return res.status(400).json({ error: 'name and policy_text required' });
    // Get current version
    const [rows] = await pool.query(
      'SELECT version, policy_id FROM Policy WHERE name = ?',
      [name]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Policy not found' });
    const version = (rows[0].version || 0) + 1;
    await pool.query(
      'UPDATE Policy SET policy_text = ?, version = ?, created_at = NOW() WHERE name = ?',
      [policy_text, version, name]
    );
    await logAction(req.user.id, req.user.role, req.ip, 'POLICY_UPDATE', {
      name,
      version,
    });
    res.json({ message: 'Policy updated', name, version });
  } catch (err) {
    console.error('updatePolicy error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
