-- Créer la table des paiements
CREATE TABLE paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,  -- Clé étrangère vers la table utilisateurs
    montant DECIMAL(10, 2) NOT NULL,  -- Montant du paiement
    date_paiement DATE NOT NULL,  -- Date du paiement
    statut ENUM('validé', 'en attente', 'échec') DEFAULT 'en attente',  -- Statut du paiement
    abonnement_id INT,  -- Référence à l'abonnement de l'utilisateur (table plans_tarifaires)
    periode_debut DATE,  -- Date de début de la période couverte par ce paiement
    periode_fin DATE,  -- Date de fin de la période couverte par ce paiement
    
    -- Ajout des clés étrangères
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id),
    
    -- Vous pouvez aussi envisager une contrainte UNIQUE sur `utilisateur_id` et `periode_debut`/`periode_fin`
    UNIQUE (utilisateur_id, periode_debut)  -- Un paiement par période pour un utilisateur
);