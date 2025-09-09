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
