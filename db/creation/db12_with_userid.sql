SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS clubmanager;
USE clubmanager;

-- Tables de référence
CREATE TABLE IF NOT EXISTS status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plans_tarifaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_plan VARCHAR(50) NOT NULL UNIQUE,
    prix DECIMAL(10, 2) NOT NULL,
    periode VARCHAR(20) NOT NULL,
    description TEXT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS tailles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tables principales
CREATE TABLE IF NOT EXISTS groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nom (nom)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nom_utilisateur VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    genre_id INT,
    date_of_birth DATE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status_id INT DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    grade_id INT DEFAULT 1,
    abonnement_id INT,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,  -- NOUVEAU: Statut de vérification email
    email_verified_at TIMESTAMP NULL,      -- NOUVEAU: Date de vérification email
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    FOREIGN KEY (status_id) REFERENCES status(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id),
    INDEX idx_email (email),
    INDEX idx_nom_utilisateur (nom_utilisateur),
    INDEX idx_person_lookup (last_name, first_name, date_of_birth),
    INDEX idx_status (status_id),
    INDEX idx_active (active),
    INDEX idx_active_status (active, status_id),
    INDEX idx_email_verified (email_verified),  -- NOUVEAU: Index pour les emails vérifiés
    CONSTRAINT unique_user_id UNIQUE (userId)
) ENGINE=InnoDB;

-- NOUVELLE TABLE: Tokens de validation d'email
CREATE TABLE IF NOT EXISTS email_validation_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('email_confirmation', 'password_setup') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_utilisateur_type (utilisateur_id, type),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Fonction pour générer userId automatiquement avec salt
DELIMITER //
CREATE FUNCTION generate_user_id() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_user_id VARCHAR(20);
    DECLARE id_exists INT DEFAULT 1;
    DECLARE counter INT DEFAULT 1;
    DECLARE salt_base VARCHAR(50);
    
    -- Créer un salt basé sur timestamp + données contextuelles
    SET salt_base = CONCAT(
        YEAR(NOW()),                    -- Année actuelle
        LPAD(MONTH(NOW()), 2, '0'),     -- Mois avec zero-padding
        LPAD(DAY(NOW()), 2, '0'),       -- Jour avec zero-padding
        SUBSTRING(MD5(CONCAT(NOW(), CONNECTION_ID())), 1, 4) -- Hash unique session
    );
    
    -- Boucle jusqu'à trouver un userId unique
    WHILE id_exists > 0 DO
        -- Format: USR + année + hash_court + compteur
        SET new_user_id = CONCAT(
            'USR',
            YEAR(NOW()),
            SUBSTRING(salt_base, -4),  -- 4 derniers caractères du salt
            LPAD(counter, 3, '0')      -- Compteur sur 3 chiffres
        );
        
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

-- Trigger AMÉLIORÉ pour générer userId avec données personnelles
DELIMITER //
CREATE TRIGGER before_insert_utilisateurs
    BEFORE INSERT ON utilisateurs
    FOR EACH ROW
BEGIN
    DECLARE personal_salt VARCHAR(50);
    DECLARE base_id VARCHAR(20);
    DECLARE final_user_id VARCHAR(20);
    DECLARE id_exists INT DEFAULT 1;
    DECLARE attempt INT DEFAULT 1;
    
    IF NEW.userId = '' OR NEW.userId IS NULL THEN
        -- Créer un salt basé sur les données personnelles
        SET personal_salt = MD5(CONCAT(
            UPPER(TRIM(NEW.first_name)),           -- Prénom normalisé
            UPPER(TRIM(NEW.last_name)),            -- Nom normalisé
            DATE_FORMAT(NEW.date_of_birth, '%Y%m%d'), -- Date de naissance
            SUBSTRING(NEW.email, 1, 3),            -- Premiers caractères email
            UNIX_TIMESTAMP(),                      -- Timestamp unique
            CONNECTION_ID()                        -- ID de session unique
        ));
        
        -- Générer l'ID de base
        SET base_id = CONCAT(
            'USR',
            YEAR(NOW()),
            SUBSTRING(personal_salt, 1, 4),        -- 4 premiers caractères du hash
            LPAD(MONTH(NOW()), 2, '0')             -- Mois courant
        );
        
        -- Boucle pour assurer l'unicité
        WHILE id_exists > 0 DO
            IF attempt = 1 THEN
                SET final_user_id = base_id;
            ELSE
                SET final_user_id = CONCAT(base_id, LPAD(attempt, 2, '0'));
            END IF;
            
            SELECT COUNT(*) INTO id_exists 
            FROM utilisateurs 
            WHERE userId = final_user_id;
            
            IF id_exists > 0 THEN
                SET attempt = attempt + 1;
            END IF;
        END WHILE;
        
        SET NEW.userId = final_user_id;
    END IF;
END//
DELIMITER ;

