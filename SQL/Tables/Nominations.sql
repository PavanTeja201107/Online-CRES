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