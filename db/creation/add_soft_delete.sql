USE clubmanager;

-- D'abord, ajouter les colonnes sans contrainte
ALTER TABLE messages_personnalises 
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Ensuite, ajouter la contrainte de clé étrangère avec la bonne table
ALTER TABLE messages_personnalises 
ADD CONSTRAINT fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Créer un index pour optimiser les requêtes avec soft delete et statut actif
CREATE INDEX idx_messages_personnalises_deleted ON messages_personnalises(utilisateur_id, deleted_at);
CREATE INDEX idx_messages_personnalises_active ON messages_personnalises(utilisateur_id, is_active);

-- Optionnel: Marquer explicitement les messages existants comme actifs et non supprimés
UPDATE messages_personnalises SET deleted_at = NULL, is_active = TRUE WHERE deleted_at IS NULL;