CREATE TABLE IF NOT EXISTS professeurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_id INT,
    status_id INT,
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (status_id) REFERENCES status(id),
    INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    categorie_id INT,
    FOREIGN KEY (categorie_id) REFERENCES categories(id),
    INDEX idx_nom (nom)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    taille_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (taille_id) REFERENCES tailles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_article_taille (article_id, taille_id),
    INDEX idx_article (article_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_article (article_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cours_recurrent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_cours VARCHAR(255) NOT NULL,
    jour_semaine INT NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    INDEX idx_jour_type (jour_semaine, type_cours)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_cours DATE NOT NULL,
    type_cours VARCHAR(50) NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    cours_recurrent_id INT NOT NULL,
    FOREIGN KEY (cours_recurrent_id) REFERENCES cours_recurrent(id) ON DELETE CASCADE,
    INDEX idx_date_type (date_cours, type_cours)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('en attente', 'payée', 'expédiée', 'annulée') DEFAULT 'en attente',
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur_statut (utilisateur_id, statut)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commande_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    article_id INT NOT NULL,
    taille_id INT NOT NULL,
    quantite INT NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (taille_id) REFERENCES tailles(id) ON DELETE CASCADE,
    INDEX idx_commande_article (commande_id, article_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    cours_id INT NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_id BOOLEAN DEFAULT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    UNIQUE KEY uk_utilisateur_cours (utilisateur_id, cours_id),
    INDEX idx_utilisateur_cours (utilisateur_id, cours_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    cours_id INT NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    UNIQUE KEY uk_utilisateur_cours (utilisateur_id, cours_id),
    INDEX idx_utilisateur_cours (utilisateur_id, cours_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NULL,
    utilisateur_id INT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    methode_paiement VARCHAR(50) NULL,
    stripe_payment_intent_id VARCHAR(255) NULL,
    paypal_order_id VARCHAR(255) NULL,
    bitcoin_address VARCHAR(255) NULL,
    date_paiement DATE NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    description TEXT NULL,
    date_confirmation TIMESTAMP NULL,
    date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    abonnement_id INT,
    periode_debut DATE NULL,
    periode_fin DATE NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id) ON DELETE SET NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL,
    -- Contrainte unique seulement pour les paiements d'abonnement (avec periode_debut non null)
    UNIQUE KEY uk_utilisateur_periode_abonnement (utilisateur_id, periode_debut, abonnement_id),
    INDEX idx_utilisateur_statut (utilisateur_id, statut),
    INDEX idx_commande_id (commande_id),
    INDEX idx_methode_paiement (methode_paiement),
    INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
    INDEX idx_paypal_order_id (paypal_order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS echeances_paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    abonnement_id INT NOT NULL,
    date_echeance DATE NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    statut ENUM('payé', 'en attente', 'échu') DEFAULT 'en attente',
    date_paiement DATE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id) ON DELETE CASCADE,
    INDEX idx_utilisateur_echeance (utilisateur_id, date_echeance),
    INDEX idx_abonnement_echeance (abonnement_id, date_echeance)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_validation_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    token_type ENUM('email_validation', 'password_reset', 'userId_recovery') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_token (user_id, token_type)
) ENGINE=InnoDB;



CREATE TABLE IF NOT EXISTS groupes_utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupe_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE KEY uk_groupe_utilisateur (groupe_id, utilisateur_id),
    INDEX idx_groupe_utilisateur (groupe_id, utilisateur_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    groupe_id INT,
    contenu TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
    INDEX idx_sender_receiver (sender_id, receiver_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS message_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    status ENUM('vu', 'non vu') DEFAULT 'non vu',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE KEY uk_message_utilisateur (message_id, utilisateur_id),
    INDEX idx_message_utilisateur (message_id, utilisateur_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages_personnalises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    contenu TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (utilisateur_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS types_messages_personnalises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    message_id INT NOT NULL,
    vu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_utilisateur_vu (utilisateur_id, vu)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cours_recurrent_professeur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cours_recurrent_id INT NOT NULL,
    professeur_id INT NOT NULL,
    FOREIGN KEY (cours_recurrent_id) REFERENCES cours_recurrent(id) ON DELETE CASCADE,
    FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cours_professeur (cours_recurrent_id, professeur_id),
    INDEX idx_cours_professeur (cours_recurrent_id, professeur_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS statistiques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_statistique VARCHAR(50) NOT NULL,
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    valeur DECIMAL(10, 2),
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_periode (type_statistique, periode_debut, periode_fin)
) ENGINE=InnoDB;

-- ========== SYSTÈME D'ALERTES ==========

-- Table pour les types d'alertes
CREATE TABLE IF NOT EXISTS alertes_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    priorite ENUM('basse', 'normale', 'haute', 'critique') DEFAULT 'normale',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table pour les alertes des utilisateurs
CREATE TABLE IF NOT EXISTS alertes_utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    alerte_type_id INT NOT NULL,
    statut ENUM('active', 'resolue', 'ignoree') DEFAULT 'active',
    donnees_contexte JSON,
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (alerte_type_id) REFERENCES alertes_types(id) ON DELETE CASCADE,
    INDEX idx_utilisateur_statut (utilisateur_id, statut),
    INDEX idx_type_statut (alerte_type_id, statut)
) ENGINE=InnoDB;

-- Table pour les actions de suivi
CREATE TABLE IF NOT EXISTS alertes_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alerte_id INT NOT NULL,
    action_type ENUM('message_envoye', 'information_mise_a_jour', 'paiement_recu', 'autre') NOT NULL,
    description TEXT,
    effectue_par INT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alerte_id) REFERENCES alertes_utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (effectue_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_alerte_date (alerte_id, date_action)
) ENGINE=InnoDB;

-- INDEXES
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_status ON utilisateurs(status_id);
CREATE INDEX idx_cours_type ON cours(type_cours);
CREATE INDEX idx_commandes_statut ON commandes(statut);

DELIMITER //
CREATE PROCEDURE upsert_utilisateur(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_genre_id INT,
    IN p_date_of_birth DATE,
    IN p_nom_utilisateur VARCHAR(100),
    IN p_status_id INT,
    IN p_grade_id INT,
    IN p_abonnement_id INT,
    IN p_password VARCHAR(255),
    IN p_date_inscription TIMESTAMP
)
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM utilisateurs WHERE email = p_email;
    IF v_count = 0 THEN
        INSERT INTO utilisateurs (first_name, last_name, email, genre_id, date_of_birth, nom_utilisateur, status_id, grade_id, abonnement_id, password, date_inscription)
        VALUES (p_first_name, p_last_name, p_email, p_genre_id, p_date_of_birth, p_nom_utilisateur, p_status_id, p_grade_id, p_abonnement_id, p_password, p_date_inscription);
    ELSE
        UPDATE utilisateurs
        SET first_name = p_first_name,
            last_name = p_last_name,
            genre_id = p_genre_id,
            date_of_birth = p_date_of_birth,
            nom_utilisateur = p_nom_utilisateur,
            status_id = p_status_id,
            grade_id = p_grade_id,
            abonnement_id = p_abonnement_id,
            password = p_password,
            date_inscription = p_date_inscription
        WHERE email = p_email;
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE ajouter_cours_recurrent_avec_professeurs(
    IN p_type_cours VARCHAR(50),
    IN p_jour_semaine VARCHAR(20),
    IN p_heure_debut TIME,
    IN p_heure_fin TIME,
    IN p_professeurs JSON
)
BEGIN
    DECLARE v_jour_semaine INT;
    DECLARE v_cours_recurrent_id INT;
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_days_until_target_day INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_professeur_count INT;
    DECLARE v_professeur_nom VARCHAR(255);
    DECLARE v_professeur_id INT;

    -- 1. Mappage et validation du jour
    SET v_jour_semaine = CASE LOWER(TRIM(p_jour_semaine))
        WHEN 'lundi' THEN 1
        WHEN 'mardi' THEN 2
        WHEN 'mercredi' THEN 3
        WHEN 'jeudi' THEN 4
        WHEN 'vendredi' THEN 5
        WHEN 'samedi' THEN 6
        WHEN 'dimanche' THEN 7
        ELSE NULL
    END;

    IF v_jour_semaine IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jour de la semaine invalide';
    END IF;

    -- 2. Calcul des dates
    SET v_days_until_target_day = (v_jour_semaine - (DAYOFWEEK(CURDATE()) - 1) + 7) % 7;
    IF v_days_until_target_day = 0 THEN SET v_days_until_target_day = 7; END IF;

    SET v_start_date = DATE_ADD(CURDATE(), INTERVAL v_days_until_target_day DAY);
    SET v_end_date = DATE_ADD(v_start_date, INTERVAL 1 YEAR);

    -- 3. Début transaction
    START TRANSACTION;

    -- 4. Insertion cours récurrent
    INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin)
    VALUES (p_type_cours, v_jour_semaine, p_heure_debut, p_heure_fin);
    SET v_cours_recurrent_id = LAST_INSERT_ID();

    -- 5. Génération des cours (méthode optimisée sans CTE)
    -- Création d'une table temporaire pour les semaines
    CREATE TEMPORARY TABLE temp_weeks (week_num INT);
    SET @week = 0;
    WHILE @week <= 52 DO
        INSERT INTO temp_weeks VALUES (@week);
        SET @week = @week + 1;
    END WHILE;

    INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
    SELECT
        DATE_ADD(v_start_date, INTERVAL (7 * week_num) DAY),
        p_type_cours,
        p_heure_debut,
        p_heure_fin,
        v_cours_recurrent_id
    FROM temp_weeks
    WHERE DATE_ADD(v_start_date, INTERVAL (7 * week_num) DAY) <= v_end_date;

    DROP TEMPORARY TABLE temp_weeks;

    -- 6. Association professeurs (version corrigée)
    SET v_professeur_count = JSON_LENGTH(p_professeurs);

    WHILE i < v_professeur_count DO
        SET v_professeur_nom = JSON_UNQUOTE(JSON_EXTRACT(p_professeurs, CONCAT('$[', i, ']')));
        SET v_professeur_id = NULL; -- Réinitialiser l'ID

        -- Recherche par nom complet (prénom + nom)
        SELECT id INTO v_professeur_id
        FROM professeurs
        WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) = TRIM(v_professeur_nom)
        LIMIT 1;

        -- Si pas trouvé par nom complet, essayer par nom seul (fallback)
        IF v_professeur_id IS NULL THEN
            SELECT id INTO v_professeur_id
            FROM professeurs
            WHERE TRIM(nom) = TRIM(v_professeur_nom)
            LIMIT 1;
        END IF;

        IF v_professeur_id IS NOT NULL THEN
            INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
            VALUES (v_cours_recurrent_id, v_professeur_id);
            SET i = i + 1; -- Incrémenter seulement si un professeur a été trouvé et ajouté
        ELSE
            -- Log d'erreur pour debug (optionnel)
            SET i = i + 1; -- Continuer même si le professeur n'est pas trouvé
        END IF;
    END WHILE;

    -- 7. Commit
    COMMIT;

    SELECT
        v_cours_recurrent_id AS cours_recurrent_id,
        CONCAT('Succès: ', (SELECT COUNT(*) FROM cours_recurrent_professeur WHERE cours_recurrent_id = v_cours_recurrent_id), ' professeur(s) associé(s)') AS message;
END //
DELIMITER ;



DELIMITER //
CREATE TRIGGER ajouter_professeur_apres_insert
AFTER INSERT ON utilisateurs
FOR EACH ROW
BEGIN
    IF NEW.status_id = 5 THEN
        IF NOT EXISTS (SELECT 1 FROM professeurs WHERE email = NEW.email) THEN
            INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
            VALUES (NEW.last_name, NEW.first_name, NEW.email, NEW.grade_id, NEW.status_id);
        END IF;
    END IF;
END//
DELIMITER ;

DELIMITER //

CREATE TRIGGER after_echeance_paiement_update
AFTER UPDATE ON echeances_paiements
FOR EACH ROW
BEGIN
    -- Vérifier si le statut a changé à 'payé' (que ce soit depuis 'en attente' ou 'échu')
    IF (OLD.statut = 'en attente' OR OLD.statut = 'échu') AND NEW.statut = 'payé' THEN
        -- Insérer une nouvelle ligne dans la table paiements
        INSERT INTO paiements (utilisateur_id, montant, date_paiement, statut, abonnement_id, periode_debut, periode_fin)
        VALUES (
            NEW.utilisateur_id,
            NEW.montant,
            NEW.date_paiement,  -- Assurez-vous que cette colonne est remplie lors de la mise à jour
            'validé',
            NEW.abonnement_id,
            -- Déterminer la période de début et de fin en fonction de la date d'échéance
            DATE_SUB(NEW.date_echeance, INTERVAL 1 MONTH),  -- Période de début (ajustez selon votre logique)
            NEW.date_echeance  -- Période de fin
        );
    END IF;
END//

DELIMITER ;


DELIMITER //
CREATE TRIGGER maj_professeur_apres_update
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN
    -- Si l'utilisateur était professeur et ne l'est plus, ou si son email a changé
    IF OLD.status_id = 5 AND (NEW.status_id <> 5 OR OLD.email <> NEW.email) THEN
        -- Récupérer l'ID du professeur dans la table professeurs
        SET @professeur_id = (SELECT id FROM professeurs WHERE email = OLD.email LIMIT 1);
        
        -- Supprimer toutes les associations avec les cours récurrents
        IF @professeur_id IS NOT NULL THEN
            DELETE FROM cours_recurrent_professeur WHERE professeur_id = @professeur_id;
        END IF;
        
        -- Supprimer le professeur de la table professeurs
        DELETE FROM professeurs WHERE email = OLD.email;
    END IF;
    
    -- Si l'utilisateur devient professeur
    IF NEW.status_id = 5 THEN
        IF EXISTS (SELECT 1 FROM professeurs WHERE email = NEW.email) THEN
            UPDATE professeurs
            SET nom = NEW.last_name, prenom = NEW.first_name, grade_id = NEW.grade_id, status_id = NEW.status_id
            WHERE email = NEW.email;
        ELSE
            INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
            VALUES (NEW.last_name, NEW.first_name, NEW.email, NEW.grade_id, NEW.status_id);
        END IF;
    END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER supprimer_professeur_apres_delete
AFTER DELETE ON utilisateurs
FOR EACH ROW
BEGIN
    IF OLD.status_id = 5 THEN
        -- Récupérer l'ID du professeur dans la table professeurs
        SET @professeur_id = (SELECT id FROM professeurs WHERE email = OLD.email LIMIT 1);
        
        -- Supprimer toutes les associations avec les cours récurrents
        IF @professeur_id IS NOT NULL THEN
            DELETE FROM cours_recurrent_professeur WHERE professeur_id = @professeur_id;
        END IF;
        
        -- Supprimer le professeur de la table professeurs
        DELETE FROM professeurs WHERE email = OLD.email;
    END IF;
END//
DELIMITER ;

DELIMITER //

CREATE TRIGGER after_utilisateur_update_abonnement
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN
    DECLARE v_old_abonnement_id INT;
    DECLARE v_new_abonnement_id INT;
    DECLARE v_date_inscription DATE;
    DECLARE v_periode VARCHAR(20);
    DECLARE v_prix DECIMAL(10, 2);
    DECLARE v_n INT DEFAULT 0;
    DECLARE v_date_echeance DATE;
    DECLARE v_montant DECIMAL(10, 2);
    DECLARE v_season_start DATE DEFAULT '2025-09-01';
    DECLARE v_season_end DATE DEFAULT '2026-08-31';

    -- Vérifier si l'abonnement a changé
    IF OLD.abonnement_id != NEW.abonnement_id THEN
        -- Supprimer les anciennes échéances de paiement
        DELETE FROM echeances_paiements WHERE utilisateur_id = NEW.id;

        -- Récupérer le nouvel abonnement
        SET v_new_abonnement_id = NEW.abonnement_id;

        -- Vérifier si le nouvel abonnement est valide
        IF v_new_abonnement_id IS NOT NULL THEN
            -- Récupérer les informations du nouvel abonnement
            SELECT periode, prix INTO v_periode, v_prix FROM plans_tarifaires WHERE id = v_new_abonnement_id;

            -- Utiliser la date d'inscription ou le début de la saison, selon ce qui est le plus récent
            SET v_date_inscription = GREATEST(NEW.date_inscription, v_season_start);

            -- Générer les nouvelles échéances en fonction de la période du nouvel abonnement
            WHILE v_n <= 12 DO
                CASE
                    WHEN v_periode = 'mois' THEN
                        SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n MONTH));
                    WHEN v_periode = 'trimestre' THEN
                        SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n*3 MONTH));
                    WHEN v_periode = 'an' THEN
                        SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n YEAR));
                END CASE;

                -- Vérifier que la date d'échéance est dans la saison 2025-2026
                IF v_date_echeance BETWEEN v_season_start AND v_season_end THEN
                    -- Calcul du montant proratisé pour la première échéance
                    IF v_n = 0 THEN
                        SET v_montant = ROUND(
                            v_prix *
                            CASE v_periode
                                WHEN 'mois' THEN
                                    (DAY(LAST_DAY(v_date_inscription)) - DAY(v_date_inscription) + 1) / DAY(LAST_DAY(v_date_inscription))
                                WHEN 'trimestre' THEN
                                    (DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 2 MONTH)), v_date_inscription) + 1) /
                                    DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 2 MONTH)), DATE_SUB(v_date_inscription, INTERVAL 3 MONTH))
                                WHEN 'an' THEN
                                    (DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 11 MONTH)), v_date_inscription) + 1) /
                                    DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 11 MONTH)), DATE_SUB(v_date_inscription, INTERVAL 1 YEAR))
                            END,
                            2
                        );
                    ELSE
                        SET v_montant = v_prix;
                    END IF;

                    -- Insérer la nouvelle échéance
                    INSERT INTO echeances_paiements (utilisateur_id, abonnement_id, date_echeance, montant, statut)
                    VALUES (NEW.id, v_new_abonnement_id, v_date_echeance, v_montant, 'en attente');
                END IF;

                SET v_n = v_n + 1;
            END WHILE;
        END IF;
    END IF;
