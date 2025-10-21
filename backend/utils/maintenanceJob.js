const pool = require('../config/db');
const { genToken, hashToken } = require('./tokenUtils');
const { v4: uuidv4 } = require('uuid');

async function maintenanceJob() {
    // Auto-reject all pending nominations for elections where voting has started
    await pool.query(`
      UPDATE Nomination n
      JOIN Election e ON n.election_id = e.election_id
      SET n.status = 'REJECTED', n.reviewed_by_admin_id = 'SYSTEM', n.reviewed_at = NOW(), n.rejection_reason = 'Auto-rejected: voting started before admin decision.'
      WHERE n.status = 'PENDING' AND e.voting_start <= NOW()
    `);
  try {
    await pool.query("UPDATE OTP SET used = TRUE WHERE expiry_time < NOW() AND used = FALSE");
    await pool.query("DELETE FROM OTP WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

    const [toClose] = await pool.query(
      'SELECT election_id FROM Election WHERE is_active = TRUE AND voting_end < NOW()'
    );
    for (const row of toClose) {
      try {
        await pool.query('UPDATE Election SET is_active = FALSE WHERE election_id = ?', [row.election_id]);
        await pool.query(
          'UPDATE VotingToken SET used = TRUE, used_at = NOW(), student_id = NULL, token_hash = NULL WHERE election_id = ? AND used = FALSE',
          [row.election_id]
        );
        const logAction = require('./logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_CLOSED', { election_id: row.election_id });
      } catch (innerErr) {
        console.error('Election auto-close error:', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }

    const [toActivate] = await pool.query(
      'SELECT election_id, class_id FROM Election WHERE is_active = FALSE AND is_published = FALSE AND nomination_start <= NOW()'
    );
    for (const row of toActivate) {
      try {
        const [activeOther] = await pool.query('SELECT 1 FROM Election WHERE class_id = ? AND is_active = TRUE LIMIT 1', [row.class_id]);
        if (activeOther.length) continue;

        const [students] = await pool.query('SELECT student_id FROM Student WHERE class_id = ?', [row.class_id]);
        const insertVt = [];
        const insertVs = [];
        for (const s of students) {
          const token = genToken();
          const tokenHash = hashToken(token);
          const tokenId = uuidv4();
          insertVt.push([tokenId, s.student_id, row.election_id, tokenHash]);
          insertVs.push([s.student_id, row.election_id, false]);
        }
        if (insertVt.length) {
          await pool.query('INSERT IGNORE INTO VotingToken (token_id, student_id, election_id, token_hash) VALUES ?', [insertVt]);
          await pool.query('INSERT IGNORE INTO VoterStatus (student_id, election_id, has_voted) VALUES ?', [insertVs]);
        }

        await pool.query('UPDATE Election SET is_active = TRUE WHERE election_id = ?', [row.election_id]);
        const logAction = require('./logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_ACTIVATED_AUTO', { election_id: row.election_id });
      } catch (innerErr) {
        console.error('Election auto-activate error:', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }
  } catch (err) {
    console.error('Maintenance job error:', err && err.message ? err.message : err);
  }
}

module.exports = maintenanceJob;
