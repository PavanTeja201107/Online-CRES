# Professional Email Templates - Implementation Guide

## 📧 Overview

This document describes all email templates used in the Class Representative Election System, with professional formatting and strategic use of bold emphasis for key information.

**Design Philosophy:**
- **Clear Structure**: Visual separators and sections
- **Bold Emphasis**: Key information highlighted with asterisks (*)
- **Professional Tone**: Formal yet approachable
- **Actionable**: Clear next steps for recipients
- **Security-Aware**: Warnings and best practices included

---

## 📨 Email Templates Implemented

### 1. Welcome Email (New Account Creation)

**Trigger:** When admin creates a new student account
**File:** `backend/controllers/adminController.js` → `createStudent` function
**Recipients:** Newly created student

**Subject:**
```
Welcome to the Class Representative Election System - Your Account Details
```

**Key Features:**
- ✅ Visual separators using `═══════`
- ✅ Bold emphasis on *Student ID* and *Default Password*
- ✅ Security warning about password confidentiality
- ✅ Profile details review section
- ✅ Prominent *ACTION REQUIRED* section for password change
- ✅ Next steps with numbered list
- ✅ Support contact placeholder

**Sample Output:**
```
Dear John Doe,

Welcome to the Class Representative Election System! Your student account has been successfully created.

═══════════════════════════════════════════════════════
              YOUR ACCOUNT CREDENTIALS
═══════════════════════════════════════════════════════

*Student ID:* CS101_0001
*Default Password:* TempPass123

⚠️  IMPORTANT: Keep your password secure and do not share it with anyone.

═══════════════════════════════════════════════════════
              YOUR PROFILE DETAILS
═══════════════════════════════════════════════════════

- Name: John Doe
- Email: john.doe@gmail.com
- Class ID: CS101
- Date of Birth: 2000-01-15

Please review these details for accuracy...

═══════════════════════════════════════════════════════
              ACTION REQUIRED
═══════════════════════════════════════════════════════

🔐 *You must change your password upon first login for security purposes.*

This is a mandatory security measure to ensure your account remains protected.
```

---

### 2. Nomination Window Open Email

**Trigger:** Admin notifies students about nomination period
**File:** `backend/controllers/electionsController.js` → `notifyNominationOpen` function
**Recipients:** All students in the election class

**Subject:**
```
Nomination Window for Class Representative Election is Now Open!
```

**Key Features:**
- ✅ Exciting header with 🎯 emoji
- ✅ Bold emphasis on *Start Date/Time* and *End Date/Time (Deadline)*
- ✅ Timezone note for clarity
- ✅ Step-by-step HOW TO NOMINATE section
- ✅ Eligibility information section
- ✅ Support contact

**Sample Output:**
```
Dear Student,

🎯 The Nomination Window for the Class Representative Election is Now Open!

═══════════════════════════════════════════════════════
              NOMINATION PERIOD
═══════════════════════════════════════════════════════

*Start Date/Time:* October 21, 2025 at 9:00 AM
*End Date/Time (Deadline):* October 25, 2025 at 5:00 PM

⚠️  Note: All times are in your local timezone.

═══════════════════════════════════════════════════════
              HOW TO NOMINATE
═══════════════════════════════════════════════════════

If you are eligible and wish to run for Class Representative:

1. Log in to the Class Representative Election System
2. Navigate to the Nomination page: [Nomination Page URL]
3. Review and accept the Nomination Policy
4. Submit your nomination with your manifesto
```

---

### 3. Voting Window Open Email

**Trigger:** Admin notifies students about voting period
**File:** `backend/controllers/electionsController.js` → `notifyVotingOpen` function
**Recipients:** All students in the election class

**Subject:**
```
Voting is Now Open for the Class Representative Election!
```

**Key Features:**
- ✅ Exciting header with 🗳️ emoji
- ✅ Bold emphasis on *Voting Start Date/Time* and *Voting End Date/Time (Deadline)*
- ✅ Timezone note
- ✅ Step-by-step HOW TO VOTE section
- ✅ Motivational "YOUR VOTE MATTERS" section
- ✅ Encouragement for participation

