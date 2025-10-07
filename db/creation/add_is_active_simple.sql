USE clubmanager;

-- Étape 1: Ajouter la colonne is_active
ALTER TABLE messages_personnalises ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Étape 2: Créer l'index
CREATE INDEX idx_messages_personnalises_active ON messages_personnalises(utilisateur_id, is_active);

-- Étape 3: Mettre à jour les valeurs NULL
UPDATE messages_personnalises SET is_active = TRUE WHERE is_active IS NULL;

-- Étape 4: Vérifier que tout s'est bien passé
DESCRIBE messages_personnalises;

-- Étape 5: Afficher un résumé des données
SELECT 
  COUNT(*) as total_messages,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as messages_actifs,
  SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as messages_inactifs,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as messages_supprimes
FROM messages_personnalises;
