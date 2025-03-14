CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupe_id INT,  -- Clé étrangère vers le groupe
    utilisateur_id INT,  -- Clé étrangère vers l'utilisateur qui a envoyé le message
    contenu TEXT NOT NULL,  -- Contenu du message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date de création du message
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);