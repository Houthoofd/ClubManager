USE clubmanager;

-- ========================================
-- SCRIPT DE MIGRATION POUR TABLE PAIEMENTS (Version MySQL compatible)
-- ========================================

-- 1. Vérifier la structure actuelle
DESCRIBE paiements;

-- 2. Ajouter les nouvelles colonnes avec vérification manuelle
-- Ajouter commande_id
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'commande_id' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN commande_id INT NULL AFTER id',
    'SELECT "Colonne commande_id existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter methode_paiement
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'methode_paiement' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN methode_paiement VARCHAR(50) NULL AFTER montant',
    'SELECT "Colonne methode_paiement existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter stripe_payment_intent_id
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'stripe_payment_intent_id' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL',
    'SELECT "Colonne stripe_payment_intent_id existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter paypal_order_id
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'paypal_order_id' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN paypal_order_id VARCHAR(255) NULL',
    'SELECT "Colonne paypal_order_id existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter bitcoin_address
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'bitcoin_address' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN bitcoin_address VARCHAR(255) NULL',
    'SELECT "Colonne bitcoin_address existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter description
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'description' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN description TEXT NULL',
    'SELECT "Colonne description existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter date_confirmation
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'date_confirmation' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN date_confirmation TIMESTAMP NULL',
    'SELECT "Colonne date_confirmation existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter date_modification
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'date_modification' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "Colonne date_modification existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter periode_debut
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'periode_debut' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN periode_debut DATE NULL',
    'SELECT "Colonne periode_debut existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter periode_fin
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'periode_fin' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD COLUMN periode_fin DATE NULL',
    'SELECT "Colonne periode_fin existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Modifier la colonne statut
ALTER TABLE paiements MODIFY COLUMN statut VARCHAR(50) DEFAULT 'en_attente';

-- 4. Ajouter la clé étrangère pour commande_id
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE REFERENCED_TABLE_NAME = 'commandes' 
     AND TABLE_NAME = 'paiements' 
     AND COLUMN_NAME = 'commande_id'
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'ALTER TABLE paiements ADD CONSTRAINT fk_paiements_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL',
    'SELECT "Clé étrangère commande_id existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Créer les index avec vérification
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_NAME = 'paiements' 
     AND INDEX_NAME = 'idx_paiements_commande_id' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'CREATE INDEX idx_paiements_commande_id ON paiements(commande_id)',
    'SELECT "Index idx_paiements_commande_id existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_NAME = 'paiements' 
     AND INDEX_NAME = 'idx_paiements_methode' 
     AND TABLE_SCHEMA = 'clubmanager') = 0,
    'CREATE INDEX idx_paiements_methode ON paiements(methode_paiement)',
    'SELECT "Index idx_paiements_methode existe déjà" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Mettre à jour les données existantes
UPDATE paiements 
SET methode_paiement = 'non_specifie'
WHERE methode_paiement IS NULL;

-- 7. Vérifications finales
SELECT "=== MIGRATION TERMINÉE AVEC SUCCÈS ===" as message;
DESCRIBE paiements;
