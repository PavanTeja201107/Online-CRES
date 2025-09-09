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