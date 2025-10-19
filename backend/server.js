require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use(limiter);

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP attempts, try again later' }
});

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

const pool = require('./config/db');
setInterval(async () => {
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
  } catch (err) {
    console.error('Maintenance job error:', err && err.message ? err.message : err);
  }
}, 1000 * 60 * 60);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
