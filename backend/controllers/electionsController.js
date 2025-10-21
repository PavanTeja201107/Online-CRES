// controllers/electionsController.js
const pool = require('../config/db');
const logAction = require('../utils/logAction');
const { genToken, hashToken } = require('../utils/tokenUtils');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

exports.createElection = async (req, res) => {
  try {
    const { class_id, nomination_start, nomination_end, voting_start, voting_end } = req.body;
    if (!class_id || !nomination_start || !nomination_end || !voting_start || !voting_end) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    // validate time order (strict)
    const ns = new Date(nomination_start), ne = new Date(nomination_end), vs = new Date(voting_start), ve = new Date(voting_end);
    if (!(ns < ne && ne < vs && vs < ve)) {
      return res.status(400).json({ error: 'Invalid timeline: ensure nomination_start < nomination_end < voting_start < voting_end' });
    }
    // validate class exists
    const [cRows] = await pool.query('SELECT 1 FROM Class WHERE class_id = ? LIMIT 1', [class_id]);
    if (!cRows.length) return res.status(400).json({ error: 'Class not found' });

    // enforce: no overlapping elections for the same class between nomination_start and voting_end
    const [overlaps] = await pool.query(
      `SELECT election_id FROM Election
       WHERE class_id = ?
         AND NOT (voting_end < ? OR nomination_start > ?)`,
      [class_id, nomination_start, voting_end]
    );
    if (overlaps.length) {
      return res.status(400).json({ error: 'Another election overlaps this timeline for this class. Complete current election before creating a new one.' });
    }

    // Insert election without policy columns
    const [result] = await pool.query(
      `INSERT INTO Election (class_id, nomination_start, nomination_end, voting_start, voting_end, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id, nomination_start, nomination_end, voting_start, voting_end, req.user.id]
    );
    // ensure not active by default regardless of DB defaults
    await pool.query('UPDATE Election SET is_active = FALSE, is_published = FALSE WHERE election_id = ?', [result.insertId]);
    await logAction(req.user.id, req.user.role, req.ip, 'CREATE_ELECTION', { election_id: result.insertId });
    res.json({ message: 'Election created', election_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Update election details


// List all elections (admin or student)
exports.listElections = async (req, res) => {
  try {
    let query = 'SELECT * FROM Election ORDER BY created_at DESC';
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('listElections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};






// Notify students when voting opens (announcement only, no tokens)
exports.notifyVotingOpen = async (req, res) => {
  try {
    const electionId = req.params.id;
    const [eRows] = await pool.query('SELECT * FROM Election WHERE election_id = ?', [electionId]);
    if (!eRows.length) return res.status(404).json({ error: 'Election not found' });
    const election = eRows[0];

    // fetch students emails in class
    const [students] = await pool.query('SELECT email, name FROM Student WHERE class_id = ?', [election.class_id]);
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return res.status(400).json({ error: 'SMTP not configured' });
    }
    const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });

    const start = new Date(election.voting_start).toLocaleString();
    const end = new Date(election.voting_end).toLocaleString();

    // naive batching
    for (const s of students) {
      if (!s.email) continue;
      await transporter.sendMail({
        from: process.env.OTP_EMAIL_FROM,
        to: s.email,
  subject: 'Voting for Class Representative Now Open',
  text: `Dear ${s.name || 'Student'},\n\nThe election for Class Representative is scheduled between ${start} and ${end}. Please log into the Class Representative Election System during this window to cast your vote.\n\nRegards,\nElection Committee`
      });
    }
    await logAction(req.user.id, req.user.role, req.ip, 'EMAIL_NOTIFICATION_SENT', { election_id: electionId, recipients: students.length });
    res.json({ message: 'Notifications sent (if SMTP configured)' });
  } catch (err) {
    console.error('notifyVotingOpen error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Notify students when nomination opens (announcement)
exports.notifyNominationOpen = async (req, res) => {
  try {
    const electionId = req.params.id;
    const [eRows] = await pool.query('SELECT * FROM Election WHERE election_id = ?', [electionId]);
    if (!eRows.length) return res.status(404).json({ error: 'Election not found' });
    const election = eRows[0];
    const [students] = await pool.query('SELECT email, name FROM Student WHERE class_id = ?', [election.class_id]);
    const host = process.env.SMTP_HOST; const port = parseInt(process.env.SMTP_PORT || '587'); const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return res.status(400).json({ error: 'SMTP not configured' });
    const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });
    const start = new Date(election.nomination_start).toLocaleString();
    const end = new Date(election.nomination_end).toLocaleString();
    for (const s of students) {
      if (!s.email) continue;
      await transporter.sendMail({
        from: process.env.OTP_EMAIL_FROM,
        to: s.email,
        subject: 'Nomination Window Now Open',
        text: `Dear ${s.name || 'Student'},\n\nThe nomination window is open from ${start} to ${end}. Please submit your nomination via the Class Representative Election System.\n\nRegards,\nElection Committee`
      });
    }
    await logAction(req.user.id, req.user.role, req.ip, 'EMAIL_NOTIFICATION_SENT', { election_id: electionId, type: 'NOMINATION', recipients: students.length });
    res.json({ message: 'Nomination notifications sent (if SMTP configured)' });
  } catch (err) {
    console.error('notifyNominationOpen error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Convenience: active election for the logged-in student based on their class
exports.getMyActiveElection = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
    const studentId = req.user.id;
    const [sRows] = await pool.query('SELECT class_id FROM Student WHERE student_id = ?', [studentId]);
    if (!sRows.length || !sRows[0].class_id) return res.status(404).json({ error: 'Student class not found' });
    const classId = sRows[0].class_id;
    const [rows] = await pool.query(
      `SELECT * FROM Election WHERE class_id = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1`,
      [classId]
    );
    if (!rows.length) return res.status(404).json({ error: 'No active election' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getMyActiveElection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// List all elections for the logged-in student's class with computed status flags
exports.getMyElections = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
    const studentId = req.user.id;
    const [[s]] = await pool.query('SELECT class_id FROM Student WHERE student_id = ?', [studentId]);
    if (!s || !s.class_id) return res.status(404).json({ error: 'Student class not found' });
    const classId = s.class_id;
    const [rows] = await pool.query('SELECT * FROM Election WHERE class_id = ? ORDER BY created_at DESC', [classId]);
    const now = Date.now();
    const data = rows.map(e => {
      const ns = new Date(e.nomination_start).getTime();
      const ne = new Date(e.nomination_end).getTime();
      const vs = new Date(e.voting_start).getTime();
      const ve = new Date(e.voting_end).getTime();
      return {
        ...e,
        nomination_open: now >= ns && now <= ne,
        voting_open: now >= vs && now <= ve,
        ended: now > ve
      };
    });
    res.json(data);
  } catch (err) {
    console.error('getMyElections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// listElections, updateElection, getElection etc - implement similarly