**Sample Output:**
```
Dear Student,

🗳️  Voting is Now Open for the Class Representative Election!

═══════════════════════════════════════════════════════
              VOTING PERIOD
═══════════════════════════════════════════════════════

*Voting Start Date/Time:* October 26, 2025 at 9:00 AM
*Voting End Date/Time (Deadline):* October 28, 2025 at 5:00 PM

⚠️  Note: All times are in your local timezone.

═══════════════════════════════════════════════════════
              HOW TO VOTE
═══════════════════════════════════════════════════════

1. Visit the Class Representative Election System
2. Log in with your Student ID and password
3. Navigate to the Voting page: [Voting Page URL]
4. Review the candidates and their manifestos
5. Accept the Voting Policy
6. Cast your vote securely

═══════════════════════════════════════════════════════
              YOUR VOTE MATTERS
═══════════════════════════════════════════════════════

Your participation is crucial for a fair and democratic election process.
Every eligible student is encouraged to exercise their right to vote.

Make your voice heard and help choose your Class Representative!
```

---

### 4. Login OTP Email

**Trigger:** Student requests OTP for login
**File:** `backend/controllers/authController.js` → `login` function (exports.login)
**Recipients:** Student logging in

**Subject:**
```
Your Login OTP for the CR Election System
```

**Key Features:**
- ✅ Minimal greeting (action-focused)
- ✅ Bold emphasis on *OTP code*
- ✅ Bold emphasis on *5 minutes* validity
- ✅ Security warning: "Do not share"
- ✅ "If you didn't request" warning
- ✅ Clean, scannable format

**Sample Output:**
```
═══════════════════════════════════════════════════════
     YOUR LOGIN OTP FOR CR ELECTION SYSTEM
═══════════════════════════════════════════════════════

Your One-Time Password (OTP) is: *123456*

⏰ This code is valid for *5 minutes* only.

═══════════════════════════════════════════════════════
              SECURITY WARNING
═══════════════════════════════════════════════════════

🔒 *Do not share this code with anyone.*

⚠️  If you did not request this code, please contact support immediately.

═══════════════════════════════════════════════════════

Class Representative Election System
```

---

### 5. Password Reset OTP Email

**Trigger:** User requests password reset
**File:** `backend/controllers/authController.js` → `requestPasswordReset` function
**Recipients:** User requesting password reset

**Subject:**
```
Password Reset OTP for the CR Election System
```

**Key Features:**
- ✅ Similar to login OTP but with password reset context
- ✅ Bold emphasis on *OTP code*
- ✅ Bold emphasis on *10 minutes* validity (longer than login OTP)
- ✅ Additional security note: "current password remains active"
- ✅ Security warning

**Sample Output:**
```
═══════════════════════════════════════════════════════
   PASSWORD RESET OTP FOR CR ELECTION SYSTEM
═══════════════════════════════════════════════════════

Your One-Time Password (OTP) for password reset is: *654321*

⏰ This code is valid for *10 minutes* only.

═══════════════════════════════════════════════════════
              SECURITY WARNING
═══════════════════════════════════════════════════════

🔒 *Do not share this code with anyone.*

⚠️  If you did not request a password reset, please contact support immediately.
    Your current password remains active until you complete the reset process.

═══════════════════════════════════════════════════════

Class Representative Election System
```

---

### 6. Class Removed Notice Email

**Trigger:** Admin deletes a class (with force flag)
**File:** `backend/controllers/adminController.js` → `deleteClass` function
**Recipients:** All students in the deleted class

**Subject:**
```
Important Notice: Your Class Has Been Removed from the Election System
```

**Key Features:**
- ✅ Clear, direct subject line
- ✅ Bold emphasis on *Class ID*
- ✅ Bulleted list with *bold* consequences (Student accounts, Elections, Nominations, Voting records)
- ✅ Irreversibility warning
- ✅ Clear next steps if this was an error
- ✅ Admin contact placeholders with emojis

