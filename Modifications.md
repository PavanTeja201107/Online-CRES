# Changelog: College CR Election System Enhancements (October 2025)

This document summarizes recent features, improvements, and bug fixes implemented across the frontend and backend.

---

## 🚀 Key Enhancements & Features

### 1. Voting Module (Modification 1)

* **Simplified Student Voting UI (`Vote.jsx`):**
    * Replaced card layout with a clean list showing Name, Photo/Icon (with fallback), and Manifesto.
    * Uses standard radio buttons for selection.
    * Clicking candidate details selects the radio button.
    * **Student ID is now hidden** during voting for privacy.
    * Subtle highlighting indicates the selected candidate.
* **Prevent Re-Voting (`Vote.jsx` & Backend):**
    * Checks if the student has already voted *before* issuing a token or showing the ballot.
    * If already voted, displays a clear message ("You have already cast your vote...") and hides the voting interface.
    * **Backend:** `/api/vote/token/:election_id` now returns `{"status": "already_voted"}` if applicable.
* **Backend:** `/api/nominations/election/:id/approved` now includes the `manifesto` field.

### 2. Nomination Workflow (Modification 2)

* **Admin Review Process (`Nominations.jsx`):**
    * Added a "**View Manifesto & Review**" button for each pending nomination.
    * Clicking opens a **modal** displaying the candidate's details and full manifesto.
    * "Approve" and "Reject" buttons are now **inside the manifesto modal**, ensuring review before action.
    * **Rejection requires a mandatory reason** entered in a separate modal textarea.
* **Email Notifications (Backend):**
    * **Rejection:** Automatically sends a professional HTML email to the student including the **specific reason** provided by the admin.
    * **Approval:** Automatically sends a professional HTML approval email to the student.
* **Student View (`NominationForm.jsx`):**
    * If a nomination is 'REJECTED', the **rejection reason** provided by the admin is now displayed clearly to the student.
* **Prevent Multiple Nominations (Backend):**
    * The `/api/nominations` (submit) endpoint now checks if the student already has a PENDING or APPROVED nomination for the election and returns an error if true.
* **Backend:**
    * `/api/nominations/election/:id` (Admin view) now includes the `manifesto`.
    * `/api/nominations/:id/reject` now accepts and stores `reason`, triggers email.
    * `/api/nominations/my/:election_id` (Student view) now returns `rejection_reason`.

### 3. Results Display (Admin & Student) (Modification 3 & Others)

* **Chart Integration (`AdminResults.jsx`, `ResultsPage.jsx`):**
    * Added **Bar Charts** to visualize vote counts using `chart.js` and `react-chartjs-2`.
    * Implemented a side-by-side layout (Chart on left, Detailed Breakdown on right).
* **Admin Dynamic Display (`AdminResults.jsx`):**
    * Shows "**LEADING**" badge (Yellow) next to top candidate(s) during **live voting** (results not published).
    * Shows "**WINNER**" badge (Green) **only after results are published** (via `/api/elections/:id/publish` endpoint) and there's a single winner.
    * **Graph Colors:** Winner's bar highlighted green *only* when published. Default color used otherwise (live voting, ties).
    * **Tie/Zero Vote Handling:** Displays clear `Alert` messages ("Tie detected. HOD/Advisor will resolve...", "No votes recorded...") instead of badges in these cases.
* **Student Celebration (`ResultsPage.jsx`):**
    * Displays **confetti animation** (`react-confetti`) if a single, clear winner is determined when results are viewed.
    * Highlights the winner's row and shows a "WINNER" badge in the detailed list.
    * Includes messages for ties and zero votes.
* **Backend:**
    * `/api/elections` now returns `status` (e.g., 'VOTING', 'CLOSED') and `is_published` flag.
    * `/api/vote/results/:election_id` includes these `status` and `is_published` flags.
    * New endpoint `PUT /api/elections/:id/publish` created for admins.

### 4. Last Login Notification (Modification 2)

* **Professional Banner (`LastLoginBanner.jsx` - New Component):**
    * Displays a subtle, dismissible banner below the navbar after login (replaces previous top-right toast).
    * Shows "Welcome! This appears to be your first login." (Blue banner) for new users (`last_login_at` is null).
    * Shows "For your security, your last login was on [Formatted Date]." (Gray banner) for returning users.
    * Uses professional date formatting (e.g., "October 22, 2025 at 4:15 AM").
    * Appears only once per browser session (`sessionStorage`).
* **Integration:** Added to `AdminDashboard.jsx` and `StudentDashboard.jsx`.
* **Backend:** Login APIs (`/api/auth/admin/login`, `/api/auth/verify-otp`) return the *previous* `last_login_at` timestamp (or `null`) and update the timestamp to `NOW()` upon successful login.

### 5. Email Templates (Modification 4 & Bug Fixes)

* **Professional HTML Formatting:** All system emails (Welcome, OTPs, Nomination/Vote Open, Class Removed, Results Published, Nomination Rejected/Approved) now use simple HTML (`<p>`, `<strong>`, `<a>`, `<ul><li>`) for better structure, bolding, and links. **Removed all `<button>` elements.**
* **Clarity & Content:** Emails rewritten for improved clarity, structure, and professional tone. Includes necessary details like dates, reasons, links, and support contacts. Uses the full name "College CR Election System".
* **Backend:** Email sending logic updated to use these HTML templates.

### 6. Critical Bug Fixes (Backend Maintenance Job & Controllers)

* **App Crash Prevention:**
    * Fixed foreign key violation in `maintenanceJob.js` by setting `reviewed_by_admin_id` to `NULL` for system actions instead of the string 'SYSTEM'.
    * Wrapped auto-reject database query in `maintenanceJob.js` within a `try...catch` block.
* **Email on Auto-Reject:** `maintenanceJob.js` now sends an email notification to students whose nominations are auto-rejected when voting starts.
* **Nomination Locking:** Admins can no longer Approve/Reject nominations via the API after the election's voting period has started (`nominationsController.js`).
* **Improved Logging:** Enhanced error messages and context in `maintenanceJob.js`.
* **Edge Case Handling:** Added checks for empty classes and graceful handling of email sending failures in `maintenanceJob.js`.

---

## ⚙️ Setup & Installation

* **Frontend Dependencies:** Ensure these are installed in the `frontend` directory:
    ```bash
    npm install chart.js react-chartjs-2 react-confetti react-use
    ```
* **Database Migrations:** Ensure the following columns exist:
    * `Admin.last_login_at` (DATETIME, NULL)
    * `Student.last_login_at` (DATETIME, NULL) - *Note: Was `last_login` previously, ensure consistency.*
    * `Nomination.rejection_reason` (TEXT, NULL)
    * `Election.is_published` (BOOLEAN, DEFAULT FALSE)
* **Backend Environment (`.env`):** Configure SMTP settings for email notifications. See `EMAIL_SETUP_GUIDE.md`.

---

This covers the major changes. Refer to the specific implementation documents for full code details and API specifications.