CREATE TABLE Admin (
    admin_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    action_type VARCHAR(50),
    details TEXT
);
CREATE TABLE Class (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL
);
CREATE TABLE Election (
    election_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    nomination_start DATETIME NOT NULL,
    nomination_end DATETIME NOT NULL,
    voting_start DATETIME NOT NULL,
    voting_end DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (class_id) REFERENCES Class(class_id)
);
CREATE TABLE Nomination (
    nomination_id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    manifesto TEXT,
    photo_url VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    FOREIGN KEY (election_id) REFERENCES Election(election_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);
CREATE TABLE OTP (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    otp_code INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);
CREATE TABLE Policy (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_text TEXT NOT NULL
);

CREATE TABLE PolicyAcceptance (
    acceptance_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    policy_id INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (policy_id) REFERENCES Policy(policy_id)
);

CREATE TABLE Session (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL,
    creation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL
);
CREATE TABLE Student (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    class_id INT,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    email VARCHAR(100),
    FOREIGN KEY (class_id) REFERENCES Class(class_id)
);

CREATE TABLE Vote (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    voter_id VARCHAR(20) NOT NULL,
    candidate_id VARCHAR(20) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES Election(election_id),
    FOREIGN KEY (voter_id) REFERENCES Student(student_id),
    FOREIGN KEY (candidate_id) REFERENCES Student(student_id)
);
