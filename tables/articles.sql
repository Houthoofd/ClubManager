CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,  -- Nom de l'article
    description TEXT,  -- Description de l'article
    prix DECIMAL(10, 2) NOT NULL,  -- Prix de l'article
    image_url VARCHAR(255),  -- URL de l'image de l'article
    categorie_id INT,  -- Référence à la table des catégories (si vous avez une table de catégories)
    
    -- Clé étrangère vers une table de catégories d'articles (si vous en avez une)
    FOREIGN KEY (categorie_id) REFERENCES categories(id)
);