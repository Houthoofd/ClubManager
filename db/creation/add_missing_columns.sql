USE clubmanager;

-- Ajouter seulement la colonne 'is_active' qui manque
SET @sql = '';
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'clubmanager' 
  AND TABLE_NAME = 'messages_personnalises' 
  AND COLUMN_NAME = 'is_active';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE messages_personnalises ADD COLUMN is_active BOOLEAN DEFAULT TRUE;', 
    'SELECT "Colonne is_active existe déjà" as message;');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Créer les index manquants si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_messages_personnalises_active ON messages_personnalises(utilisateur_id, is_active);

-- Mettre à jour tous les messages existants pour qu'ils soient actifs par défaut
UPDATE messages_personnalises SET is_active = TRUE WHERE is_active IS NULL;

-- Afficher la structure finale
DESCRIBE messages_personnalises;

-- Vérifier le contenu
SELECT 
  COUNT(*) as total_messages,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as messages_actifs,
  SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as messages_inactifs,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as messages_supprimes
FROM messages_personnalises;
