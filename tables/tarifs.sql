CREATE TABLE plans_tarifaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_plan VARCHAR(50) NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    periode VARCHAR(20) NOT NULL, -- Exemple: "mois", "trimestre", "an"
    description TEXT
);

-- Insérer les trois plans tarifaires
INSERT INTO plans_tarifaires (nom_plan, prix, periode, description)
VALUES
    ('Paiement mensuel', 25.00, 'mois', 'Abonnement de 25 EUR par mois'),
    ('Paiement trimestriel', 100.00, 'trimestre', 'Abonnement de 100 EUR tous les 3 mois'),
    ('Paiement annuel', 300.00, 'an', 'Abonnement de 300 EUR pour une année complète');