**Sample Output:**
```
Dear Student,

═══════════════════════════════════════════════════════
     IMPORTANT NOTICE: CLASS REMOVED FROM SYSTEM
═══════════════════════════════════════════════════════

We are informing you that your class (ID: *CS101*) has been removed from the
Class Representative Election System by an administrator.

═══════════════════════════════════════════════════════
              IMPACT OF THIS ACTION
═══════════════════════════════════════════════════════

As a result of this removal, the following data has been permanently deleted:

- *Student accounts* for this class have been deleted
- *Election records* for this class have been deleted
- *Nomination records* for this class have been deleted
- *Voting records* for this class have been deleted

⚠️  This action is irreversible and all associated data cannot be recovered.

═══════════════════════════════════════════════════════
              NEXT STEPS
═══════════════════════════════════════════════════════

❓ If this removal was unexpected or you believe this is an error,
   please contact the administration team immediately at:

   📧 [Admin Contact Email]
   🔗 [Admin Contact Link]

═══════════════════════════════════════════════════════

Regards,
Election Committee
Class Representative Election System
```

---

## 🎨 Formatting Conventions

### Bold Emphasis Using Asterisks
Plain text emails can't use HTML bold tags, but many email clients (including Gmail) render `*text*` with visual emphasis.

**Usage:**
```
*Student ID:* CS101_0001        ← Bold label
*Default Password:* TempPass123  ← Bold label
*5 minutes*                      ← Bold duration
```

### Visual Separators
```
═══════════════════════════════════════════════════════
              SECTION TITLE
═══════════════════════════════════════════════════════
```

### Emojis for Visual Cues
- 🔒 Security-related
- ⏰ Time-sensitive
- ⚠️  Warning/Important
- 🎯 Goal/Target
- 🗳️  Voting
- ❓ Question/Help
- 📧 Email contact
- 🔗 Link

### Lists
- Use hyphens `-` for bullet points
- Use numbers `1.` `2.` for sequential steps

---

## 🔧 Technical Implementation

### How Bold Text Works in Plain Text Emails

**Method 1: Asterisk Wrapping** (Implemented)
```javascript
const text = `*Student ID:* ${student_id}`;
```

**Renders in email clients as:**
- Gmail: Shows with bold or emphasized styling
- Outlook: May show asterisks (fallback is acceptable)
- Apple Mail: Typically emphasizes

**Method 2: HTML Email (Alternative)**
If you want guaranteed bold, consider sending HTML emails:
```javascript
await transporter.sendMail({
  from: process.env.OTP_EMAIL_FROM,
  to: email,
  subject: subject,
  html: `<p><strong>Student ID:</strong> ${student_id}</p>` // HTML version
  text: `*Student ID:* ${student_id}` // Plain text fallback
});
```

### Placeholder Replacement

The templates include placeholders that should be replaced with actual URLs:

**Current Placeholders:**
- `[Login Page URL]` → Replace with actual login URL
- `[Nomination Page URL]` → Replace with actual nomination URL
- `[Voting Page URL]` → Replace with actual voting URL
- `[Support Email Address]` → Replace with actual support email
- `[Admin Contact Email]` → Replace with actual admin email
- `[Admin Contact Link]` → Replace with actual admin contact page
- `[Eligibility Criteria Link]` → Replace with actual eligibility page

**Example Implementation:**
```javascript
const LOGIN_URL = process.env.FRONTEND_URL + '/student/login';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@crelection.edu';

const text = lines.join('\n')
  .replace('[Login Page URL]', LOGIN_URL)
  .replace('[Support Email Address]', SUPPORT_EMAIL);
```

---

## 📋 Testing Checklist

### Visual Testing
- [ ] Send test emails to Gmail account
- [ ] Send test emails to Outlook account
- [ ] Send test emails to Apple Mail
- [ ] Verify bold emphasis renders correctly
- [ ] Verify visual separators align properly
- [ ] Verify emojis display correctly

### Content Testing
- [ ] All dynamic variables populate correctly (name, dates, IDs)
- [ ] No placeholder text remains (all [brackets] replaced)
- [ ] Timezone notes are accurate
- [ ] Links are clickable and correct
- [ ] Contact information is accurate