END//

DELIMITER ;


DELIMITER //

CREATE TRIGGER after_utilisateur_insert
AFTER INSERT ON utilisateurs
FOR EACH ROW
BEGIN
    DECLARE v_abonnement_id INT;
    DECLARE v_date_inscription DATE;
    DECLARE v_periode VARCHAR(20);
    DECLARE v_prix DECIMAL(10, 2);
    DECLARE v_n INT DEFAULT 0;
    DECLARE v_date_echeance DATE;
    DECLARE v_montant DECIMAL(10, 2);
    DECLARE v_season_start DATE DEFAULT '2025-09-01';
    DECLARE v_season_end DATE DEFAULT '2026-08-31';

    -- Récupérer les informations de l'abonnement
    SET v_abonnement_id = NEW.abonnement_id;

    -- Vérifier si l'utilisateur a un abonnement
    IF v_abonnement_id IS NOT NULL THEN
        SELECT periode, prix INTO v_periode, v_prix FROM plans_tarifaires WHERE id = v_abonnement_id;

        -- Utiliser la date d'inscription ou le début de la saison, selon ce qui est le plus récent
        SET v_date_inscription = GREATEST(NEW.date_inscription, v_season_start);

        -- Générer les échéances en fonction de la période de l'abonnement
        WHILE v_n <= 12 DO
            CASE
                WHEN v_periode = 'mois' THEN
                    SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n MONTH));
                WHEN v_periode = 'trimestre' THEN
                    SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n*3 MONTH));
                WHEN v_periode = 'an' THEN
                    SET v_date_echeance = LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL v_n YEAR));
            END CASE;

            -- Vérifier que la date d'échéance est dans la saison 2025-2026
            IF v_date_echeance BETWEEN v_season_start AND v_season_end THEN
                -- Calcul du montant proratisé pour la première échéance
                IF v_n = 0 THEN
                    SET v_montant = ROUND(
                        v_prix *
                        CASE v_periode
                            WHEN 'mois' THEN
                                (DAY(LAST_DAY(v_date_inscription)) - DAY(v_date_inscription) + 1) / DAY(LAST_DAY(v_date_inscription))
                            WHEN 'trimestre' THEN
                                (DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 2 MONTH)), v_date_inscription) + 1) /
                                DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 2 MONTH)), DATE_SUB(v_date_inscription, INTERVAL 3 MONTH))
                            WHEN 'an' THEN
                                (DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 11 MONTH)), v_date_inscription) + 1) /
                                DATEDIFF(LAST_DAY(DATE_ADD(v_date_inscription, INTERVAL 11 MONTH)), DATE_SUB(v_date_inscription, INTERVAL 1 YEAR))
                        END,
                        2
                    );
                ELSE
                    SET v_montant = v_prix;
                END IF;

                -- Insérer l'échéance
                INSERT INTO echeances_paiements (utilisateur_id, abonnement_id, date_echeance, montant, statut)
                VALUES (NEW.id, v_abonnement_id, v_date_echeance, v_montant, 'en attente');
            END IF;

            SET v_n = v_n + 1;
        END WHILE;
    END IF;
