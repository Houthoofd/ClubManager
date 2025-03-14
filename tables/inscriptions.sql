CREATE TABLE inscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cours_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status BOOLEAN DEFAULT NULL,
    FOREIGN KEY (cours_id) REFERENCES cours(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);