const pool = require('../config/db');
const { logAction } = require('../utils/audit');

const submitNomination = async (req, res) => {
  const { election_id, manifesto, photo_url } = req.body;
  const student_id = req.user.userId;

  try {
    // check election nomination window
    const [eRows] = await pool.query('SELECT * FROM Election WHERE election_id = ?', [election_id]);
    if (!eRows.length) return res.status(400).json({ error: 'Election not found' });
    const election = eRows[0];
    const now = new Date();
    if (!(new Date(election.nomination_start) <= now && now <= new Date(election.nomination_end))) {
      return res.status(400).json({ error: 'Nomination window closed' });
    }

    // insert nomination (PENDING)
    const [result] = await pool.query('INSERT INTO Nomination (election_id, student_id, manifesto, photo_url) VALUES (?, ?, ?, ?)',
      [election_id, student_id, manifesto, photo_url]);
    await logAction(student_id, req.ip, 'NOMINATION_SUBMIT', `nomination_id=${result.insertId}`);
    res.json({ message: 'Nomination submitted', nomination_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const listByElection = async (req, res) => {
  try {
    const electionId = req.params.electionId;
    const [rows] = await pool.query('SELECT n.*, s.name FROM Nomination n JOIN Student s ON n.student_id=s.student_id WHERE n.election_id = ?', [electionId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const approveNomination = async (req, res) => {
  const nomId = req.params.id;
  // only admin do this (simple check)
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query('UPDATE Nomination SET status = "APPROVED" WHERE nomination_id = ?', [nomId]);
    await logAction(req.user.userId, req.ip, 'NOMINATION_APPROVE', `nomination_id=${nomId}`);
    res.json({ message: 'Approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const rejectNomination = async (req, res) => {
  const nomId = req.params.id;
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query('UPDATE Nomination SET status = "REJECTED" WHERE nomination_id = ?', [nomId]);
    await logAction(req.user.userId, req.ip, 'NOMINATION_REJECT', `nomination_id=${nomId}`);
    res.json({ message: 'Rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { submitNomination, listByElection, approveNomination, rejectNomination };
