# Last Login Feature - Complete Setup Guide

## 🗄️ **Step 1: Database Migration**

Run this SQL command to add the `last_login_at` column to the Admin table:

```sql
ALTER TABLE Admin 
ADD COLUMN last_login_at DATETIME DEFAULT NULL 
AFTER password_hash;
```

**Note:** The Student table already has a `last_login` column, so no changes needed there.

### How to Run the Migration:

**Option 1: Using MySQL Command Line**
```bash
mysql -u your_username -p your_database_name < backend/migrations/add_last_login_tracking.sql
```

**Option 2: Using MySQL Workbench or phpMyAdmin**
1. Open your MySQL client
2. Select your database
3. Run the SQL command above

**Option 3: Direct Query**
```bash
mysql -u your_username -p
USE your_database_name;
ALTER TABLE Admin ADD COLUMN last_login_at DATETIME DEFAULT NULL AFTER password_hash;
```

## ✅ **Step 2: Verify Database Changes**

Check if the column was added successfully:

```sql
-- Check Admin table structure
DESCRIBE Admin;

-- You should see:
-- +------------------+--------------+------+-----+---------+-------+
-- | Field            | Type         | Null | Key | Default | Extra |
-- +------------------+--------------+------+-----+---------+-------+
-- | admin_id         | varchar(20)  | NO   | PRI | NULL    |       |
-- | name             | varchar(100) | NO   |     | NULL    |       |
-- | email            | varchar(100) | NO   |     | NULL    |       |
-- | password_hash    | varchar(255) | NO   |     | NULL    |       |
-- | last_login_at    | datetime     | YES  |     | NULL    |       | <- NEW
-- | created_at       | datetime     | YES  |     | CURRENT_TIMESTAMP | |
-- +------------------+--------------+------+-----+---------+-------+

-- Check Student table (already has last_login)
DESCRIBE Student;
```

## 🔧 **Step 3: Backend Changes (Already Applied)**

The following files have been updated:

### ✅ `backend/controllers/authController.js`

**Admin Login (`exports.adminLogin`):**
- Captures previous `last_login_at` before updating
- Updates `last_login_at` to current timestamp
- Returns `last_login_at` in response

**Student OTP Verification (`exports.verifyOtp`):**
- Captures previous `last_login` before updating
- Updates `last_login` to current timestamp
- Returns `last_login_at` in response

## 🎨 **Step 4: Frontend Changes (Already Applied)**

All frontend files are ready:
- ✅ Toast notification system enhanced
- ✅ Dashboard components updated
- ✅ AuthContext configured
- ✅ Utility functions created

## 🚀 **Step 5: Testing**

### Test Admin Login:

1. **First-time login** (or if never logged in before):
   ```
   - Login as admin
   - Should see NO last login toast (because last_login_at is NULL)
   - Backend updates last_login_at to current time
   ```

2. **Subsequent login**:
   ```
   - Login as admin again
   - Backend returns previous login timestamp
   - Toast appears at top-right: "Last Login: [date/time]"
   - Backend updates last_login_at to new current time
   ```

### Test Student Login:

1. **First-time login**:
   ```
   - Login as student (enter credentials)
   - Verify OTP
   - Should see NO last login toast
   - Backend updates last_login to current time
   ```

2. **Subsequent login**:
   ```
   - Login as student again
   - Verify OTP
   - Toast appears: "Last Login: [date/time]"
   - Backend updates last_login to new current time
   ```

## 🔍 **Step 6: Verify Backend Response**

### Admin Login Response:
```json
{
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "ADM001",
    "name": "Admin Name",
    "email": "admin@example.com"
  },
  "last_login_at": "2025-10-21T18:30:00.000Z"  // ← This field
}
```

### Student OTP Verification Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "21J41A05C6",
  "role": "STUDENT",
  "must_change_password": false,
  "last_login_at": "2025-10-21T14:15:00.000Z"  // ← This field
}
```

## 🧪 **Testing Checklist**

- [ ] Database migration completed successfully
- [ ] Admin table has `last_login_at` column
- [ ] Backend returns `last_login_at` in admin login response
- [ ] Backend returns `last_login_at` in student OTP verification response
- [ ] Toast appears on admin dashboard after login
- [ ] Toast appears on student dashboard after login
- [ ] Toast shows correct formatted date/time
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Toast can be manually closed with X button
- [ ] Toast only appears once per login session
- [ ] First-time login shows no toast (NULL timestamp)

## 🐛 **Troubleshooting**

### Issue: Toast doesn't appear

**Solution 1:** Check browser console
```javascript
// Open browser console (F12)
// Look for errors
// Check if localStorage has 'lastLoginAt'
console.log(localStorage.getItem('lastLoginAt'));
```

**Solution 2:** Check backend response
```bash
# In browser Network tab
# Look at login response
# Verify 'last_login_at' field exists
```

**Solution 3:** Verify database
```sql
-- Check if timestamp is being saved
SELECT admin_id, last_login_at FROM Admin;
SELECT student_id, last_login FROM Student;
```

### Issue: Column doesn't exist error

**Error:** `Unknown column 'last_login_at' in 'field list'`

**Solution:** Run the migration SQL:
```sql
ALTER TABLE Admin ADD COLUMN last_login_at DATETIME DEFAULT NULL AFTER password_hash;
```

### Issue: Toast shows on every page load

**Solution:** Check if localStorage cleanup is working
```javascript
// The dashboard should remove the timestamp after showing it
// If it persists, manually clear it:
localStorage.removeItem('lastLoginAt');
```

## 📊 **Database Query Examples**

### View all admin last logins:
```sql
SELECT 
  admin_id, 
  name, 
  last_login_at,
  TIMESTAMPDIFF(DAY, last_login_at, NOW()) as days_since_login
FROM Admin
ORDER BY last_login_at DESC;
```

### View all student last logins:
```sql
SELECT 
  student_id, 
  name, 
  last_login,
  TIMESTAMPDIFF(DAY, last_login, NOW()) as days_since_login
FROM Student
ORDER BY last_login DESC;
```

### Find inactive users (not logged in for 30+ days):
```sql
-- Admins
SELECT admin_id, name, last_login_at
FROM Admin
WHERE last_login_at IS NULL 
   OR last_login_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Students
SELECT student_id, name, last_login
FROM Student
WHERE last_login IS NULL 
   OR last_login < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🎯 **Next Steps**

1. ✅ Run database migration
2. ✅ Restart backend server
3. ✅ Test admin login
4. ✅ Test student login
5. ✅ Verify toast notifications appear
6. ✅ Monitor audit logs for login activity

## 🔒 **Security Benefits**

This feature helps users:
- Detect unauthorized access to their accounts
- Monitor their login activity
- Identify suspicious login patterns
- Increase overall security awareness

---

**Need Help?** Check the main documentation in `LAST_LOGIN_FEATURE.md`
