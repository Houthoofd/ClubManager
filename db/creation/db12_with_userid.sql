SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS clubmanager;
USE clubmanager;

-- ...existing tables creation...

-- Table utilisateurs MODIFIÉE avec userId et sans contraintes uniques problématiques
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nom_utilisateur VARCHAR(50) NOT NULL,  -- Plus de contrainte UNIQUE
    email VARCHAR(100) NOT NULL,           -- Plus de contrainte UNIQUE
    genre_id INT,
    date_of_birth DATE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status_id INT DEFAULT 1,
    grade_id INT DEFAULT 1,
    abonnement_id INT,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    FOREIGN KEY (status_id) REFERENCES status(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id),
    INDEX idx_email (email),                    -- Index simple pour performances
    INDEX idx_nom_utilisateur (nom_utilisateur), -- Index simple pour performances
    INDEX idx_person_lookup (last_name, first_name, date_of_birth), -- Pour recherches
    INDEX idx_status (status_id),
    CONSTRAINT unique_user_id UNIQUE (userId)   -- Seule contrainte unique sur userId
) ENGINE=InnoDB;

-- Fonction pour générer userId automatiquement
DELIMITER //
CREATE FUNCTION generate_user_id() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_user_id VARCHAR(20);
    DECLARE id_exists INT DEFAULT 1;
    DECLARE counter INT DEFAULT 1;
    
    WHILE id_exists > 0 DO
        SET new_user_id = CONCAT('USR', YEAR(NOW()), LPAD(counter, 6, '0'));
        SELECT COUNT(*) INTO id_exists FROM utilisateurs WHERE userId = new_user_id;
        IF id_exists > 0 THEN SET counter = counter + 1; END IF;
    END WHILE;
    
    RETURN new_user_id;
END//
DELIMITER ;

-- Trigger pour générer userId automatiquement
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

-- ...existing code for other tables and data...

SET FOREIGN_KEY_CHECKS = 1;
