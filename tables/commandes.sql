CREATE TABLE commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,  -- Référence à l'utilisateur ayant passé la commande
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date et heure de la commande
    statut ENUM('en attente', 'payée', 'expédiée', 'annulée') DEFAULT 'en attente',  -- Statut de la commande
    
    -- Clé étrangère vers la table des utilisateurs
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);