CREATE TABLE groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,  -- Nom du groupe
    description TEXT,  -- Description du groupe (facultatif)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Date de création du groupe
);