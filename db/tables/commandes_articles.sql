CREATE TABLE commande_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT,  -- Référence à la commande
    article_id INT,   -- Référence à l'article
    taille_id INT,    -- Référence à la taille de l'article (si applicable)
    quantite INT NOT NULL,  -- Quantité de l'article commandée
    prix DECIMAL(10, 2) NOT NULL,  -- Prix de l'article au moment de la commande
    
    -- Clés étrangères
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (taille_id) REFERENCES tailles(id) ON DELETE CASCADE
);