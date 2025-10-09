const pool = require('../config/db');
const { logAction } = require('../utils/audit');

const getPolicy = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Policy ORDER BY policy_id DESC LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

const acceptPolicy = async (req, res) => {
  const { policy_id } = req.body;
  const userId = req.user.userId;
  try {
    await pool.query('INSERT INTO PolicyAcceptance (user_id, policy_id) VALUES (?, ?)', [userId, policy_id]);
    await logAction(userId, req.ip, 'POLICY_ACCEPT', `policy_id=${policy_id}`);
    res.json({ message: 'Policy accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

module.exports = { getPolicy, acceptPolicy };