END//

DELIMITER ;



DELIMITER //
CREATE PROCEDURE supprimer_association_professeur_cours(
    IN p_professeur_id INT,
    IN p_jour_semaine INT
)
BEGIN
    DECLARE association_id INT;
    SELECT id INTO association_id
    FROM cours_recurrent_professeur
    WHERE professeur_id = p_professeur_id
      AND cours_recurrent_id IN (
          SELECT id FROM cours_recurrent WHERE jour_semaine = p_jour_semaine
      )
    LIMIT 1;
    IF association_id IS NOT NULL THEN
        DELETE FROM cours_recurrent_professeur WHERE id = association_id;
        SELECT CONCAT('Association supprimée avec succès (ID: ', association_id, ')') AS message;
    ELSE
        SELECT 'Aucune association trouvée pour ce professeur et ce jour.' AS message;
    END IF;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE obtenir_statistiques_frequentation(IN utilisateur_id INT)
BEGIN
    WITH
    cours_recurrents_actifs AS (
      SELECT COUNT(*) AS total_cours_recurrents_actifs
      FROM cours_recurrent
      WHERE active = 1
    ),
    cours_par_mois AS (
      SELECT
        MONTHNAME(c.date_cours) as mois,
        MONTH(c.date_cours) as mois_num,
        YEAR(c.date_cours) as annee,
        (SELECT total_cours_recurrents_actifs FROM cours_recurrents_actifs) * 4 as total_cours_mois
      FROM cours c
      GROUP BY YEAR(c.date_cours), MONTH(c.date_cours)
    ),
    presences_par_mois AS (
      SELECT
        MONTHNAME(c.date_cours) as mois,
        MONTH(c.date_cours) as mois_num,
        YEAR(c.date_cours) as annee,
        COUNT(DISTINCT DATE(c.date_cours)) as presences_validees
      FROM inscriptions i
      JOIN cours c ON i.cours_id = c.id
      WHERE i.utilisateur_id = utilisateur_id
      AND i.status_id = 1
      GROUP BY YEAR(c.date_cours), MONTH(c.date_cours)
    ),
    total_frequentation AS (
      SELECT COUNT(*) as total FROM inscriptions WHERE utilisateur_id = utilisateur_id AND status_id = 1
    )
    SELECT
      COALESCE(p.mois, c.mois) as mois,
      COALESCE(p.presences_validees, 0) as frequentation,
      c.total_cours_mois as nombres_total_de_cours_du_mois,
      ROUND(COALESCE(p.presences_validees, 0) * 100.0 / NULLIF(c.total_cours_mois, 0), 2) as pourcentage_de_cours_valides,
      (SELECT total FROM total_frequentation) as totalFrequentation
    FROM cours_par_mois c
    LEFT JOIN presences_par_mois p ON c.annee = p.annee AND c.mois_num = p.mois_num
    ORDER BY c.annee, c.mois_num;
END//
DELIMITER ;

DELIMITER //

CREATE PROCEDURE inscrire_utilisateurs_aleatoirement()
BEGIN
    -- Désactiver temporairement les contraintes de clés étrangères
    SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
    SET FOREIGN_KEY_CHECKS = 0;

    -- Supprimer toutes les inscriptions
    DELETE FROM inscriptions;

    -- Réactiver les contraintes
    SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

    -- Insérer toutes les combinaisons utilisateurs x cours
    INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription)
    SELECT u.id, c.id, NOW()
    FROM utilisateurs u
    CROSS JOIN cours c;

    -- Mettre à jour le statut en fonction de l'activité de l'utilisateur
    UPDATE inscriptions i
    JOIN (
        SELECT id, (0.5 + (grade_id * 0.02)) AS user_activity_level
        FROM utilisateurs
    ) u ON i.utilisateur_id = u.id
    SET i.status_id = IF(RAND() < u.user_activity_level, 1, NULL);

    -- Retourner un seul message de succès
    SELECT 'Inscription et validation des présences terminées avec succès' AS message;
