const pool = require('../config/db');
const { logAction } = require('../utils/audit');

const createElection = async (req, res) => {
  const { class_id, nomination_start, nomination_end, voting_start, voting_end } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO Election (class_id, nomination_start, nomination_end, voting_start, voting_end, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`, [class_id, nomination_start, nomination_end, voting_start, voting_end, false]
    );
    await logAction(req.user.userId, req.ip, 'CREATE_ELECTION', `election_id=${result.insertId}`);
    res.json({ message: 'Election created', election_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateElection = async (req, res) => {
  const id = req.params.id;
  const { nomination_start, nomination_end, voting_start, voting_end, is_active } = req.body;
  try {
    await pool.query(
      `UPDATE Election SET nomination_start=?, nomination_end=?, voting_start=?, voting_end=?, is_active=? WHERE election_id=?`,
      [nomination_start, nomination_end, voting_start, voting_end, !!is_active, id]
    );
    await logAction(req.user.userId, req.ip, 'UPDATE_ELECTION', `election_id=${id}`);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getElection = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM Election WHERE election_id = ?', [id]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const listElections = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT e.*, c.class_name FROM Election e JOIN Class c ON e.class_id=c.class_id ORDER BY e.election_id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getActiveElectionForClass = async (req, res) => {
  const classId = req.params.classId;
  try {
    const now = new Date();
    const [rows] = await pool.query(
      'SELECT * FROM Election WHERE class_id = ? AND nomination_start <= ? AND voting_end >= ?',
      [classId, now, now]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createElection, updateElection, getElection, listElections, getActiveElectionForClass };
