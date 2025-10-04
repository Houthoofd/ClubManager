-- Ajouter le champ active à la table utilisateurs
ALTER TABLE utilisateurs 
ADD COLUMN active BOOLEAN DEFAULT TRUE AFTER status_id;

-- Mettre à jour tous les utilisateurs existants comme actifs
UPDATE utilisateurs SET active = TRUE WHERE active IS NULL;

-- Rendre le champ NOT NULL après avoir mis à jour
ALTER TABLE utilisateurs 
MODIFY COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- Ajouter un index sur le champ active pour les performances
ALTER TABLE utilisateurs 
ADD INDEX idx_active (active);

-- Ajouter un index composé pour les requêtes courantes
ALTER TABLE utilisateurs 
ADD INDEX idx_active_status (active, status_id);

-- Vérifier le résultat
SELECT 
    'Utilisateurs actifs' AS type,
    COUNT(*) AS count
FROM utilisateurs 
WHERE active = TRUE
UNION ALL
SELECT 
    'Utilisateurs inactifs' AS type,
    COUNT(*) AS count
FROM utilisateurs 
WHERE active = FALSE;
