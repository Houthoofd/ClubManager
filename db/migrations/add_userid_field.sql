-- Ajouter une colonne userId unique générée automatiquement
ALTER TABLE utilisateurs 
ADD COLUMN userId VARCHAR(20) UNIQUE NOT NULL DEFAULT '' AFTER id;

-- Créer une fonction pour générer un userId unique
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

-- Générer des userId pour les utilisateurs existants
UPDATE utilisateurs 
SET userId = generate_user_id() 
WHERE userId = '' OR userId IS NULL;

-- Créer un trigger pour auto-générer userId lors des insertions
DELIMITER //
CREATE TRIGGER before_insert_utilisateurs
    BEFORE INSERT ON utilisateurs
    FOR EACH ROW
BEGIN
    IF NEW.userId = '' OR NEW.userId IS NULL THEN
        SET NEW.userId = generate_user_id();
    END IF;
END//
DELIMITER ;

-- Supprimer les anciennes contraintes problématiques
ALTER TABLE utilisateurs DROP INDEX IF EXISTS email;
ALTER TABLE utilisateurs DROP INDEX IF EXISTS unique_nom_utilisateur;
ALTER TABLE utilisateurs DROP INDEX IF EXISTS unique_person;

-- Créer les nouveaux index optimisés
ALTER TABLE utilisateurs ADD INDEX idx_email (email);
ALTER TABLE utilisateurs ADD INDEX idx_nom_utilisateur (nom_utilisateur);
ALTER TABLE utilisateurs ADD INDEX idx_person_lookup (last_name, first_name, date_of_birth);

-- L'userId devient la vraie clé d'unicité
ALTER TABLE utilisateurs ADD CONSTRAINT unique_user_id UNIQUE (userId);

-- Afficher quelques exemples des nouveaux userId générés
SELECT id, userId, first_name, last_name, email 
FROM utilisateurs 
ORDER BY id 
LIMIT 10;
