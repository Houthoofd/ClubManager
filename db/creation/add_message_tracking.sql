USE clubmanager;

-- Ajouter les colonnes pour le tracking des messages lus
ALTER TABLE messages_personnalises 
ADD COLUMN lu BOOLEAN DEFAULT FALSE,
ADD COLUMN date_lecture DATETIME NULL;

-- Créer des index pour optimiser les requêtes
CREATE INDEX idx_messages_personnalises_lu ON messages_personnalises(utilisateur_id, lu);
CREATE INDEX idx_messages_personnalises_date_lecture ON messages_personnalises(date_lecture);

-- Optionnel: Marquer tous les anciens messages comme non lus explicitement
UPDATE messages_personnalises SET lu = FALSE WHERE lu IS NULL;