END//

DELIMITER ;



-- Insert des données
INSERT INTO genres (genre_name) VALUES ('Masculin'), ('Féminin');

INSERT INTO status (nom_role, description) VALUES
('visiteur', "s'est rendu à un cours d'essai, pas encore inscrit dans le système"),
('utilisateur', "membre de l'équipe sportive"),
('administrateur', "En plus d'être un membre, l'administrateur a quelques droits supplémentaires par rapport au simple utilisateur, ce sont souvent des professeurs"),
('super-administrateur', "Le seul et unique, a tous les droits"),
('professeur', "Tout est dans le titre");

INSERT INTO plans_tarifaires (nom_plan, prix, periode, description) VALUES
('mensuel', 25.00, 'mois', 'Abonnement de 25 EUR par mois'),
('trimestriel', 100.00, 'trimestre', 'Abonnement de 100 EUR tous les 3 mois'),
('annuel', 300.00, 'an', 'Abonnement de 300 EUR pour une année complète');

INSERT INTO grades (grade_id) VALUES
('ceinture blanche'), ('ceinture blanche une barette'), ('ceinture blanche deux barettes'),
('ceinture blanche trois barettes'), ('ceinture blanche quatre barettes'), ('ceinture bleue'),
('ceinture bleue une barette'), ('ceinture bleue deux barettes'), ('ceinture bleue trois barettes'),
('ceinture bleue quatre barettes'), ('ceinture violette'), ('ceinture violette une barette'),
('ceinture violette deux barettes'), ('ceinture violette trois barettes'), ('ceinture violette quatre barettes'),
('ceinture marron'), ('ceinture marron une barette'), ('ceinture marron deux barettes'),
('ceinture marron trois barettes'), ('ceinture marron quatre barettes'), ('ceinture noire'),
('ceinture noire une barette'), ('ceinture noire deux barettes'), ('ceinture noire trois barettes'),
('ceinture noire quatre barettes'), ('ceinture noire cinq barettes (ceinture noire avec bande rouge)'),
('ceinture noire six barettes (ceinture noire avec bande rouge)'),
('ceinture noire sept barettes (ceinture rouge et noire)'),
('ceinture noire huit barettes (ceinture rouge et noire)'),
('ceinture noire neuf barettes (ceinture rouge)'), ('ceinture noire dix barettes (ceinture rouge)');

INSERT INTO tailles (nom) VALUES ('S'), ('M'), ('L'), ('XL');

INSERT INTO categories (nom) VALUES
('Shorts'), ('Kimonos'), ('Ceintures'), ('Accessoires'), ('Rashguards'), ('Sac de transport');


INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin) VALUES
('Grappling', 1, '14:15:00', '16:00:00'),  -- Dimanche
('JJB', 2, '19:30:00', '21:15:00'),        -- Lundi
('JJB', 5, '19:30:00', '21:15:00'),        -- Jeudi
('Grappling', 7, '12:00:00', '13:30:00');  -- Samedi


SET @season_start = STR_TO_DATE('2025-09-01', '%Y-%m-%d');
SET @season_end   = STR_TO_DATE('2026-08-31', '%Y-%m-%d');

TRUNCATE TABLE cours;

INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
SELECT 
    DATE_ADD(@season_start, INTERVAL seq DAY) AS date_cours,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.id AS cours_recurrent_id
