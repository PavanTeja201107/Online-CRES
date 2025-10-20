// controllers/adminController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const logAction = require('../utils/logAction');
const nodemailer = require('nodemailer');

// =============== ADMIN PROFILE ===============
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const [rows] = await pool.query(
      'SELECT admin_id, name, email, created_at FROM Admin WHERE admin_id = ?',
      [adminId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Admin not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email } = req.body;
    if (!name && !email)
      return res.status(400).json({ error: 'No fields provided' });

    await pool.query(
      'UPDATE Admin SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE admin_id = ?',
      [name, email, adminId]
    );
    await logAction(adminId, req.user.role, req.ip, 'ADMIN_PROFILE_UPDATE', { name, email });
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =============== CLASS MANAGEMENT ===============
exports.listClasses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Class ORDER BY class_id');
    res.json(rows);
  } catch (err) {
    console.error('listClasses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { class_name } = req.body;
    if (!class_name) return res.status(400).json({ error: 'class_name required' });

    const [result] = await pool.query('INSERT INTO Class (class_name) VALUES (?)', [class_name]);
    await logAction(req.user.id, req.user.role, req.ip, 'CLASS_CREATED', { class_id: result.insertId });
    res.json({ message: 'Class created', class_id: result.insertId });
  } catch (err) {
    console.error('createClass error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    const force = String(req.query.force || '').toLowerCase() === 'true' || req.query.force === '1';

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [studentsRows] = await conn.query('SELECT student_id, email, name FROM Student WHERE class_id = ?', [id]);
      const studentsCount = studentsRows.length;

      if (studentsCount > 0 && !force) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          error: 'Class has enrolled students. Re-run with force=true to delete class, its students, and all related elections, nominations and votes. Notifications will be sent to enrolled students.'
        });
      }

      const studentIds = studentsRows.map(s => s.student_id);

      // Pre-clean tables that do not have FK cascades to Student
      if (studentIds.length) {
        const placeholders = studentIds.map(() => '?').join(',');
        await conn.query(`DELETE FROM PolicyAcceptance WHERE user_role='STUDENT' AND user_id IN (${placeholders})`, studentIds);
        await conn.query(`DELETE FROM Session WHERE role='STUDENT' AND user_id IN (${placeholders})`, studentIds);
        await conn.query(`DELETE FROM OTP WHERE user_role='STUDENT' AND user_id IN (${placeholders})`, studentIds);
      }

      // Deleting the class will CASCADE to Student, Election, Nomination, VotingToken, VoterStatus, VoteAnonymous as per schema
      const [delRes] = await conn.query('DELETE FROM Class WHERE class_id = ?', [id]);
      if (delRes.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Class not found' });
      }

      await logAction(req.user.id, req.user.role, req.ip, 'CLASS_DELETED', { class_id: id, force, students_removed: studentsCount });
      await conn.commit();
      conn.release();

      // Notify affected students by email (best-effort, outside transaction)
      try {
        if (studentsRows.length) {
          const host = process.env.SMTP_HOST;
          const port = parseInt(process.env.SMTP_PORT || '587');
          const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS;
          if (host && user && pass) {
            const transporter = require('nodemailer').createTransport({ host, port, secure: false, auth: { user, pass } });
            for (const s of studentsRows) {
              if (!s.email) continue;
              const text = [
                `Dear ${s.name || s.student_id},`,
                '',
                `We are informing you that your class (ID: ${id}) has been removed from the Class Representative Election System by an administrator.`,
                'As part of this action, all dependent data associated with the class has been deleted, including:',
                '- Student accounts for this class',
                '- Elections, nominations and voting records for this class',
                '',
                'If this was unexpected, please contact the administration team.',
                '',
                'Regards,',
                'Election Committee'
              ].join('\n');
              await transporter.sendMail({
                from: process.env.OTP_EMAIL_FROM,
                to: s.email,
                subject: 'Notice: Class removed from the Election System',
                text
              });
            }
          }
        }
      } catch (mailErr) {
        console.error('deleteClass notification email error:', mailErr && mailErr.message ? mailErr.message : mailErr);
      }

      res.json({ message: 'Class deleted successfully', studentsRemoved: studentsCount, force });
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw err;
    }
  } catch (err) {
    console.error('deleteClass error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =============== STUDENT MANAGEMENT ===============
exports.listStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT student_id, name, email, class_id, must_change_password, created_at FROM Student'
    );
    res.json(rows);
  } catch (err) {
    console.error('listStudents error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM Student WHERE student_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getStudent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, date_of_birth, class_id } = req.body;
    if (!name || !email || !date_of_birth || !class_id) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Gmail-only email enforcement
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(String(email))) {
      return res.status(400).json({ error: 'Only Gmail addresses are supported (example@gmail.com)' });
    }

  // Validate DOB format
    const [yyyy, mm, dd] = (date_of_birth || '').split('-');
    if (!yyyy || !mm || !dd) return res.status(400).json({ error: 'Invalid date_of_birth format (YYYY-MM-DD)' });

    // Always auto-generate student_id in the format: classId + 4-digit sequence (classIdXXXX)
    const conn = await pool.getConnection();
    let student_id;
    let defaultPassword;
    try {
      await conn.beginTransaction();

      // Ensure class exists for clearer error (optional but user-friendly)
      const [classRows] = await conn.query('SELECT 1 FROM Class WHERE class_id = ? LIMIT 1', [class_id]);
      if (!classRows.length) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'Invalid class_id' });
      }

      // Lock rows for this class to avoid race conditions and find the max suffix used so far
  const [lastRows] = await conn.query('SELECT student_id FROM Student WHERE class_id = ? ORDER BY student_id DESC LIMIT 1 FOR UPDATE', [class_id]);
      let next = 1;
      if (lastRows.length) {
        const lastId = String(lastRows[0].student_id);
        const prefix = `${class_id}_`;
        const suffixPart = lastId.startsWith(prefix) ? lastId.slice(prefix.length) : lastId.slice(String(class_id).length + 1);
        const parsed = parseInt(suffixPart, 10);
        if (!isNaN(parsed)) next = parsed + 1;
      }

      let attempts = 0;
      while (attempts < 50) {
        const suffix = String(next).padStart(4, '0');
        student_id = `${class_id}_${suffix}`;
  // Default password rule: ddmmyyyy
  defaultPassword = `${dd}${mm}${yyyy}`.toLowerCase();
        const hash = await bcrypt.hash(defaultPassword, 10);
        try {
          await conn.query(
            'INSERT INTO Student (student_id, name, email, date_of_birth, class_id, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student_id, name, email, date_of_birth, class_id, hash, true]
          );
          // success
          break;
        } catch (e) {
          if (e && e.code === 'ER_DUP_ENTRY') {
            // someone inserted concurrently; try next number
            next += 1;
            attempts += 1;
            continue;
          }
          throw e;
        }
      }

      if (!student_id) {
        await conn.rollback();
        conn.release();
        return res.status(409).json({ error: 'Failed to generate a unique Student ID. Please retry.' });
      }

      await logAction(req.user.id, req.user.role, req.ip, 'STUDENT_CREATED', { student_id, auto: true });
      await conn.commit();
      conn.release();
    } catch (txErr) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw txErr;
    }

    // Attempt to send welcome email with credentials (best-effort, outside transaction)
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || '587');
      const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS;
      if (host && user && pass) {
        const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });
  const subject = 'Welcome to Class Representative Election System';
        const lines = [
          `Dear ${name},`,
          '',
          'Your student account has been created. Please use the following credentials to log in and complete your first-time password change:',
          '',
          `Student ID: ${student_id}`,
          `Default Password: ${defaultPassword}`,
          '',
          'Your profile:',
          `- Name: ${name}`,
          `- Email: ${email}`,
          `- Class ID: ${class_id}`,
          `- Date of Birth: ${date_of_birth}`,
          '',
          'For security, you will be required to set a new password on first login.',
          '',
          'Regards,',
          'Election Committee'
        ];
        await transporter.sendMail({ from: process.env.OTP_EMAIL_FROM, to: email, subject, text: lines.join('\n') });
      }
    } catch (mailErr) {
      console.error('createStudent welcome email error:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    res.json({ message: 'Student created successfully', defaultPassword, student_id });
  } catch (err) {
    console.error('createStudent error:', err);
    if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid class_id' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, class_id } = req.body;
    if (email) {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!gmailRegex.test(String(email))) {
        return res.status(400).json({ error: 'Only Gmail addresses are supported (example@gmail.com)' });
      }
    }
    await pool.query(
      'UPDATE Student SET name = COALESCE(?, name), email = COALESCE(?, email), class_id = COALESCE(?, class_id) WHERE student_id = ?',
      [name, email, class_id, id]
    );
    await logAction(req.user.id, req.user.role, req.ip, 'STUDENT_UPDATED', { student_id: id });
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('updateStudent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM Student WHERE student_id = ?', [id]);
    await logAction(req.user.id, req.user.role, req.ip, 'STUDENT_DELETED', { student_id: id });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetStudentPassword = async (req, res) => {
  try {
    const id = req.params.id;
  const [rows] = await pool.query('SELECT date_of_birth, student_id FROM Student WHERE student_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    const dob = rows[0].date_of_birth;
    let tempPassword;
    if (dob) {
      const yyyy = String(dob).slice(0,4);
      const mm = String(dob).slice(5,7);
      const dd = String(dob).slice(8,10);
      tempPassword = `${dd}${mm}${yyyy}`.toLowerCase();
    } else {
      // fallback temp
      tempPassword = 'reset' + Math.floor(1000 + Math.random()*9000);
    }
    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE Student SET password_hash=?, must_change_password=TRUE WHERE student_id=?', [hash, id]);
    await logAction(req.user.id, req.user.role, req.ip, 'STUDENT_PASSWORD_RESET', { student_id: id });
    res.json({ message: `Password reset for ${id}`, tempPassword });
  } catch (err) {
    console.error('resetStudentPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
