-- Vérifier d'abord la structure existante
DESCRIBE paiements;

-- Ajouter seulement les colonnes qui n'existent pas encore
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS commande_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS methode_paiement VARCHAR(50) NULL AFTER montant,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS bitcoin_address VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS description TEXT NULL,
ADD COLUMN IF NOT EXISTS date_confirmation TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Modifier la colonne statut existante si nécessaire
ALTER TABLE paiements 
MODIFY COLUMN statut VARCHAR(50) DEFAULT 'en_attente';

-- Ajouter les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_paiements_commande_id ON paiements(commande_id);
CREATE INDEX IF NOT EXISTS idx_paiements_methode ON paiements(methode_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_stripe_id ON paiements(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_paiements_paypal_id ON paiements(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);

-- Mettre à jour les paiements existants avec des valeurs par défaut
UPDATE paiements 
SET methode_paiement = COALESCE(methode_paiement, 'non_specifie')
WHERE methode_paiement IS NULL;

-- Afficher la structure mise à jour
DESCRIBE paiements;
