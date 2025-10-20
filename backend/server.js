require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5500;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS: allow common localhost variants during dev
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];
const configuredOrigin = process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : [];
const allowlist = new Set([...configuredOrigin, ...defaultOrigins]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin like curl or same-origin
    if (!origin) return callback(null, true);
    if (allowlist.has(origin)) return callback(null, true);
    return callback(new Error(`CORS not allowed from origin: ${origin}`));
  },
  credentials: true
}));

// Global rate limit: relax in development to avoid blocking multiple local browsers/tabs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/',
  handler: (req, res) => {
    return res.status(429).json({ error: 'Too many requests (rate limit). Please slow down and try again shortly.' });
  }
});
app.use(limiter);

// Note: OTP-specific rate limiter is applied within auth routes

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/elections', require('./routes/elections'));
app.use('/api/nominations', require('./routes/nominations'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/policy', require('./routes/policy'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'Class Representative Election System backend up' }));
app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString(), env: NODE_ENV }));

const pool = require('./config/db');
const { genToken, hashToken } = require('./utils/tokenUtils');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Ensure Election has nomination_policy_id and voting_policy_id columns for per-election policies
async function ensureElectionPolicyColumns() {
  try {
    const dbName = process.env.DB_NAME || 'CRElection';
    const check = async (col, fk) => {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='Election' AND COLUMN_NAME=?`,
        [dbName, col]
      );
      if (!Number(rows?.[0]?.cnt || 0)) {
        console.log(`[schema] Adding Election.${col} ...`);
        await pool.query(`ALTER TABLE Election ADD COLUMN ${col} INT NULL`);
        try {
          await pool.query(`ALTER TABLE Election ADD CONSTRAINT ${fk} FOREIGN KEY (${col}) REFERENCES Policy(policy_id) ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {
          console.warn(`[schema] FK add warn for ${col}:`, e.message || e);
        }
      }
    };
    await check('nomination_policy_id', 'fk_election_nomination_policy');
    await check('voting_policy_id', 'fk_election_voting_policy');
  } catch (e) {
    console.warn('[schema] ensureElectionPolicyColumns warn:', e.message || e);
  }
}

