CREATE TABLE stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT,  -- Clé étrangère vers la table des articles
    taille_id INT,   -- Clé étrangère vers la table des tailles
    quantite INT NOT NULL,  -- Quantité en stock pour cette taille d'article
    
    -- Clés étrangères
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (taille_id) REFERENCES tailles(id) ON DELETE CASCADE
);