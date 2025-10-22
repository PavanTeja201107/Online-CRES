-- 1. core tables
CREATE TABLE Admin (
  admin_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  PRIMARY KEY (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE Class (
  class_id INT NOT NULL AUTO_INCREMENT,
  class_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE Student (
  student_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  class_id INT DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  must_change_password tinyint(1) DEFAULT '1',
  last_login_at DATETIME DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  KEY fk_student_class (class_id),
  CONSTRAINT fk_student_class FOREIGN KEY (class_id) REFERENCES Class(class_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE Election (
  election_id INT NOT NULL AUTO_INCREMENT,
  class_id INT NOT NULL,
  nomination_start DATETIME NOT NULL,
  nomination_end DATETIME NOT NULL,
  voting_start DATETIME NOT NULL,
  voting_end DATETIME NOT NULL,
  is_active tinyint(1) DEFAULT '0',
  is_published tinyint(1) DEFAULT '0',
  created_by_admin_id VARCHAR(20) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (election_id),
  KEY fk_election_class (class_id),
  KEY fk_election_admin (created_by_admin_id),
  CONSTRAINT fk_election_admin FOREIGN KEY (created_by_admin_id) REFERENCES Admin(admin_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_election_class FOREIGN KEY (class_id) REFERENCES Class(class_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE Nomination (
  nomination_id INT NOT NULL AUTO_INCREMENT,
  election_id INT NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  manifesto TEXT,
  photo_url VARCHAR(255) DEFAULT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_admin_id VARCHAR(20) DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  rejection_reason TEXT,
  PRIMARY KEY (nomination_id),
  UNIQUE KEY ux_nomination (election_id, student_id),
  KEY fk_nomination_student (student_id),
  KEY fk_nomination_admin (reviewed_by_admin_id),
  CONSTRAINT fk_nomination_admin FOREIGN KEY (reviewed_by_admin_id) REFERENCES Admin(admin_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_nomination_election FOREIGN KEY (election_id) REFERENCES Election(election_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_nomination_student FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE OTP (
  otp_id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(20) NOT NULL,
  user_role ENUM('ADMIN','STUDENT') NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_time DATETIME NOT NULL,
  purpose ENUM('LOGIN','RESET') DEFAULT 'LOGIN',
  used tinyint(1) DEFAULT '0',
  PRIMARY KEY (otp_id),
  KEY ix_otp_user (user_id, user_role),
  KEY ix_otp_purpose (purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE Policy (
  policy_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  policy_text TEXT NOT NULL,
  version INT DEFAULT '1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by_admin_id VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (policy_id),
  KEY fk_policy_admin (created_by_admin_id),
  CONSTRAINT fk_policy_admin FOREIGN KEY (created_by_admin_id) REFERENCES Admin(admin_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE PolicyAcceptance (
  acceptance_id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(20) NOT NULL,
  policy_id INT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_role ENUM('ADMIN','STUDENT') DEFAULT 'STUDENT',
  PRIMARY KEY (acceptance_id),
  KEY fk_policyacceptance_policy (policy_id),
  CONSTRAINT fk_policyacceptance_policy FOREIGN KEY (policy_id) REFERENCES Policy(policy_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE Session (
  session_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(20) NOT NULL,
  role ENUM('ADMIN','STUDENT') NOT NULL,
  creation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_time DATETIME NOT NULL,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE AuditLog (
  log_id INT NOT NULL AUTO_INCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(20) DEFAULT NULL,
  role ENUM('ADMIN','STUDENT','SYSTEM') DEFAULT 'SYSTEM',
  ip_address VARCHAR(45) DEFAULT NULL,
  action_type VARCHAR(80) DEFAULT NULL,
  details JSON DEFAULT NULL,
  outcome ENUM('SUCCESS','FAILURE') DEFAULT 'SUCCESS',
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE VotingToken (
  token_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(20) DEFAULT NULL,
  election_id INT NOT NULL,
  token_hash VARCHAR(255) DEFAULT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used tinyint(1) DEFAULT '0',
  used_at DATETIME DEFAULT NULL,
  PRIMARY KEY (token_id),
  KEY ix_vt_election_used (election_id, used),
  KEY ix_vt_token_hash (token_hash),
  KEY fk_votingtoken_student (student_id),
  CONSTRAINT fk_votingtoken_election FOREIGN KEY (election_id) REFERENCES Election(election_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_votingtoken_student FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Insert default policies
INSERT INTO Policy (policy_id, name, policy_text, version, created_at) VALUES
  (1, 'Nomination Policy', 'Default nomination policy text.', 1, NOW()),
  (2, 'Voting Policy', 'Default voting policy text.', 1, NOW())
ON DUPLICATE KEY UPDATE policy_text=VALUES(policy_text), version=VALUES(version);

CREATE TABLE VoterStatus (
  id INT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(20) NOT NULL,
  election_id INT NOT NULL,
  has_voted tinyint(1) DEFAULT '0',
  voted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_voter_status (student_id, election_id),
  KEY fk_voterstatus_election (election_id),
  CONSTRAINT fk_voterstatus_election FOREIGN KEY (election_id) REFERENCES Election(election_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_voterstatus_student FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE VoteAnonymous (
  vote_id INT NOT NULL AUTO_INCREMENT,
  election_id INT NOT NULL,
  ballot_id VARCHAR(64) NOT NULL,
  candidate_id VARCHAR(20) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vote_id),
  KEY ix_vote_election (election_id),
  CONSTRAINT fk_voteanonymous_election FOREIGN KEY (election_id) REFERENCES Election(election_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ALTER TABLE Admin 
-- ADD COLUMN last_login_at DATETIME DEFAULT NULL 
-- AFTER password_hash;

-- Note: Student table uses 'last_login_at' for consistency with Admin.last_login_at
-- If your live database still has 'last_login', follow the migration steps below to add/copy/drop safely.
-- Example (use with care):
-- ALTER TABLE Student CHANGE COLUMN last_login last_login_at DATETIME DEFAULT NULL;

-- -- Add rejection_reason to Nomination table (if not exists)
-- ALTER TABLE Nomination 
-- ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- -- Add is_published to Election table (if not exists)
-- ALTER TABLE Election 
-- ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- -- Add last_login_at to Student table (if not exists)
-- ALTER TABLE Student 
-- ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL;

-- -- Add last_login_at to Admin table (if not exists)
-- ALTER TABLE Admin 
-- ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL;
