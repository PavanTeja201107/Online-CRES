const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { logAction } = require('../utils/audit');

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // smtp.gmail.com
  port: 465,                         // 465 for SSL
  secure: true,                       // must be true for port 465
  auth: {
    user: process.env.SMTP_USER,     // your Gmail
    pass: process.env.SMTP_PASS      // 16-char app password
  }
});

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

const login = async (req, res) => {
  console.log('Login attempt:', req.body);
  const { studentId, password } = req.body;

  try {
    // Check student table
    const [rows] = await pool.query('SELECT * FROM Student WHERE student_id = ?', [studentId]);
    console.log('DB rows:', rows);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    console.log('Entered password:', password);
    console.log('Stored hash:', user.password_hash);

    const valid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid?', valid);
    if (!valid) {
      await logAction(studentId, req.ip, 'LOGIN_FAILURE', 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // generate OTP and save in OTP table with expiry (5 min)
    const otpCode = generateOtpCode();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query('INSERT INTO OTP (student_id, otp_code, expiry_time) VALUES (?, ?, ?)', [studentId, otpCode, expiry]);

    // send email
    const mail = {
      from: process.env.OTP_EMAIL_FROM,
      to: user.email,
      subject: 'Your CRES login OTP',
      text: `Your OTP is ${otpCode}. It expires in 5 minutes.`
    };
    await smtpTransport.sendMail(mail);

    await logAction(studentId, req.ip, 'OTP_SENT', 'OTP for login sent');
    return res.json({ message: 'OTP sent to registered email' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const verifyOtp = async (req, res) => {
  const { studentId, otp } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM OTP WHERE student_id = ? ORDER BY otp_id DESC LIMIT 1', [studentId]);
    if (!rows.length) return res.status(400).json({ error: 'No OTP found' });
    const entry = rows[0];
    if (entry.expiry_time < new Date()) return res.status(400).json({ error: 'OTP expired' });
    if (String(entry.otp_code) !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });

    // create JWT and session
    const sessionId = uuidv4();
    const jwtPayload = { userId: studentId, role: 'STUDENT', sessionId };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    // enforce single-device login: delete existing sessions for user
    await pool.query('DELETE FROM Session WHERE user_id = ?', [studentId]);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // match JWT expiration (~1h)
    await pool.query('INSERT INTO Session (session_id, user_id, role, expiry_time) VALUES (?, ?, ?, ?)', [sessionId, studentId, 'STUDENT', expiry]);

    // update last_login
    await pool.query('UPDATE Student SET last_login = ? WHERE student_id = ?', [new Date(), studentId]);

    await logAction(studentId, req.ip, 'LOGIN_SUCCESS', 'User logged in');
    return res.json({ token, userId: studentId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { studentId, newPassword } = req.body;
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE Student SET password_hash = ?, must_change_password = FALSE WHERE student_id = ?', [hash, studentId]);
    await logAction(studentId, req.ip, 'PASSWORD_CHANGE', 'User changed password');
    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const requestPasswordReset = async (req, res) => {
  const { studentId } = req.body;
  try {
    const [rows] = await pool.query('SELECT email FROM Student WHERE student_id = ?', [studentId]);
    if (!rows.length) return res.status(400).json({ error: 'Unknown user' });
    const email = rows[0].email;
    const otpCode = generateOtpCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('INSERT INTO OTP (student_id, otp_code, expiry_time) VALUES (?, ?, ?)', [studentId, otpCode, expiry]);
    await smtpTransport.sendMail({
      from: process.env.OTP_EMAIL_FROM,
      to: email,
      subject: 'CRES Password Reset OTP',
      text: `Reset OTP: ${otpCode}. Valid 10 minutes.`
    });
    await logAction(studentId, req.ip, 'RESET_OTP_SENT', 'Password reset OTP sent');
    res.json({ message: 'Password reset OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { studentId, otp, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM OTP WHERE student_id = ? ORDER BY otp_id DESC LIMIT 1', [studentId]);
    if (!rows.length) return res.status(400).json({ error: 'OTP not found' });
    const entry = rows[0];
    if (entry.expiry_time < new Date()) return res.status(400).json({ error: 'OTP expired' });
    if (String(entry.otp_code) !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE Student SET password_hash = ?, must_change_password = FALSE WHERE student_id = ?', [hash, studentId]);
    await logAction(studentId, req.ip, 'PASSWORD_RESET', 'Password reset via OTP');
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password)
      return res.status(400).json({ error: 'Missing adminId or password' });

    const [rows] = await pool.query('SELECT * FROM Admin WHERE admin_id = ?', [adminId]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid admin ID or password' });

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid admin ID or password' });

    // Delete any existing sessions for this admin
    await pool.query('DELETE FROM Session WHERE user_id = ?', [adminId]);

    // Create new session and JWT
    const sessionId = uuidv4();
    const jwtPayload = { userId: adminId, role: 'ADMIN', sessionId };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO Session (session_id, user_id, role, creation_time, expiry_time) VALUES (?, ?, ?, NOW(), ?)',
      [sessionId, adminId, 'ADMIN', expiry]
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



module.exports = { login, verifyOtp, changePassword, requestPasswordReset, resetPassword, adminLogin };
