CREATE TABLE Session (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL,
    creation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL
);