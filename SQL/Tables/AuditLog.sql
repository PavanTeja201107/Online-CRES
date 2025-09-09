CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    action_type VARCHAR(50),
    details TEXT
);