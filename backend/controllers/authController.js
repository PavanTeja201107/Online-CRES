const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const logAction = require('../utils/logAction');
const { genToken, hashToken } = require('../utils/tokenUtils');

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
    padding: '20px',
    color: '#333',
  },
  otpBox: {
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    margin: '20px 0',
  },
  securityNotice: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #dc2626',
    padding: '15px',
    margin: '20px 0',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '20px 0',
  },
};

exports.adminLogin = async (req, res) => {
  const ip = req.ip;
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password)
      return res.status(400).json({ error: 'Missing adminId or password' });

    const [rows] = await pool.query('SELECT * FROM Admin WHERE admin_id = ?', [
      adminId,
    ]);
    if (!rows.length) {
      await logAction(
        adminId,
        'ADMIN',
        ip,
        'LOGIN_FAILURE',
        { reason: 'no_admin' },
        'FAILURE'
      );
      return res.status(401).json({ error: 'Invalid admin ID or password' });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      await logAction(
        adminId,
        'ADMIN',
        ip,
        'LOGIN_FAILURE',
        { reason: 'invalid_password' },
        'FAILURE'
      );
      return res.status(401).json({ error: 'Invalid admin ID or password' });
    }

    // Get the current last_login_at BEFORE updating it
    const previousLoginAt = admin.last_login_at;

    // Update last_login_at to current timestamp (using NOW() to match audit logs timezone)
    await pool.query(
      'UPDATE Admin SET last_login_at = NOW() WHERE admin_id = ?',
      [adminId]
    );

    // delete old sessions for this user and role only
    await pool.query('DELETE FROM Session WHERE user_id = ? AND role = ?', [
      adminId,
      'ADMIN',
    ]);

    const sessionId = uuidv4();
    const token = jwt.sign(
      { userId: adminId, role: 'ADMIN', sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO Session (session_id, user_id, role, creation_time, expiry_time) VALUES (?, ?, ?, NOW(), ?)',
      [sessionId, adminId, 'ADMIN', expiry]
    );

    await logAction(adminId, 'ADMIN', ip, 'LOGIN_SUCCESS', {});

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
        last_login_at: previousLoginAt, // Return the PREVIOUS login time
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    await logAction(
      'UNKNOWN',
      'ADMIN',
      req.ip,
      'LOGIN_FAILURE',
      { error: err.message },
      'FAILURE'
    );
    res.status(500).json({ error: 'Server error' });
  }
};

