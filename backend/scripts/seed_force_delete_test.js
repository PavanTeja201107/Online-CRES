/*
 Seed a test class with students, election, nominations, sessions etc.,
 then invoke adminController.deleteClass with force=true and verify cascades and cleanup.
 Run with: npm run test:force-delete
*/

require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const adminCtrl = require('../controllers/adminController');

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log('== Force-delete E2E test: seeding data ==');
    await conn.beginTransaction();

    // Ensure admin exists
    const adminId = process.env.TEST_ADMIN_ID || 'admin1';
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin1@gmail.com';
    const adminName = 'Test Admin';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@123456';
    const [aRows] = await conn.query('SELECT 1 FROM Admin WHERE admin_id = ? LIMIT 1', [adminId]);
    if (!aRows.length) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await conn.query(
        'INSERT INTO Admin (admin_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        [adminId, adminName, adminEmail, hash]
      );
      console.log('Inserted Admin:', adminId);
    }

    // Create class
    const [cRes] = await conn.query('INSERT INTO Class (class_name) VALUES (?)', ['Force Delete Test Class']);
    const classId = cRes.insertId;
    console.log('Created Class:', classId);

    // Create students
    const students = [
      { id: 'S1001', name: 'Alice', email: 'alice.test@gmail.com', dob: '2004-01-02' },
      { id: 'S1002', name: 'Bob', email: 'bob.test@gmail.com', dob: '2004-03-04' },
    ];
    for (const s of students) {
      const defaultPassword = `${s.dob.slice(8,10)}${s.dob.slice(5,7)}${s.dob.slice(0,4)}${s.id.slice(0,4)}`.toLowerCase();
      const hash = await bcrypt.hash(defaultPassword, 10);
      await conn.query(
        'INSERT INTO Student (student_id, name, email, date_of_birth, class_id, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
        [s.id, s.name, s.email, s.dob, classId, hash]
      );
    }
    console.log('Inserted Students:', students.map(s=>s.id).join(','));

    // Insert fake student sessions (to verify they get removed)
    const now = new Date();
    const expiry = new Date(now.getTime() + 60*60*1000);
    for (const s of students) {
      const sid = `sess-${s.id}-${Date.now()}`;
      await conn.query(
        'INSERT INTO Session (session_id, user_id, role, creation_time, expiry_time) VALUES (?, ?, \'STUDENT\', NOW(), ?)',
        [sid, s.id, expiry]
      );
    }

    // Create an election for the class (timeline around now)
    const ns = new Date(Date.now() - 2*60*60*1000); // 2h ago
    const ne = new Date(Date.now() - 1*60*60*1000); // 1h ago
    const vs = new Date(Date.now() + 1*60*60*1000); // 1h later
    const ve = new Date(Date.now() + 2*60*60*1000); // 2h later
    const [eRes] = await conn.query(
      'INSERT INTO Election (class_id, nomination_start, nomination_end, voting_start, voting_end, is_active, is_published, created_by_admin_id) VALUES (?, ?, ?, ?, ?, FALSE, FALSE, ?)',
      [classId, ns, ne, vs, ve, adminId]
    );
    const electionId = eRes.insertId;
    console.log('Created Election:', electionId);

    // Create nominations for students
    for (const s of students) {
      await conn.query(
        'INSERT INTO Nomination (election_id, student_id, manifesto, status) VALUES (?, ?, ?, \'PENDING\')',
        [electionId, s.id, `${s.name} manifesto`]
      );
    }

    // Create voter tracking rows
    for (const s of students) {
      await conn.query(
        'INSERT INTO VoterStatus (student_id, election_id, has_voted) VALUES (?, ?, FALSE) ON DUPLICATE KEY UPDATE has_voted=has_voted',
        [s.id, electionId]
      );
    }

    await conn.commit();
    conn.release();

    // Now invoke controller to delete class with force=true
    console.log('== Invoking force delete ==');
    const req = {
      params: { id: String(classId) },
      query: { force: 'true' },
      user: { id: adminId, role: 'ADMIN', sessionId: 'test' },
      ip: '127.0.0.1'
    };
    const result = await new Promise((resolve, reject) => {
      const res = {
        _status: 200,
        status(code){ this._status = code; return this; },
        json(obj){ resolve({ status: this._status, body: obj }); }
      };
      adminCtrl.deleteClass(req, res).catch(reject);
    });
    console.log('Controller response:', result);

    // Verify: class gone
    const [c2] = await pool.query('SELECT * FROM Class WHERE class_id = ?', [classId]);
    const [s2] = await pool.query('SELECT * FROM Student WHERE class_id = ?', [classId]);
    const [e2] = await pool.query('SELECT * FROM Election WHERE class_id = ?', [classId]);
    const [n2] = await pool.query('SELECT * FROM Nomination WHERE election_id = ?', [electionId]);
    const [vs2] = await pool.query('SELECT * FROM VoterStatus WHERE election_id = ?', [electionId]);
    const [vt2] = await pool.query('SELECT * FROM VotingToken WHERE election_id = ?', [electionId]);
    const [sess2] = await pool.query('SELECT * FROM Session WHERE user_id IN (?, ?) AND role=\'STUDENT\'', [students[0].id, students[1].id]);

    console.log('After deletion:');
    console.log(' Class rows:', c2.length);
    console.log(' Students in class:', s2.length);
    console.log(' Elections for class:', e2.length);
    console.log(' Nominations for election:', n2.length);
    console.log(' VoterStatus rows:', vs2.length);
    console.log(' VotingToken rows:', vt2.length);
    console.log(' Student sessions remaining:', sess2.length);

    const ok = c2.length===0 && s2.length===0 && e2.length===0 && n2.length===0 && vs2.length===0 && vt2.length===0 && sess2.length===0;
    if (!ok) {
      console.error('Verification FAILED. See counts above.');
      process.exitCode = 1;
    } else {
      console.log('Verification PASSED. All linked data removed and sessions cleared.');
    }
  } catch (err) {
    try { await conn.rollback(); } catch {_} {}
    conn.release();
    console.error('Test error:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    // close pool to end process
    setTimeout(()=>{ pool.end(); }, 250);
  }
}

main();