### Functional Testing
- [ ] Welcome email sent on student creation
- [ ] Nomination email sent when notification triggered
- [ ] Voting email sent when notification triggered
- [ ] Login OTP email sent on student login
- [ ] Password reset OTP email sent on reset request
- [ ] Class removal email sent to all affected students

---

## 🚀 Deployment Steps

### 1. Update Environment Variables
Add these to your `.env` file:
```env
FRONTEND_URL=https://your-election-system.com
SUPPORT_EMAIL=support@crelection.edu
ADMIN_CONTACT_EMAIL=admin@crelection.edu
ADMIN_CONTACT_URL=https://your-election-system.com/contact
ELIGIBILITY_URL=https://your-election-system.com/eligibility
```

### 2. Create Placeholder Replacement Utility (Optional)
Create `backend/utils/emailTemplates.js`:
```javascript
const replacePlaceholders = (text) => {
  return text
    .replace(/\[Login Page URL\]/g, process.env.FRONTEND_URL + '/student/login')
    .replace(/\[Nomination Page URL\]/g, process.env.FRONTEND_URL + '/student/nomination')
    .replace(/\[Voting Page URL\]/g, process.env.FRONTEND_URL + '/student/vote')
    .replace(/\[Support Email Address\]/g, process.env.SUPPORT_EMAIL)
    .replace(/\[Admin Contact Email\]/g, process.env.ADMIN_CONTACT_EMAIL)
    .replace(/\[Admin Contact Link\]/g, process.env.ADMIN_CONTACT_URL)
    .replace(/\[Eligibility Criteria Link\]/g, process.env.ELIGIBILITY_URL);
};

module.exports = { replacePlaceholders };
```

### 3. Apply to All Email Templates
```javascript
const { replacePlaceholders } = require('../utils/emailTemplates');

const emailText = replacePlaceholders(lines.join('\n'));
await transporter.sendMail({ ..., text: emailText });
```

### 4. Restart Backend
```bash
cd backend
npm restart
```

---

## 📊 Comparison: Old vs New Templates

| Aspect | Old Templates | New Templates |
|--------|---------------|---------------|
| **Structure** | Plain paragraphs | Visual sections with separators |
| **Emphasis** | No emphasis | Bold (*asterisks*) on key info |
| **Clarity** | Basic information | Categorized with clear headers |
| **Security** | Minimal warnings | Prominent security warnings |
| **Actionability** | General instructions | Numbered steps, clear CTAs |
| **Visual Appeal** | Plain text block | Emojis, separators, hierarchy |
| **Professionalism** | Basic | Enhanced, branded |

---

## 🔮 Future Enhancements

### Potential Improvements:
1. **HTML Email Support**: Send both HTML and plain text versions
2. **Email Templates Engine**: Use handlebars or EJS for templating
3. **Internationalization**: Multi-language email support
4. **Email Analytics**: Track open rates and click-through rates
5. **Personalization**: More dynamic content based on user behavior
6. **Branded Header/Footer**: Add logo and brand colors (requires HTML)
7. **Attachment Support**: PDF guides, nomination forms, etc.
8. **Email Preferences**: Allow users to opt-in/out of certain notifications

---

## 📞 Maintenance

### Files Modified:
1. `backend/controllers/adminController.js`
   - Welcome email (createStudent function)
   - Class removal notice (deleteClass function)

2. `backend/controllers/electionsController.js`
   - Nomination window open email (notifyNominationOpen function)
   - Voting window open email (notifyVotingOpen function)

3. `backend/controllers/authController.js`
   - Login OTP email (login function)
   - Password reset OTP email (requestPasswordReset function)

### Common Issues:
1. **Asterisks showing instead of bold**: Email client doesn't support markdown-style emphasis (acceptable fallback)
2. **Visual separators misaligned**: Check for proper character encoding (UTF-8)
3. **Emojis not displaying**: Older email clients may not support emojis
4. **Placeholder text remains**: Implement placeholder replacement utility

---

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**Status:** ✅ Production Ready
