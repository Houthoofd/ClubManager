-- 1. Ajouter la colonne userId SANS contrainte unique d'abord
ALTER TABLE utilisateurs 
ADD COLUMN userId VARCHAR(20) DEFAULT NULL AFTER id;

-- 2. Supprimer TOUTES les contraintes uniques existantes problématiques
-- Supprimer contrainte UNIQUE sur email
ALTER TABLE utilisateurs DROP INDEX email;

-- Supprimer contrainte UNIQUE sur nom_utilisateur 
ALTER TABLE utilisateurs DROP INDEX nom_utilisateur;

-- 3. Créer une fonction pour générer un userId unique
DELIMITER //
CREATE FUNCTION generate_user_id() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_user_id VARCHAR(20);
    DECLARE id_exists INT DEFAULT 1;
    DECLARE counter INT DEFAULT 1;
    
    -- Boucle jusqu'à trouver un userId unique
    WHILE id_exists > 0 DO
        -- Générer un ID avec format: USR + année + numéro séquentiel
        SET new_user_id = CONCAT('USR', YEAR(NOW()), LPAD(counter, 6, '0'));
        
        -- Vérifier si cet ID existe déjà
        SELECT COUNT(*) INTO id_exists 
        FROM utilisateurs 
        WHERE userId = new_user_id;
        
        -- Incrémenter le compteur si l'ID existe
        IF id_exists > 0 THEN
            SET counter = counter + 1;
        END IF;
    END WHILE;
    
    RETURN new_user_id;
END//
DELIMITER ;

-- 4. Générer des userId uniques pour TOUS les utilisateurs existants
SET @counter = 1;
UPDATE utilisateurs 
SET userId = CONCAT('USR', YEAR(NOW()), LPAD(@counter := @counter + 1, 6, '0'))
WHERE userId IS NULL OR userId = '';

-- 5. Maintenant ajouter la contrainte unique sur userId (après avoir rempli tous les userId)
ALTER TABLE utilisateurs 
MODIFY COLUMN userId VARCHAR(20) NOT NULL,
ADD CONSTRAINT unique_user_id UNIQUE (userId);

-- 6. Créer un trigger pour auto-générer userId lors des insertions
DELIMITER //
CREATE TRIGGER before_insert_utilisateurs
    BEFORE INSERT ON utilisateurs
    FOR EACH ROW
BEGIN
    IF NEW.userId IS NULL OR NEW.userId = '' THEN
        SET NEW.userId = generate_user_id();
    END IF;
END//
DELIMITER ;

-- 7. Recréer les index NON-UNIQUES pour les performances
ALTER TABLE utilisateurs ADD INDEX idx_email (email);
ALTER TABLE utilisateurs ADD INDEX idx_nom_utilisateur (nom_utilisateur);
ALTER TABLE utilisateurs ADD INDEX idx_person_lookup (last_name, first_name, date_of_birth);

-- 8. Afficher la nouvelle structure
DESCRIBE utilisateurs;

-- 9. Vérifier les index
SHOW INDEX FROM utilisateurs;

-- 10. Tester quelques exemples des nouveaux userId générés
SELECT id, userId, first_name, last_name, email 
FROM utilisateurs 
ORDER BY id 
LIMIT 10;

-- 11. Vérifier qu'il n'y a plus de contraintes uniques problématiques
SELECT 
    CONSTRAINT_NAME, 
    COLUMN_NAME, 
    CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE tc.TABLE_SCHEMA = DATABASE() 
    AND tc.TABLE_NAME = 'utilisateurs' 
    AND tc.CONSTRAINT_TYPE = 'UNIQUE';
