CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,  -- Clé étrangère vers l'utilisateur
    message_id INT,  -- Clé étrangère vers le message
    vu BOOLEAN DEFAULT FALSE,  -- Indicateur si le message a été vu ou non
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date de la notification
    
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
);