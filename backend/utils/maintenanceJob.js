const pool = require('../config/db');
const { genToken, hashToken } = require('./tokenUtils');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// Email transporter setup (same as nominationsController)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailStyles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderLeft: '4px solid #DC2626',
    padding: '15px',
    margin: '20px 0',
  },
  footer: {
    color: '#6B7280',
    fontSize: '14px',
    marginTop: '30px',
  },
};

async function maintenanceJob() {
  try {
    // Auto-reject all pending nominations for elections where voting has started
    // First, get the nominations that will be auto-rejected (for email notifications)
    const [pendingNoms] = await pool.query(`
      SELECT n.nomination_id, n.student_id, s.name, s.email, e.election_id, e.class_id
      FROM Nomination n
      JOIN Election e ON n.election_id = e.election_id
      JOIN Student s ON s.student_id = n.student_id
      WHERE n.status = 'PENDING' AND e.voting_start <= NOW()
    `);

    // Update nominations to REJECTED
    if (pendingNoms.length > 0) {
      await pool.query(`
        UPDATE Nomination n
        JOIN Election e ON n.election_id = e.election_id
        SET n.status = 'REJECTED', 
            n.reviewed_by_admin_id = NULL, 
            n.reviewed_at = NOW(), 
            n.rejection_reason = 'Auto-rejected: Voting started before admin review. Nominations must be reviewed before the voting period begins.'
        WHERE n.status = 'PENDING' AND e.voting_start <= NOW()
      `);

      // Send email notifications to affected students
      for (const nom of pendingNoms) {
        try {
          await transporter.sendMail({
            from: process.env.OTP_EMAIL_FROM || process.env.SMTP_USER,
            to: nom.email,
            subject: 'Nomination Status Update - College CR Election System',
            html: `
              <div style="${Object.entries(emailStyles.container).map(([key, value]) => `${key}: ${value}`).join('; ')}">
                <h2 style="color: #DC2626;">Nomination Not Reviewed in Time</h2>
                <p>Dear ${nom.name},</p>
                <p>Unfortunately, your nomination for the CR election was not reviewed by the administration before the voting period began.</p>
                
                <div style="${Object.entries(emailStyles.rejectionBox).map(([key, value]) => `${key}: ${value}`).join('; ')}">
                  <p style="margin: 0; font-weight: bold; color: #991B1B;">Reason:</p>
                  <p style="margin: 10px 0 0 0; color: #7F1D1D;">Your nomination was automatically rejected because the voting period started before an admin could review it. All nominations must be reviewed before voting begins.</p>
                </div>
                
                <p>We apologize for any inconvenience. Please ensure your nominations are submitted earlier in future elections to allow sufficient review time.</p>
                
                <p style="${Object.entries(emailStyles.footer).map(([key, value]) => `${key}: ${value}`).join('; ')}">
                  This is an automated email from the College CR Election System.
                </p>
              </div>
            `,
          });
          console.log(
            `Auto-rejection email sent to ${nom.email} for nomination_id ${nom.nomination_id}`
          );
        } catch (emailErr) {
          console.error(
            `Failed to send auto-rejection email to ${nom.email}:`,
            emailErr?.message || emailErr
          );
          // Don't fail the entire job if email fails
        }
      }

      console.log(`Auto-rejected ${pendingNoms.length} pending nomination(s)`);
    }

    // Mark expired OTPs as used
    await pool.query(
      'UPDATE OTP SET used = TRUE WHERE expiry_time < NOW() AND used = FALSE'
    );

    // Delete old OTPs (older than 7 days)
    await pool.query(
      'DELETE FROM OTP WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    // Auto-close elections where voting has ended
    const [toClose] = await pool.query(
      'SELECT election_id FROM Election WHERE is_active = TRUE AND voting_end < NOW()'
    );
    for (const row of toClose) {
      try {
        await pool.query(
          'UPDATE Election SET is_active = FALSE, is_published = TRUE WHERE election_id = ?',
          [row.election_id]
        );
        await pool.query(
          'UPDATE VotingToken SET used = TRUE, used_at = NOW(), student_id = NULL, token_hash = NULL WHERE election_id = ? AND used = FALSE',
          [row.election_id]
        );
        const logAction = require('./logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_CLOSED', {
          election_id: row.election_id,
        });
      } catch (innerErr) {
        console.error(
          `Election auto-close error for election_id ${row.election_id}:`,
          innerErr?.message || innerErr
        );
      }
    }

    // Auto-activate elections where nomination period has started
    const [toActivate] = await pool.query(
      'SELECT election_id, class_id FROM Election WHERE is_active = FALSE AND is_published = FALSE AND nomination_start <= NOW()'
    );
    for (const row of toActivate) {
      try {
        // Check if there's already an active election for this class
        const [activeOther] = await pool.query(
          'SELECT 1 FROM Election WHERE class_id = ? AND is_active = TRUE LIMIT 1',
          [row.class_id]
        );
        if (activeOther.length) continue;

        // Get all students in this class
        const [students] = await pool.query(
          'SELECT student_id FROM Student WHERE class_id = ?',
          [row.class_id]
        );

        if (students.length === 0) {
          console.warn(
            `No students found for class_id ${row.class_id}, election_id ${row.election_id}`
          );
          continue;
        }

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
          await pool.query(
            'INSERT IGNORE INTO VotingToken (token_id, student_id, election_id, token_hash) VALUES ?',
            [insertVt]
          );
          await pool.query(
            'INSERT IGNORE INTO VoterStatus (student_id, election_id, has_voted) VALUES ?',
            [insertVs]
          );
        }

        await pool.query(
          'UPDATE Election SET is_active = TRUE WHERE election_id = ?',
          [row.election_id]
        );
        const logAction = require('./logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_ACTIVATED_AUTO', {
          election_id: row.election_id,
        });
      } catch (innerErr) {
        console.error(
          `Election auto-activate error for election_id ${row.election_id}:`,
          innerErr?.message || innerErr
        );
      }
    }
  } catch (err) {
    console.error('Maintenance job error:', err?.message || err);
    console.error('Stack trace:', err?.stack);
  }
}

module.exports = maintenanceJob;
