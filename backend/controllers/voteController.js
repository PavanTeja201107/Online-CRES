const pool = require('../config/db');
const { logAction } = require('../utils/audit');

const castVote = async (req, res) => {
  const { election_id, candidate_id } = req.body;
  const voter_id = req.user.userId;

  try {
    // check election is active for voting
    const [eRows] = await pool.query('SELECT * FROM Election WHERE election_id = ?', [election_id]);
    if (!eRows.length) return res.status(400).json({ error: 'Election not found' });
    const election = eRows[0];
    const now = new Date();
    if (!(new Date(election.voting_start) <= now && now <= new Date(election.voting_end))) {
      return res.status(400).json({ error: 'Voting not active' });
    }

    // check voter eligibility: same class and not voted
    // optional: ensure voter is in election class
    const [voteRows] = await pool.query('SELECT * FROM Vote WHERE election_id = ? AND voter_id = ?', [election_id, voter_id]);
    if (voteRows.length > 0) return res.status(400).json({ error: 'Already voted' });

    // ensure candidate is approved for this election
    const [cRows] = await pool.query('SELECT * FROM Nomination WHERE election_id = ? AND student_id = ? AND status="APPROVED"', [election_id, candidate_id]);
    if (!cRows.length) return res.status(400).json({ error: 'Candidate not eligible' });

    await pool.query('INSERT INTO Vote (election_id, voter_id, candidate_id) VALUES (?, ?, ?)', [election_id, voter_id, candidate_id]);
    await logAction(voter_id, req.ip, 'CAST_VOTE', `election=${election_id} candidate=${candidate_id}`);
    res.json({ message: 'Vote cast' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getResults = async (req, res) => {
  const electionId = req.params.electionId;
  try {
    const [rows] = await pool.query(
      `SELECT candidate_id, COUNT(*) as votes
       FROM Vote
       WHERE election_id = ?
       GROUP BY candidate_id
       ORDER BY votes DESC`, [electionId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { castVote, getResults };