FROM (
    SELECT a.N + b.N*10 + c.N*100 + d.N*1000 AS seq
    FROM
      (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
       UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
      (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
       UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
      (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
       UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c,
      (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
       UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d
) numbers
JOIN cours_recurrent cr 
  ON DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = cr.jour_semaine
WHERE DATE_ADD(@season_start, INTERVAL seq DAY) BETWEEN @season_start AND @season_end
ORDER BY date_cours;




INSERT INTO articles (nom, description, prix, image_url, categorie_id) VALUES
('Rashguard manches longues noir', 'Rashguard respirant et compressif pour l''entraînement de grappling.', 34.99, 'https://example.com/rashguard-noir.jpg', 5),
('Short de grappling Venum', 'Short sans poches pour une pratique sécurisée du JJB.', 29.99, 'https://example.com/short-venum.jpg', 1),
('Kimono BJJ blanc - A2', 'Kimono de jiu-jitsu brésilien, coupe compétiteur.', 89.99, 'https://example.com/kimono-blanc.jpg', 2),
('Ceinture bleue BJJ', 'Ceinture officielle pour le jiu-jitsu brésilien, avec bande noire.', 14.99, 'https://example.com/ceinture-bleue.jpg', 3),
('Sac de sport JJB', 'Sac à dos résistant pour transporter ton équipement.', 39.99, 'https://example.com/sac-jjb.jpg', 6);

INSERT INTO stocks (article_id, taille_id, quantite) VALUES
(1, 2, 10), (1, 3, 12), (1, 4, 8),
(2, 2, 15), (2, 3, 10),
(3, 2, 5), (3, 3, 5),
(4, 2, 20), (4, 3, 20), (4, 4, 10),
(5, 2, 25);


INSERT INTO types_messages_personnalises (title, content) VALUES
('Bienvenue', 'Bienvenue sur notre plateforme !'),
('Rappel entraînement', 'N''oubliez pas l''entraînement de ce soir à 19h.'),
('Fermeture exceptionnelle', 'Le club sera fermé ce vendredi en raison d''un événement.'),
('Infos compétition', 'La compétition régionale aura lieu le 10 juin à Bruxelles.'),
('Mise à jour profil', 'Merci de mettre à jour vos informations dans votre espace membre.'),
('Rappel 1 - Facture impayée', 'Bonjour, nous vous rappelons que votre facture reste impayée. Merci de régulariser votre situation dans les plus brefs délais.'),
('Rappel 2 - Facture toujours en attente', 'Bonjour, sauf erreur de notre part, votre facture est toujours en attente de paiement. Merci de procéder au règlement au plus vite.'),
('Dernier rappel - Suspension possible', 'Bonjour, malgré nos rappels précédents, votre facture reste impayée. Sans régularisation dans les 5 jours, nous serons contraints de suspendre votre accès.'),
('Confirmation de paiement reçu', 'Bonjour, nous avons bien reçu votre paiement. Merci et à bientôt !');

-- Appels à la procédure upsert_utilisateur pour chaque utilisateur
CALL upsert_utilisateur('Cinéma', 'Burkinshaw', 'sburkinshaw0@reference.com', 1, '2002-08-09', 'cinema_burkinshaw', 3, 10, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Thérèsa', 'Farrall', 'hfarrall1@youku.com', 1, '1992-12-03', 'theresa_farrall', 1, 4, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mélanie', 'Paolacci', 'opaolacci2@indiegogo.com', 1, '1995-09-26', 'melanie_paolacci', 4, 13, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Jú', 'Farguhar', 'mfarguhar3@biblegateway.com', 1, '1967-06-06', 'ju_farguhar', 3, 1, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mélina', 'Dyter', 'cdyter4@last.fm', 1, '1970-08-20', 'melina_dyter', 3, 10, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Andrée', 'Scripture', 'jscripture5@slashdot.org', 1, '1997-12-18', 'andree_scripture', 4, 4, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Estée', 'Velte', 'mvelte6@soundcloud.com', 2, '1981-07-03', 'estee_velte', 3, 4, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Rachèle', 'Hame', 'jhame7@businesswire.com', 1, '1986-06-23', 'rachele_hame', 4, 18, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maïlis', 'Bracer', 'tbracer8@cloudflare.com', 2, '2011-09-13', 'mailis_bracer', 3, 14, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Cécilia', 'Ick', 'dick9@jigsy.com', 2, '1972-07-13', 'cecilia_ick', 4, 8, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Pò', 'Venart', 'evenarta@nhs.uk', 2, '2003-06-04', 'po_venart', 3, 14, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Dafnée', 'Woolston', 'mwoolstonb@skype.com', 2, '1993-03-24', 'dafnee_woolston', 4, 8, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Danièle', 'Edler', 'nedlerc@newyorker.com', 2, '1965-01-05', 'daniele_edler', 4, 10, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mélina', 'Bourton', 'lbourtond@miibeian.gov.cn', 2, '1983-06-26', 'melina_bourton', 1, 5, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Camélia', 'Stripling', 'jstriplinge@java.com', 1, '2000-03-12', 'camelia_stripling', 4, 1, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Irène', 'Castanaga', 'icastanagaf@google.com.br', 2, '2023-08-15', 'irene_castanaga', 3, 6, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Léone', 'Cranstone', 'ecranstoneg@google.it', 2, '1988-12-28', 'leone_cranstone', 1, 10, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maëly', 'Trayton', 'jtraytonh@barnesandnoble.com', 2, '2008-06-12', 'maely_trayton', 4, 20, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Néhémie', 'Gronav', 'sgronavi@whitehouse.gov', 1, '2007-06-15', 'nehemie_gronav', 1, 4, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Kuí', "O'Garmen", 'sogarmenj@posterous.com', 2, '1998-03-16', 'kui_ogarmen', 3, 3, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mårten', 'Haspineall', 'ahaspineallk@cdbaby.com', 1, '2005-11-09', 'marten_haspineall', 3, 16, 1, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Gaïa', 'Egarr', 'pegarrl@toplist.cz', 2, '1980-02-11', 'gaia_egarr', 3, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Angèle', 'Tickle', 'dticklem@washington.edu', 1, '1983-09-10', 'angele_tickle', 1, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maëline', 'MacKowle', 'omackowlen@zimbio.com', 1, '1962-01-06', 'maeline_mackowle', 1, 4, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Märta', 'Porch', 'cporcho@qq.com', 1, '1986-07-29', 'marta_porch', 1, 13, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Léana', 'Bessett', 'sbessettp@economist.com', 1, '2013-06-23', 'leana_bessett', 1, 18, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Eugénie', 'Petrello', 'lpetrelloq@reuters.com', 2, '1964-01-24', 'eugenie_petrello', 3, 17, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Loïs', 'Caneo', 'jcaneor@harvard.edu', 1, '1965-01-02', 'lois_caneo', 3, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Bécassine', 'Odhams', 'nodhamss@is.gd', 1, '2007-02-27', 'becassine_odhams', 4, 14, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Bérénice', 'Gateman', 'jgatemant@hhs.gov', 2, '1991-03-01', 'berenice_gateman', 4, 6, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Cléa', 'Caverhill', 'bcaverhillu@mayoclinic.com', 2, '2002-02-08', 'clea_caverhill', 1, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Styrbjörn', 'Foucar', 'afoucarv@nps.gov', 1, '1997-12-29', 'styrbjorn_foucar', 1, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Océane', 'Aleksashin', 'baleksashinw@chron.com', 2, '1996-03-02', 'oceane_aleksashin', 3, 16, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maéna', 'Brownlee', 'ebrownleex@scribd.com', 2, '1964-07-29', 'maena_brownlee', 4, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Danièle', 'Hunnam', 'nhunnamy@theguardian.com', 1, '2006-12-19', 'daniele_hunnam', 3, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Yáo', 'Mee', 'dmeez@bravesites.com', 2, '1963-05-17', 'yao_mee', 3, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Garçon', 'Liddiatt', 'aliddiatt10@typepad.com', 1, '1985-08-14', 'garcon_liddiatt', 3, 1, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Illustrée', 'Farfull', 'efarfull11@1688.com', 1, '2000-01-24', 'illustree_farfull', 1, 20, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Michèle', 'Capon', 'hcapon12@yale.edu', 1, '2005-01-18', 'michele_capon', 1, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Régine', 'Goulder', 'lgoulder13@twitpic.com', 2, '2008-04-02', 'regine_goulder', 1, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Josée', 'Lightbody', 'alightbody14@mac.com', 2, '1987-03-30', 'josee_lightbody', 4, 17, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Aimée', 'Rudman', 'trudman15@sina.com.cn', 2, '2008-10-31', 'aimee_rudman', 3, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Renée', 'Gregg', 'bgregg16@yellowbook.com', 2, '2017-08-13', 'renee_gregg', 3, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marie-josée', 'Stanners', 'cstanners17@feedburner.com', 2, '1993-05-11', 'marie_josee_stanners', 1, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Illustrée', 'Strafford', 'dstrafford18@parallels.com', 2, '2002-06-03', 'illustree_strafford', 3, 20, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Léonore', 'Elcox', 'relcox19@vkontakte.ru', 1, '2022-06-02', 'leonore_elcox', 3, 13, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maëly', 'Carrivick', 'scarrivick1a@gov.uk', 2, '1994-01-29', 'maely_carrivick', 3, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Geneviève', 'McFayden', 'nmcfayden1b@aol.com', 1, '1966-05-14', 'genevieve_mcfayden', 3, 4, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Nadège', 'Renowden', 'crenowden1c@furl.net', 2, '1991-12-08', 'nadege_renowden', 4, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Yè', 'Brunker', 'mbrunker1d@bluehost.com', 1, '2018-06-26', 'ye_brunker', 3, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Thérèsa', 'Kindleysides', 'rkindleysides1e@foxnews.com', 2, '1981-09-10', 'theresa_kindleysides', 1, 8, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lèi', 'Willimont', 'wwillimont1f@army.mil', 2, '2004-03-01', 'lei_willimont', 3, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Clélia', 'Darwent', 'zdarwent1g@multiply.com', 2, '2001-10-01', 'clelia_darwent', 4, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Rachèle', 'Bradmore', 'dbradmore1h@rakuten.co.jp', 1, '2011-12-25', 'rachele_bradmore', 1, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Dà', 'Huburn', 'mhuburn1i@intel.com', 2, '1961-03-13', 'da_huburn', 1, 10, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Clélia', 'Hargreave', 'jhargreave1j@macromedia.com', 1, '1989-12-28', 'clelia_hargreave', 3, 7, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Céline', 'Dring', 'bdring1k@csmonitor.com', 1, '1980-07-29', 'celine_dring', 3, 12, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Görel', 'Seine', 'fseine1l@abc.net.au', 2, '1993-11-02', 'gore_seine', 4, 20, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Loïs', 'Kettle', 'lkettle1m@reuters.com', 1, '1981-07-08', 'lois_kettle', 4, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Félicie', 'MacCulloch', 'cmacculloch1n@jigsy.com', 2, '1995-11-28', 'felicie_macculloch', 4, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Ruì', 'Corrie', 'scorrie1o@cmu.edu', 1, '1986-02-09', 'rui_corrie', 3, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Bérénice', 'Dumpleton', 'tdumpleton1p@myspace.com', 2, '1963-09-24', 'berenice_dumpleton', 3, 16, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marylène', 'Ledster', 'gledster1q@prnewswire.com', 1, '1990-03-18', 'marylene_ledster', 3, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Kuí', 'Fitzsimons', 'afitzsimons1r@ebay.co.uk', 1, '1989-11-01', 'kui_fitzsimons', 1, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Dà', 'Kalf', 'nkalf1s@businessinsider.com', 1, '1976-12-16', 'da_kalf', 1, 14, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Bécassine', 'Ferreli', 'iferreli1t@youku.com', 2, '1984-04-11', 'becassine_ferreli', 3, 18, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marie-josée', 'Northedge', 'knorthedge1u@baidu.com', 1, '1965-07-31', 'marie_josee_northedge', 1, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Méghane', 'Martinez', 'fmartinez1v@feedburner.com', 2, '1973-05-30', 'meghane_martinez', 4, 14, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Adèle', 'Spandley', 'ispandley1w@addthis.com', 1, '1970-07-19', 'adele_spandley', 3, 6, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Håkan', 'Stapylton', 'dstapylton1x@about.com', 1, '2011-02-03', 'hakan_stapylton', 4, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Gaétane', 'Elleyne', 'selleyne1y@symantec.com', 1, '1992-04-29', 'gaetane_elleyne', 3, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Angélique', 'Newborn', 'anewborn1z@economist.com', 1, '1984-11-02', 'angelique_newborn', 4, 16, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Salomé', 'Aldritt', 'caldritt20@live.com', 1, '1969-07-19', 'salome_aldritt', 4, 17, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mélinda', 'Sewards', 'asewards21@google.co.uk', 1, '1967-04-24', 'melinda_sewards', 1, 16, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Måns', 'covino', 'gcovino22@cisco.com', 2, '1979-09-09', 'mans_covino', 4, 5, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mårten', 'Blemen', 'cblemen23@bravesites.com', 1, '1988-05-30', 'marten_blemen', 1, 10, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Anaël', 'Crabtree', 'mcrabtree24@jugem.jp', 2, '1967-09-25', 'anael_crabtree', 4, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Yóu', 'Kenna', 'hkenna25@europa.eu', 2, '1989-02-23', 'you_kenna', 3, 13, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Laurène', 'Hanmore', 'jhanmore26@omniture.com', 2, '2009-05-02', 'laurene_hanmore', 3, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lén', 'Whorlow', 'cwhorlow27@gov.uk', 2, '2014-08-28', 'len_whorlow', 4, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Irène', 'Trapp', 'ytrapp28@addthis.com', 2, '2004-11-29', 'irene_trapp', 1, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marie-thérèse', 'Freshwater', 'efreshwater29@constantcontact.com', 2, '1985-04-09', 'marietherese_freshwater', 1, 11, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Ophélie', 'Gulk', 'ygulk2a@ucoz.ru', 1, '2023-02-12', 'ophelie_gulk', 4, 10, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Andréanne', 'Kynston', 'akynston2b@ebay.co.uk', 1, '1981-08-30', 'andreanne_kynston', 1, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Ráo', 'McConnal', 'emcconnal2c@ifeng.com', 2, '1970-02-22', 'rao_mcconnal', 1, 10, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Faîtes', 'Parkins', 'rparkins2d@studiopress.com', 2, '1980-06-15', 'faites_parkins', 4, 2, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Östen', 'Rooms', 'mrooms2e@nhs.uk', 1, '1979-09-17', 'osten_rooms', 1, 14, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Angélique', 'Mosedill', 'kmosedill2f@domainmarket.com', 2, '2011-08-27', 'angelique_mosedill', 4, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Noëlla', 'Baldery', 'vbaldery2g@whitehouse.gov', 2, '1970-06-17', 'noella_baldery', 3, 7, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Adélaïde', 'Beagan', 'mbeagan2h@examiner.com', 1, '1987-12-08', 'adelaide_beagan', 4, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Intéressant', 'Kowalik', 'dkowalik2i@163.com', 2, '2011-03-10', 'interessant_kowalik', 3, 3, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Fèi', 'Burleton', 'rburleton2j@wunderground.com', 2, '1989-07-17', 'fei_burleton', 4, 18, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Sélène', 'Cauderlie', 'scauderlie2k@google.es', 2, '2012-10-15', 'selene_cauderlie', 3, 11, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Göran', 'Leason', 'dleason2l@feedburner.com', 1, '2019-12-15', 'goran_leason', 1, 5, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Agnès', 'Widger', 'twidger2m@mtv.com', 1, '1997-12-16', 'agnes_widger', 1, 16, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Aimée', 'Clawson', 'aclawson2n@hugedomains.com', 1, '2009-05-21', 'aimee_clawson', 4, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Françoise', 'Andreasson', 'candreasson2o@shutterfly.com', 2, '1990-02-02', 'francoise_andreasson', 3, 6, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lén', 'Comoletti', 'jcomoletti2p@domainmarket.com', 2, '1976-01-02', 'len_comoletti', 4, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Björn', 'Eshelby', 'ceshelby2q@alibaba.com', 1, '2012-01-21', 'bjorn_eshelby', 3, 12, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Amélie', 'Milam', 'gmilam2r@yandex.ru', 1, '1984-04-19', 'amelie_milam', 1, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Åsa', 'Slainey', 'hslainey2s@quantcast.com', 2, '1990-02-15', 'asa_slainey', 4, 11, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Valérie', 'Ortiger', 'mortiger2t@spiegel.de', 1, '2002-02-16', 'valerie_ortiger', 3, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Dorothée', 'Weippert', 'eweippert2u@typepad.com', 2, '2010-09-03', 'dorothee_weippert', 4, 9, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Yè', 'Lambin', 'hlambin2v@ucoz.ru', 1, '1961-10-21', 'ye_lambin', 4, 7, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Nadège', 'Richardin', 'wrichardin2w@gizmodo.com', 2, '1961-03-01', 'nadege_richardin', 3, 20, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maïly', 'Narramore', 'jnarramore2x@jimdo.com', 2, '2016-04-30', 'maily_narramore', 3, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Stévina', 'Pregal', 'spregal2y@oaic.gov.au', 2, '1998-11-03', 'stevina_pregal', 4, 1, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Zoé', 'Forkan', 'aforkan2z@acquirethisname.com', 2, '1961-10-08', 'zoe_forkan', 3, 19, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maïlys', 'Searle', 'bsearle30@purevolume.com', 2, '2013-06-15', 'mailys_searle', 1, 5, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Régine', 'Crampin', 'acrampin31@1688.com', 1, '2011-10-21', 'regine_crampin', 4, 18, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lucrèce', 'Phelipeaux', 'fphelipeaux32@histats.com', 2, '2023-10-04', 'lucrece_phelipeaux', 1, 14, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Médiamass', 'Larmour', 'jlarmour33@t.co', 2, '1961-07-01', 'mediamass_larmour', 3, 15, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maïly', 'Thunders', 'dthunders34@yahoo.com', 2, '1991-05-03', 'maily_thunders', 3, 12, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Esbjörn', 'Kedwell', 'bkedwell35@cornell.edu', 2, '1991-12-04', 'esbjorn_kedwell', 4, 6, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Pénélope', 'Copeman', 'rcopeman36@sphinn.com', 1, '1976-05-11', 'penelope_copeman', 3, 20, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Dà', 'Gregoli', 'mgregoli37@t.co', 2, '2022-10-29', 'da_gregoli', 1, 13, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Aurélie', 'McKnockiter', 'gmcknockiter38@miitbeian.gov.cn', 2, '1993-07-22', 'aurélie_mcknockiter', 1, 21, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Anaël', 'Mussared', 'imussared39@photobucket.com', 2, '2001-09-17', 'anael_mussared', 4, 13, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marie-hélène', 'Scarisbrick', 'pscarisbrick3a@ezinearticles.com', 2, '1980-07-24', 'marie_helene_scarisbrick', 3, 17, 3, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Stéphanie', 'Twiddy', 'jtwiddy3b@over-blog.com', 2, '2005-03-10', 'stephanie_twiddy', 3, 16, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Tán', 'Nutkin', 'enutkin3c@oakley.com', 1, '1988-12-03', 'tan_nutkin', 3, 20, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Börje', 'Casham', 'ecasham3d@theguardian.com', 1, '2013-01-31', 'borje_casham', 3, 18, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Anaël', 'Larratt', 'dlarratt3e@live.com', 1, '2015-12-11', 'anael_larratt', 4, 19, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lóng', 'Dunridge', 'adunridge3f@homestead.com', 1, '1996-12-25', 'long_dunridge', 1, 17, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Adélaïde', 'Izkovicz', 'aizkovicz3g@google.cn', 1, '2001-04-22', 'adelaide_izkovicz', 4, 20, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Solène', 'Picken', 'kpicken3h@free.fr', 1, '1971-02-24', 'solene_picken', 4, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Anaïs', 'Ladbrooke', 'nladbrooke3i@nydailynews.com', 1, '1981-01-05', 'anais_ladbrooke', 1, 18, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Pénélope', 'Elloy', 'velloy3j@mediafire.com', 1, '1963-08-10', 'penelope_elloy', 3, 10, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Sélène', 'Robroe', 'frobroe3k@bravesites.com', 1, '1967-04-04', 'selene_robroe', 3, 10, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Mélys', 'Oris', 'boris3l@mozilla.com', 1, '2018-10-19', 'melys_oris', 4, 16, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Stévina', 'Shearsby', 'gshearsby3m@biblegateway.com', 1, '2005-01-17', 'stevina_shearsby', 3, 16, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Méthode', 'Durdle', 'ddurdle3n@myspace.com', 2, '1968-02-15', 'methode_durdle', 3, 2, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Célestine', 'Vedenyapin', 'bvedenyapin3o@foxnews.com', 1, '2007-06-18', 'celestine_vedenyapin', 4, 7, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Joséphine', 'Martelet', 'wmartelet3p@elegantthemes.com', 1, '2006-03-10', 'josephine_martelet', 3, 10, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Vénus', 'Limerick', 'rlimerick3q@mapy.cz', 2, '1986-02-13', 'venus_limerick', 3, 17, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Marie-ève', 'Mattersley', 'lmattersley3r@nps.gov', 1, '1975-04-26', 'marie_eve_mattersley', 3, 19, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Estève', 'Mackriell', 'smackriell3s@constantcontact.com', 2, '1965-12-02', 'esteve_mackriell', 1, 10, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Åsa', 'Ellph', 'kellph3t@theguardian.com', 2, '1977-05-26', 'asa_ellph', 4, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Célia', 'Olford', 'molford3u@4shared.com', 2, '1961-05-13', 'celia_olford', 3, 7, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maëlann', 'Hugues', 'whugues3v@microsoft.com', 2, '1971-10-02', 'maelann_hugues', 4, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Clémence', 'Coolahan', 'bcoolahan3w@google.com', 1, '2018-12-25', 'clemence_coolahan', 1, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Laïla', 'Varfalameev', 'lvarfalameev3x@usa.gov', 2, '1961-06-20', 'laila_varfalameev', 1, 10, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Agnès', 'Torrijos', 'dtorrijos3y@cmu.edu', 1, '1988-06-02', 'agnes_torrijos', 4, 15, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Lyséa', 'McKirdy', 'fmckirdy3z@mac.com', 2, '2008-08-03', 'lysea_mckirdy', 3, 6, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Maëlle', 'MacConchie', 'dmacconchie40@nbcnews.com', 1, '2000-07-08', 'maelle_macconchie', 3, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Méghane', 'Kear', 'ckear41@shutterfly.com', 2, '2008-11-03', 'meghane_kear', 1, 14, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Pò', 'Robjohns', 'crobjohns42@ebay.co.uk', 2, '1972-12-26', 'po_robjohns', 3, 7, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Kù', 'Sharville', 'fsharville43@digg.com', 2, '2001-04-12', 'ku_sharville', 3, 16, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Régine', 'Berkery', 'mberkery44@mashable.com', 1, '2018-11-29', 'regine_berkery', 1, 4, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Daphnée', 'Hastilow', 'ghastilow45@zimbio.com', 1, '1980-03-10', 'daphnee_hastilow', 1, 13, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Emmanuel', 'Snow', 'Emanuel.snow@gmail.com', 1, '1969-04-07', 'emanuel_snow', 5, 13, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Robin', 'Rivière', 'Robin.riviere@gmail.com', 1, '1975-05-10', 'robin_riviere', 5, 13, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Rachid', 'Belhoui', 'rachid.belhoui@gmail.com', 1, '1980-06-12', 'rachid_belhoui', 5, 13, 2, '$2y$10$...', 'NOW()');
CALL upsert_utilisateur('Benoit', 'Houthoofd', 'houthoofd.benoit48@gmail.com', 1, '1993-08-12', 'benoit_houthoofd', 4, 13, 2, '$2y$10$...', 'NOW()');


-- Défibit aléatoirement des dates d'inscription
-- Définir les bornes de la saison
SET @season_start = STR_TO_DATE('2025-09-01', '%Y-%m-%d');
SET @season_end   = STR_TO_DATE('2026-08-31', '%Y-%m-%d');

-- Mettre à jour la date d'inscription de tous les utilisateurs avec une date aléatoire dans la saison
UPDATE utilisateurs
SET date_inscription = DATE_ADD(
    @season_start,
    INTERVAL FLOOR(RAND() * DATEDIFF(@season_end, @season_start)) DAY
)
WHERE id > 0;  -- Met à jour tous les utilisateurs existants



INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
SELECT last_name, first_name, email, grade_id, status_id
FROM utilisateurs
WHERE status_id = 5
ON DUPLICATE KEY UPDATE
  nom       = VALUES(nom),
  prenom    = VALUES(prenom),
  grade_id  = VALUES(grade_id),
  status_id = VALUES(status_id);


-- Génère aléatoirement des paiements pour les utilisateurs existants
INSERT INTO paiements (utilisateur_id, montant, date_paiement, statut, abonnement_id, periode_debut, periode_fin)
SELECT
  u.id,
  CASE FLOOR(RAND() * 3) + 1
    WHEN 1 THEN 25.00
    WHEN 2 THEN 100.00
    ELSE 300.00
  END AS montant,
  DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 365) DAY) AS date_paiement,
  'validé' AS statut,
  FLOOR(RAND() * 3) + 1 AS abonnement_id,
  DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 365) DAY) AS periode_debut,
  DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 730) DAY) AS periode_fin
FROM utilisateurs u
WHERE u.id <= 50;

INSERT INTO commandes (utilisateur_id, statut) VALUES
(1, 'en attente'), (1, 'payée');

INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix) VALUES
(1, 1, 3, 1, 34.99),  -- Rashguard L
(1, 2, 2, 1, 29.99),  -- Short M
(2, 3, 3, 1, 89.99),  -- Kimono L
(2, 4, 3, 1, 14.99);  -- Ceinture L


SELECT COUNT(*) AS total_inscriptions FROM inscriptions;
SELECT COUNT(*) AS total_presences_validees FROM inscriptions WHERE status_id = 1;
SELECT u.first_name, u.last_name, COUNT(i.id) AS total_presences_validees
FROM utilisateurs u
LEFT JOIN inscriptions i ON u.id = i.utilisateur_id AND i.status_id = 1
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_presences_validees DESC
LIMIT 10;

-- Réactiver les clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
