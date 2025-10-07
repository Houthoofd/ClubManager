USE clubmanager;

-- Ajouter les colonnes pour le soft delete (sans contrainte FK)
ALTER TABLE messages_personnalises 
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by INT NULL;

-- Créer un index pour optimiser les requêtes avec soft delete
CREATE INDEX idx_messages_personnalises_deleted ON messages_personnalises(utilisateur_id, deleted_at);

-- Optionnel: Marquer explicitement les messages existants comme non supprimés
UPDATE messages_personnalises SET deleted_at = NULL WHERE deleted_at IS NULL;
