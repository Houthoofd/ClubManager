CREATE TABLE groupes_utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupe_id INT,  -- Clé étrangère vers le groupe
    utilisateur_id INT,  -- Clé étrangère vers l'utilisateur
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date d'ajout de l'utilisateur au groupe
    
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);