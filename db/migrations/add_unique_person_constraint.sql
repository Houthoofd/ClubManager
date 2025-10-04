-- Contrainte pour éviter les doublons de personnes (nom + prénom + date de naissance)
-- Mais permettre plusieurs comptes avec le même email (familles)

-- 1. Supprimer l'ancienne contrainte unique sur email si elle existe
ALTER TABLE utilisateurs DROP INDEX IF EXISTS email;
ALTER TABLE utilisateurs DROP INDEX IF EXISTS email_UNIQUE;
ALTER TABLE utilisateurs DROP INDEX IF EXISTS idx_email_unique;

-- 2. Supprimer toute contrainte UNIQUE sur la colonne email
SHOW INDEX FROM utilisateurs WHERE Column_name = 'email' AND Non_unique = 0;

-- Script pour supprimer dynamiquement toutes les contraintes uniques sur email
SET @sql = NULL;
SELECT GROUP_CONCAT(
    DISTINCT CONCAT('ALTER TABLE utilisateurs DROP INDEX ', Key_name)
    SEPARATOR '; '
) INTO @sql
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'utilisateurs' 
  AND COLUMN_NAME = 'email' 
  AND NON_UNIQUE = 0;

SET @sql = IFNULL(@sql, '');
IF @sql != '' THEN
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END IF;

-- 3. Supprimer aussi les contraintes uniques sur nom_utilisateur (pour permettre les doublons)
SET @sql_username = NULL;
SELECT GROUP_CONCAT(
    DISTINCT CONCAT('ALTER TABLE utilisateurs DROP INDEX ', Key_name)
    SEPARATOR '; '
) INTO @sql_username
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'utilisateurs' 
  AND COLUMN_NAME = 'nom_utilisateur' 
  AND NON_UNIQUE = 0;

SET @sql_username = IFNULL(@sql_username, '');
IF @sql_username != '' THEN
    PREPARE stmt_username FROM @sql_username;
    EXECUTE stmt_username;
    DEALLOCATE PREPARE stmt_username;
END IF;

-- 4. Ajouter une contrainte unique sur la combinaison nom + prénom + date de naissance
ALTER TABLE utilisateurs 
ADD CONSTRAINT unique_person 
UNIQUE KEY (last_name, first_name, date_of_birth);

-- 5. Garder email comme index simple (non unique) pour les recherches
ALTER TABLE utilisateurs 
ADD INDEX idx_email (email);

-- 6. Garder nom_utilisateur comme index simple (non unique) pour les recherches
ALTER TABLE utilisateurs 
ADD INDEX idx_nom_utilisateur (nom_utilisateur);

-- 7. Vérification finale
SHOW INDEX FROM utilisateurs WHERE Column_name IN ('email', 'last_name', 'first_name', 'date_of_birth', 'nom_utilisateur');
