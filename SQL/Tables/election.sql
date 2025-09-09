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