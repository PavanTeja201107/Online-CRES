CREATE TABLE OTP (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    otp_code INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);