// Maintenance job: auto-close and auto-activate
async function maintenanceTick() {
  try {
    // Expire/cleanup OTPs
    await pool.query("UPDATE OTP SET used = TRUE WHERE expiry_time < NOW() AND used = FALSE");
    await pool.query("DELETE FROM OTP WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

    // Auto-close elections whose voting_end passed and still active
    const [toClose] = await pool.query(
      'SELECT election_id FROM Election WHERE is_active = TRUE AND voting_end < NOW()'
    );
    for (const row of toClose) {
      try {
        await pool.query('UPDATE Election SET is_active = FALSE WHERE election_id = ?', [row.election_id]);
        // Mark any unused tokens as used and anonymize
        await pool.query(
          'UPDATE VotingToken SET used = TRUE, used_at = NOW(), student_id = NULL, token_hash = NULL WHERE election_id = ? AND used = FALSE',
          [row.election_id]
        );
        // Audit log
        const logAction = require('./utils/logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_CLOSED', { election_id: row.election_id });
      } catch (innerErr) {
        console.error('Election auto-close error:', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }

    // Auto-activate elections at nomination start if not already active/published and not past voting end
    const [toActivate] = await pool.query(
      'SELECT election_id, class_id FROM Election WHERE is_active = FALSE AND is_published = FALSE AND nomination_start <= NOW() AND voting_end > NOW()'
    );
    for (const row of toActivate) {
      try {
        // ensure no other active election exists for this class
        const [activeOther] = await pool.query('SELECT 1 FROM Election WHERE class_id = ? AND is_active = TRUE LIMIT 1', [row.class_id]);
        if (activeOther.length) continue;

        // create tokens and voter status for students of this class
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
          // Make idempotent to avoid duplicate key aborts when cron overlaps
          await pool.query('INSERT IGNORE INTO VotingToken (token_id, student_id, election_id, token_hash) VALUES ?', [insertVt]);
          await pool.query('INSERT IGNORE INTO VoterStatus (student_id, election_id, has_voted) VALUES ?', [insertVs]);
        }

        await pool.query('UPDATE Election SET is_active = TRUE WHERE election_id = ?', [row.election_id]);
        const logAction = require('./utils/logAction');
        await logAction('SYSTEM', 'SYSTEM', null, 'ELECTION_ACTIVATED_AUTO', { election_id: row.election_id });
      } catch (innerErr) {
        console.error('Election auto-activate error:', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }
  } catch (err) {
    console.error('Maintenance job error:', err && err.message ? err.message : err);
  }
}
setInterval(maintenanceTick, 1000 * 60);

// Auto-publish results shortly after voting end; run on same cadence
async function autoPublishTick() {
  try {
    // Elections that ended and not published yet
    const [toPublish] = await pool.query(
      'SELECT election_id, class_id FROM Election WHERE is_published = FALSE AND voting_end < NOW()'
    );
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS;
    const mailReady = !!(host && user && pass);
    const transporter = mailReady ? nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } }) : null;
    const logAction = require('./utils/logAction');

    for (const row of toPublish) {
      try {
        // Compute winner or tie; include zero-vote scenario
        const [countRows] = await pool.query(
          `SELECT v.candidate_id, COUNT(*) AS votes
           FROM VoteAnonymous v
           WHERE v.election_id = ?
           GROUP BY v.candidate_id
           ORDER BY votes DESC`, [row.election_id]
        );

        let outcome = 'NO_VOTES';
        let winnerId = null;
        if (countRows.length > 0) {
          const topVotes = countRows[0].votes;
          const tie = countRows.filter(r => r.votes === topVotes).length > 1;
          if (topVotes === 0) outcome = 'NO_VOTES';
          else if (tie) outcome = 'TIE';
          else { outcome = 'WINNER'; winnerId = countRows[0].candidate_id; }
        }

        // Mark as published and ensure inactive
        await pool.query('UPDATE Election SET is_published = TRUE, is_active = FALSE WHERE election_id = ?', [row.election_id]);
        await logAction('SYSTEM', 'SYSTEM', null, 'RESULTS_PUBLISHED_AUTO', { election_id: row.election_id, outcome, winnerId });

        // Notify winner (if clear winner)
        if (mailReady && outcome === 'WINNER' && winnerId) {
          const [[student]] = await pool.query('SELECT email, name FROM Student WHERE student_id = ?', [winnerId]);
          if (student && student.email) {
            await transporter.sendMail({
              from: process.env.OTP_EMAIL_FROM,
              to: student.email,
              subject: 'Congratulations: You have been elected Class Representative',
              text: `Dear ${student.name || winnerId},\n\nCongratulations! You have been elected as the Class Representative. Please await further instructions from the faculty advisor.\n\nRegards,\nElection Committee`
            });
          }
        }

        // Notify all students of the class that results are published
        if (mailReady) {
          const [students] = await pool.query('SELECT email, name FROM Student WHERE class_id = ?', [row.class_id]);
          for (const s of students) {
            if (!s.email) continue;
            await transporter.sendMail({
              from: process.env.OTP_EMAIL_FROM,
              to: s.email,
              subject: 'Election Results Published',
              text: `Dear ${s.name || 'Student'},\n\nResults for your class election (ID: ${row.election_id}) have been published. Please log into the system to view the results.\n\nRegards,\nElection Committee`
            });
          }
        }
      } catch (innerErr) {
        console.error('Election auto-publish error:', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }
  } catch (err) {
    console.error('Auto-publish job error:', err && err.message ? err.message : err);
  }
}
setInterval(autoPublishTick, 1000 * 60);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Ensure schema then start listening (non-blocking but awaited for best effort)
ensureElectionPolicyColumns().finally(async () => {
  // Kick off background jobs immediately on start (don't wait 60s)
  try { await maintenanceTick(); } catch {}
  try { await autoPublishTick(); } catch {}
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
