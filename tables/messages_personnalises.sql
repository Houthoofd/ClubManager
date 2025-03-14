CREATE TABLE messages_personnalises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,  -- Clé étrangère vers l'utilisateur qui crée le message
    contenu TEXT NOT NULL,  -- Contenu du message personnalisé
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date de création du message personnalisé
    
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);