// STUDENT login -> send OTP
exports.login = async (req, res) => {
  const ip = req.ip;
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password)
      return res.status(400).json({ error: 'Missing studentId or password' });

    const [rows] = await pool.query(
      'SELECT * FROM Student WHERE student_id = ?',
      [studentId]
    );
    if (!rows.length) {
      await logAction(
        studentId,
        'STUDENT',
        ip,
        'LOGIN_FAILURE',
        { reason: 'no_user' },
        'FAILURE'
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    // Gmail-only support
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(String(user.email || ''))) {
      return res
        .status(400)
        .json({
          error: 'Only Gmail addresses are supported (example@gmail.com)',
        });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logAction(
        studentId,
        'STUDENT',
        ip,
        'LOGIN_FAILURE',
        { reason: 'invalid_password' },
        'FAILURE'
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO OTP (user_id, user_role, otp_code, expiry_time, purpose, used) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, 'STUDENT', otp, expiry, 'LOGIN', false]
    );

    // send email
    await transporter.sendMail({
      from: process.env.OTP_EMAIL_FROM,
      to: user.email,
      subject: 'Your Login OTP for the College CR Election System',
      html: `
        <div style="${Object.entries(emailStyles.container).map(([key, value]) => `${key}: ${value}`).join('; ')}">
          <p>Your One-Time Password (OTP) for accessing the <strong>College CR Election System</strong> is:</p>
          <div style="${Object.entries(emailStyles.otpBox).map(([key, value]) => `${key}: ${value}`).join('; ')}">
            <p style="font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 0;">${otp}</p>
          </div>
          <p>This code is valid for <strong>5 minutes</strong>.</p>
          <div style="${Object.entries(emailStyles.securityNotice).map(([key, value]) => `${key}: ${value}`).join('; ')}">
            <p style="margin: 0 0 10px 0;"><strong>🔒 Security Notice:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Do not share this code with anyone.</li>
              <li style="margin: 5px 0;">If you did not request this code, please contact support immediately.</li>
            </ul>
          </div>
          <hr style="${Object.entries(emailStyles.hr).map(([key, value]) => `${key}: ${value}`).join('; ')}">
          <p style="margin: 5px 0;">Thank you,<br>
          <strong>Election Committee</strong><br>
          College CR Election System</p>
        </div>
      `,
    });

    await logAction(studentId, 'STUDENT', ip, 'OTP_SENT', {
      email: user.email,
    });
    res.json({ message: 'OTP sent to registered email' });
  } catch (err) {
    console.error('login error', err);
    await logAction(
      req.body.studentId || 'UNKNOWN',
      'STUDENT',
      req.ip,
      'OTP_SEND_FAILED',
      { error: err.message },
      'FAILURE'
    );
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  const ip = req.ip;
  try {
    const { studentId, otp } = req.body;
    if (!studentId || !otp)
      return res.status(400).json({ error: 'Missing fields' });

    const [rows] = await pool.query(
      "SELECT * FROM OTP WHERE user_id = ? AND user_role = 'STUDENT' AND otp_code = ? AND purpose = 'LOGIN' AND used = FALSE ORDER BY created_at DESC LIMIT 1",
      [studentId, otp]
    );
    if (!rows.length) {
      await logAction(
        studentId,
        'STUDENT',
        ip,
        'OTP_VERIFY',
        { reason: 'not_found' },
        'FAILURE'
      );
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    const record = rows[0];
    if (new Date(record.expiry_time) < new Date()) {
      await pool.query('UPDATE OTP SET used = TRUE WHERE otp_id = ?', [
        record.otp_id,
      ]);
      await logAction(studentId, 'STUDENT', ip, 'OTP_EXPIRED', {}, 'FAILURE');
      return res.status(400).json({ error: 'Expired OTP' });
    }

    // Get student details including current last_login_at BEFORE updating
    const [studentRows] = await pool.query(
      'SELECT must_change_password, last_login_at, name, class_id FROM Student WHERE student_id = ?',
      [studentId]
    );
    const previousLoginAt = studentRows.length
      ? studentRows[0].last_login_at
      : null;
    const mustChange = studentRows.length
      ? !!studentRows[0].must_change_password
      : false;
    const studentName = studentRows.length ? studentRows[0].name : '';
    const classId = studentRows.length ? studentRows[0].class_id : '';

    // Update last_login_at to current timestamp (using NOW() to match audit logs timezone)
    await pool.query(
      'UPDATE Student SET last_login_at = NOW() WHERE student_id = ?',
      [studentId]
    );

    // mark OTP as used
    await pool.query('UPDATE OTP SET used = TRUE WHERE otp_id = ?', [
      record.otp_id,
    ]);

    // delete old sessions for this student role only
    await pool.query('DELETE FROM Session WHERE user_id = ? AND role = ?', [
      studentId,
      'STUDENT',
    ]);

    const sessionId = uuidv4();
    const token = jwt.sign(
      { userId: studentId, role: 'STUDENT', sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO Session (session_id, user_id, role, creation_time, expiry_time) VALUES (?, ?, ?, NOW(), ?)',
      [sessionId, studentId, 'STUDENT', expiry]
    );

    await logAction(studentId, 'STUDENT', ip, 'LOGIN_SUCCESS', {});

    res.json({
      token,
      user: {
        id: studentId,
        name: studentName,
        role: 'STUDENT',
        class_id: classId,
        last_login_at: previousLoginAt, // Return the PREVIOUS login time
      },
      must_change_password: mustChange,
    });
  } catch (err) {
    console.error('verifyOtp error', err);
    await logAction(
      req.body.studentId || 'UNKNOWN',
      'STUDENT',
      req.ip,
      'OTP_VERIFY_ERROR',
      { error: err.message },
      'FAILURE'
    );
    res.status(500).json({ error: 'Server error' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const ip = req.ip;
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // detect role
    const [studentRows] = await pool.query(
      'SELECT * FROM Student WHERE student_id = ?',
      [userId]
    );
    const [adminRows] = await pool.query(
      'SELECT * FROM Admin WHERE admin_id = ?',
      [userId]
    );

    const user = studentRows[0] || adminRows[0];
    const role = studentRows.length
      ? 'STUDENT'
      : adminRows.length
        ? 'ADMIN'
        : null;
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Gmail-only support for password reset target
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(String(user.email || ''))) {
      return res
        .status(400)
        .json({
          error: 'Only Gmail addresses are supported (example@gmail.com)',
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO OTP (user_id, user_role, otp_code, expiry_time, purpose, used) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, role, otp, expiry, 'RESET', false]
    );

    await transporter.sendMail({
      from: process.env.OTP_EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset OTP for the College CR Election System',
      html: `
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;'>
          <p>You have requested to reset your password for the <strong>College CR Election System</strong>.</p>
          
          <p>Your One-Time Password (OTP) is:</p>
          
          <div style='background-color: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;'>
            <p style='font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 0;'>${otp}</p>
          </div>
          
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          
          <div style='background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;'>
            <p style='margin: 0 0 10px 0;'><strong>🔒 Security Notice:</strong></p>
            <ul style='margin: 0; padding-left: 20px;'>
              <li style='margin: 5px 0;'>Do not share this code with anyone.</li>
              <li style='margin: 5px 0;'>If you did not request this password reset, please contact support immediately.</li>
              <li style='margin: 5px 0;'>Your current password remains active until you complete the reset process.</li>
            </ul>
          </div>
          
          <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;'>
          
          <p style='margin: 5px 0;'>Thank you,<br>
          <strong>Election Committee</strong><br>
          College CR Election System</p>
        </div>
      `,
    });

    await logAction(userId, role, ip, 'PASSWORD_RESET_OTP_SENT', {});
    res.json({ message: 'Reset OTP sent to registered email' });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const ip = req.ip;
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword)
      return res.status(400).json({ error: 'Missing fields' });

    const [studentRowsRole] = await pool.query(
      'SELECT 1 FROM Student WHERE student_id = ? LIMIT 1',
      [userId]
    );
    const [adminRowsRole] = await pool.query(
      'SELECT 1 FROM Admin WHERE admin_id = ? LIMIT 1',
      [userId]
    );
    const roleForOtp = studentRowsRole.length
      ? 'STUDENT'
      : adminRowsRole.length
        ? 'ADMIN'
        : null;
    if (!roleForOtp) return res.status(404).json({ error: 'User not found' });

    const [rows] = await pool.query(
      "SELECT * FROM OTP WHERE user_id = ? AND user_role = ? AND otp_code = ? AND purpose = 'RESET' AND used = FALSE ORDER BY created_at DESC LIMIT 1",
      [userId, roleForOtp, otp]
    );
    if (!rows.length)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    const record = rows[0];
    if (new Date(record.expiry_time) < new Date()) {
      await pool.query('UPDATE OTP SET used = TRUE WHERE otp_id = ?', [
        record.otp_id,
      ]);
      return res.status(400).json({ error: 'OTP expired' });
    }

    const [studentRows] = await pool.query(
      'SELECT * FROM Student WHERE student_id = ?',
      [userId]
    );
    const [adminRows] = await pool.query(
      'SELECT * FROM Admin WHERE admin_id = ?',
      [userId]
    );
    const table = studentRows.length
      ? 'Student'
      : adminRows.length
        ? 'Admin'
        : null;
    const idField = studentRows.length
      ? 'student_id'
      : adminRows.length
        ? 'admin_id'
        : null;
    const role = studentRows.length ? 'STUDENT' : 'ADMIN';

    if (!table) return res.status(404).json({ error: 'User not found' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE ${table} SET password_hash = ? WHERE ${idField} = ?`,
      [newHash, userId]
    );
    await pool.query('UPDATE OTP SET used = TRUE WHERE otp_id = ?', [
      record.otp_id,
    ]);

    await logAction(userId, role, ip, 'PASSWORD_RESET_SUCCESS', {});
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const ip = req.ip;
  const { newPassword } = req.body;

  try {
    // Ensure user is authenticated and a STUDENT
    if (!req.user || req.user.role !== 'STUDENT')
      return res.status(401).json({ error: 'Not authorized' });

    const studentId = req.user.id;
    if (!newPassword)
      return res.status(400).json({ error: 'Missing newPassword' });

    // Check student exists and must change password
    const [rows] = await pool.query(
      'SELECT must_change_password FROM Student WHERE student_id = ?',
      [studentId]
    );
    if (!rows.length) {
      await logAction(
        studentId,
        'STUDENT',
        ip,
        'PASSWORD_CHANGE_FAILED',
        { reason: 'student_not_found' },
        'FAILURE'
      );
      return res.status(404).json({ error: 'Student not found' });
    }

    const mustChange = rows[0].must_change_password;
    if (!mustChange) {
      await logAction(studentId, 'STUDENT', ip, 'PASSWORD_CHANGE_SKIPPED', {
        reason: 'already_set',
      });
      return res.status(400).json({ error: 'Password already set' });
    }

    // Hash new password securely
    const hash = await bcrypt.hash(newPassword, 10);

    // Update student record
    await pool.query(
      'UPDATE Student SET password_hash = ?, must_change_password = FALSE, last_login_at = NOW() WHERE student_id = ?',
      [hash, studentId]
    );

    await logAction(
      studentId,
      'STUDENT',
      ip,
      'PASSWORD_CHANGE',
      { action: 'initial_password_set' },
      'SUCCESS'
    );

    res.json({
      message: 'Password changed successfully. You can now log in normally.',
    });
  } catch (err) {
    console.error('changePassword error:', err);
    await logAction(
      req.user ? req.user.id : 'UNKNOWN',
      'STUDENT',
      ip,
      'PASSWORD_CHANGE_ERROR',
      { error: err.message },
      'FAILURE'
    );
    res.status(500).json({ error: 'Server error' });
  }
};

// LOGOUT (invalidate session)
exports.logout = async (req, res) => {
  const ip = req.ip;
  try {
    if (!req.user || !req.user.sessionId)
      return res.status(401).json({ error: 'Not logged in' });

    await pool.query('DELETE FROM Session WHERE session_id = ?', [
      req.user.sessionId,
    ]);
    await logAction(req.user.id, req.user.role, ip, 'LOGOUT', {});
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
