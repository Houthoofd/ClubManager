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
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    genre_id INT,
    date_of_birth DATE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status_id INT DEFAULT 1,
    grade_id INT DEFAULT 1,
    abonnement_id INT,
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    FOREIGN KEY (status_id) REFERENCES status(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id),
    INDEX idx_email (email),
    INDEX idx_status (status_id)
) ENGINE=InnoDB;

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
    utilisateur_id INT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date_paiement DATE NOT NULL,
    statut ENUM('validé', 'en attente', 'pas encore effectué') DEFAULT 'pas encore effectué',
    abonnement_id INT,
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id) ON DELETE SET NULL,
    UNIQUE KEY uk_utilisateur_periode (utilisateur_id, periode_debut),
    INDEX idx_utilisateur_statut (utilisateur_id, statut)
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

SET @current_year = YEAR(CURDATE());
SET @season_start = STR_TO_DATE(CONCAT(CASE WHEN MONTH(CURDATE()) < 9 THEN @current_year - 1 ELSE @current_year END, '-09-01'), '%Y-%m-%d');
SET @season_end = DATE_ADD(@season_start, INTERVAL 730 DAY);

INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
SELECT
    DATE_ADD(@season_start, INTERVAL seq DAY) AS date_cours,
    cr.type_cours,
    CASE
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 2 THEN '19:30:00'    -- Lundi
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 5 THEN '19:30:00'    -- Jeudi
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 7 THEN '12:00:00'    -- Samedi
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 1 THEN '14:15:00'    -- Dimanche
    END AS heure_debut,
    CASE
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 2 THEN '21:15:00'
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 5 THEN '21:15:00'
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 7 THEN '13:30:00'
        WHEN DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY)) = 1 THEN '16:00:00'
    END AS heure_fin,
    cr.id AS cours_recurrent_id
FROM (
    SELECT a.N + b.N * 10 + c.N * 100 AS seq
    FROM
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) c
) numbers
JOIN cours_recurrent cr ON cr.jour_semaine = DAYOFWEEK(DATE_ADD(@season_start, INTERVAL seq DAY))
WHERE DATE_ADD(@season_start, INTERVAL seq DAY) <= @season_end;


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

DELIMITER //

CREATE PROCEDURE upsert_utilisateur(
    IN p_id INT,
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_genre_id INT,
    IN p_date_of_birth DATE,
    IN p_nom_utilisateur VARCHAR(50),
    IN p_status_id INT,
    IN p_grade_id INT,
    IN p_abonnement_id INT,
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_existing_nom_utilisateur VARCHAR(50);

    -- Vérifier si l'utilisateur existe déjà
    SELECT COUNT(*) INTO v_count FROM utilisateurs WHERE id = p_id;

    -- Vérifier si le nom_utilisateur existe déjà pour un autre utilisateur
    SELECT nom_utilisateur INTO v_existing_nom_utilisateur
    FROM utilisateurs
    WHERE nom_utilisateur = p_nom_utilisateur AND id != p_id;

    -- Si le nom_utilisateur existe déjà pour un autre utilisateur, ajouter un suffixe
    IF v_existing_nom_utilisateur IS NOT NULL THEN
        SET p_nom_utilisateur = CONCAT(p_nom_utilisateur, '_', FLOOR(RAND() * 1000));
    END IF;

    START TRANSACTION;

    -- Si l'utilisateur n'existe pas, l'insérer
    IF v_count = 0 THEN
        INSERT INTO utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, nom_utilisateur, status_id, grade_id, abonnement_id, password)
        VALUES (p_id, p_first_name, p_last_name, p_email, p_genre_id, p_date_of_birth, p_nom_utilisateur, p_status_id, p_grade_id, p_abonnement_id, p_password);
    -- Sinon, le mettre à jour
    ELSE
        UPDATE utilisateurs
        SET first_name = p_first_name,
            last_name = p_last_name,
            email = p_email,
            genre_id = p_genre_id,
            date_of_birth = p_date_of_birth,
            nom_utilisateur = p_nom_utilisateur,
            status_id = p_status_id,
            grade_id = p_grade_id,
            abonnement_id = p_abonnement_id,
            password = p_password
        WHERE id = p_id;
    END IF;

    COMMIT;

    SELECT CONCAT('Utilisateur ', p_id, ' a été ', IF(v_count = 0, 'inséré', 'mis à jour'), ' avec succès.') AS message;
END //

DELIMITER ;



-- Appels à la procédure upsert_utilisateur pour chaque utilisateur
CALL upsert_utilisateur(1, 'Cinéma', 'Burkinshaw', 'sburkinshaw0@reference.com', 1, '2002-08-09', 'cinema_burkinshaw', 3, 10, 1, '$2y$10$...');
CALL upsert_utilisateur(2, 'Thérèsa', 'Farrall', 'hfarrall1@youku.com', 1, '1992-12-03', 'theresa_farrall', 1, 4, 1, '$2y$10$...');
CALL upsert_utilisateur(3, 'Mélanie', 'Paolacci', 'opaolacci2@indiegogo.com', 1, '1995-09-26', 'melanie_paolacci', 4, 13, 1, '$2y$10$...');
CALL upsert_utilisateur(4, 'Jú', 'Farguhar', 'mfarguhar3@biblegateway.com', 1, '1967-06-06', 'ju_farguhar', 3, 1, 1, '$2y$10$...');
CALL upsert_utilisateur(5, 'Mélina', 'Dyter', 'cdyter4@last.fm', 1, '1970-08-20', 'melina_dyter', 3, 10, 1, '$2y$10$...');
CALL upsert_utilisateur(6, 'Andrée', 'Scripture', 'jscripture5@slashdot.org', 1, '1997-12-18', 'andree_scripture', 4, 4, 1, '$2y$10$...');
CALL upsert_utilisateur(7, 'Estée', 'Velte', 'mvelte6@soundcloud.com', 2, '1981-07-03', 'estee_velte', 3, 4, 1, '$2y$10$...');
CALL upsert_utilisateur(8, 'Rachèle', 'Hame', 'jhame7@businesswire.com', 1, '1986-06-23', 'rachele_hame', 4, 18, 1, '$2y$10$...');
CALL upsert_utilisateur(9, 'Maïlis', 'Bracer', 'tbracer8@cloudflare.com', 2, '2011-09-13', 'mailis_bracer', 3, 14, 1, '$2y$10$...');
CALL upsert_utilisateur(10, 'Cécilia', 'Ick', 'dick9@jigsy.com', 2, '1972-07-13', 'cecilia_ick', 4, 8, 1, '$2y$10$...');
CALL upsert_utilisateur(11, 'Pò', 'Venart', 'evenarta@nhs.uk', 2, '2003-06-04', 'po_venart', 3, 14, 1, '$2y$10$...');
CALL upsert_utilisateur(12, 'Dafnée', 'Woolston', 'mwoolstonb@skype.com', 2, '1993-03-24', 'dafnee_woolston', 4, 8, 1, '$2y$10$...');
CALL upsert_utilisateur(13, 'Danièle', 'Edler', 'nedlerc@newyorker.com', 2, '1965-01-05', 'daniele_edler', 4, 10, 1, '$2y$10$...');
CALL upsert_utilisateur(14, 'Mélina', 'Bourton', 'lbourtond@miibeian.gov.cn', 2, '1983-06-26', 'melina_bourton', 1, 5, 1, '$2y$10$...');
CALL upsert_utilisateur(15, 'Camélia', 'Stripling', 'jstriplinge@java.com', 1, '2000-03-12', 'camelia_stripling', 4, 1, 1, '$2y$10$...');
CALL upsert_utilisateur(16, 'Irène', 'Castanaga', 'icastanagaf@google.com.br', 2, '2023-08-15', 'irene_castanaga', 3, 6, 1, '$2y$10$...');
CALL upsert_utilisateur(17, 'Léone', 'Cranstone', 'ecranstoneg@google.it', 2, '1988-12-28', 'leone_cranstone', 1, 10, 1, '$2y$10$...');
CALL upsert_utilisateur(18, 'Maëly', 'Trayton', 'jtraytonh@barnesandnoble.com', 2, '2008-06-12', 'maely_trayton', 4, 20, 1, '$2y$10$...');
CALL upsert_utilisateur(19, 'Néhémie', 'Gronav', 'sgronavi@whitehouse.gov', 1, '2007-06-15', 'nehemie_gronav', 1, 4, 1, '$2y$10$...');
CALL upsert_utilisateur(20, 'Kuí', "O'Garmen", 'sogarmenj@posterous.com', 2, '1998-03-16', 'kui_ogarmen', 3, 3, 1, '$2y$10$...');
CALL upsert_utilisateur(21, 'Mårten', 'Haspineall', 'ahaspineallk@cdbaby.com', 1, '2005-11-09', 'marten_haspineall', 3, 16, 1, '$2y$10$...');
CALL upsert_utilisateur(22, 'Gaïa', 'Egarr', 'pegarrl@toplist.cz', 2, '1980-02-11', 'gaia_egarr', 3, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(23, 'Angèle', 'Tickle', 'dticklem@washington.edu', 1, '1983-09-10', 'angele_tickle', 1, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(24, 'Maëline', 'MacKowle', 'omackowlen@zimbio.com', 1, '1962-01-06', 'maeline_mackowle', 1, 4, 3, '$2y$10$...');
CALL upsert_utilisateur(25, 'Märta', 'Porch', 'cporcho@qq.com', 1, '1986-07-29', 'marta_porch', 1, 13, 3, '$2y$10$...');
CALL upsert_utilisateur(26, 'Léana', 'Bessett', 'sbessettp@economist.com', 1, '2013-06-23', 'leana_bessett', 1, 18, 3, '$2y$10$...');
CALL upsert_utilisateur(27, 'Eugénie', 'Petrello', 'lpetrelloq@reuters.com', 2, '1964-01-24', 'eugenie_petrello', 3, 17, 3, '$2y$10$...');
CALL upsert_utilisateur(28, 'Loïs', 'Caneo', 'jcaneor@harvard.edu', 1, '1965-01-02', 'lois_caneo', 3, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(29, 'Bécassine', 'Odhams', 'nodhamss@is.gd', 1, '2007-02-27', 'becassine_odhams', 4, 14, 3, '$2y$10$...');
CALL upsert_utilisateur(30, 'Bérénice', 'Gateman', 'jgatemant@hhs.gov', 2, '1991-03-01', 'berenice_gateman', 4, 6, 3, '$2y$10$...');
CALL upsert_utilisateur(31, 'Cléa', 'Caverhill', 'bcaverhillu@mayoclinic.com', 2, '2002-02-08', 'clea_caverhill', 1, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(32, 'Styrbjörn', 'Foucar', 'afoucarv@nps.gov', 1, '1997-12-29', 'styrbjorn_foucar', 1, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(33, 'Océane', 'Aleksashin', 'baleksashinw@chron.com', 2, '1996-03-02', 'oceane_aleksashin', 3, 16, 3, '$2y$10$...');
CALL upsert_utilisateur(34, 'Maéna', 'Brownlee', 'ebrownleex@scribd.com', 2, '1964-07-29', 'maena_brownlee', 4, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(35, 'Danièle', 'Hunnam', 'nhunnamy@theguardian.com', 1, '2006-12-19', 'daniele_hunnam', 3, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(36, 'Yáo', 'Mee', 'dmeez@bravesites.com', 2, '1963-05-17', 'yao_mee', 3, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(37, 'Garçon', 'Liddiatt', 'aliddiatt10@typepad.com', 1, '1985-08-14', 'garcon_liddiatt', 3, 1, 3, '$2y$10$...');
CALL upsert_utilisateur(38, 'Illustrée', 'Farfull', 'efarfull11@1688.com', 1, '2000-01-24', 'illustree_farfull', 1, 20, 3, '$2y$10$...');
CALL upsert_utilisateur(39, 'Michèle', 'Capon', 'hcapon12@yale.edu', 1, '2005-01-18', 'michele_capon', 1, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(40, 'Régine', 'Goulder', 'lgoulder13@twitpic.com', 2, '2008-04-02', 'regine_goulder', 1, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(41, 'Josée', 'Lightbody', 'alightbody14@mac.com', 2, '1987-03-30', 'josee_lightbody', 4, 17, 3, '$2y$10$...');
CALL upsert_utilisateur(42, 'Aimée', 'Rudman', 'trudman15@sina.com.cn', 2, '2008-10-31', 'aimee_rudman', 3, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(43, 'Renée', 'Gregg', 'bgregg16@yellowbook.com', 2, '2017-08-13', 'renee_gregg', 3, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(44, 'Marie-josée', 'Stanners', 'cstanners17@feedburner.com', 2, '1993-05-11', 'marie_josee_stanners', 1, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(45, 'Illustrée', 'Strafford', 'dstrafford18@parallels.com', 2, '2002-06-03', 'illustree_strafford', 3, 20, 3, '$2y$10$...');
CALL upsert_utilisateur(46, 'Léonore', 'Elcox', 'relcox19@vkontakte.ru', 1, '2022-06-02', 'leonore_elcox', 3, 13, 3, '$2y$10$...');
CALL upsert_utilisateur(47, 'Maëly', 'Carrivick', 'scarrivick1a@gov.uk', 2, '1994-01-29', 'maely_carrivick', 3, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(48, 'Geneviève', 'McFayden', 'nmcfayden1b@aol.com', 1, '1966-05-14', 'genevieve_mcfayden', 3, 4, 3, '$2y$10$...');
CALL upsert_utilisateur(49, 'Nadège', 'Renowden', 'crenowden1c@furl.net', 2, '1991-12-08', 'nadege_renowden', 4, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(50, 'Yè', 'Brunker', 'mbrunker1d@bluehost.com', 1, '2018-06-26', 'ye_brunker', 3, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(51, 'Thérèsa', 'Kindleysides', 'rkindleysides1e@foxnews.com', 2, '1981-09-10', 'theresa_kindleysides', 1, 8, 3, '$2y$10$...');
CALL upsert_utilisateur(52, 'Lèi', 'Willimont', 'wwillimont1f@army.mil', 2, '2004-03-01', 'lei_willimont', 3, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(53, 'Clélia', 'Darwent', 'zdarwent1g@multiply.com', 2, '2001-10-01', 'clelia_darwent', 4, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(54, 'Rachèle', 'Bradmore', 'dbradmore1h@rakuten.co.jp', 1, '2011-12-25', 'rachele_bradmore', 1, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(55, 'Dà', 'Huburn', 'mhuburn1i@intel.com', 2, '1961-03-13', 'da_huburn', 1, 10, 3, '$2y$10$...');
CALL upsert_utilisateur(56, 'Clélia', 'Hargreave', 'jhargreave1j@macromedia.com', 1, '1989-12-28', 'clelia_hargreave', 3, 7, 3, '$2y$10$...');
CALL upsert_utilisateur(57, 'Céline', 'Dring', 'bdring1k@csmonitor.com', 1, '1980-07-29', 'celine_dring', 3, 12, 3, '$2y$10$...');
CALL upsert_utilisateur(58, 'Görel', 'Seine', 'fseine1l@abc.net.au', 2, '1993-11-02', 'gore_seine', 4, 20, 3, '$2y$10$...');
CALL upsert_utilisateur(59, 'Loïs', 'Kettle', 'lkettle1m@reuters.com', 1, '1981-07-08', 'lois_kettle', 4, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(60, 'Félicie', 'MacCulloch', 'cmacculloch1n@jigsy.com', 2, '1995-11-28', 'felicie_macculloch', 4, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(61, 'Ruì', 'Corrie', 'scorrie1o@cmu.edu', 1, '1986-02-09', 'rui_corrie', 3, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(62, 'Bérénice', 'Dumpleton', 'tdumpleton1p@myspace.com', 2, '1963-09-24', 'berenice_dumpleton', 3, 16, 3, '$2y$10$...');
CALL upsert_utilisateur(63, 'Marylène', 'Ledster', 'gledster1q@prnewswire.com', 1, '1990-03-18', 'marylene_ledster', 3, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(64, 'Kuí', 'Fitzsimons', 'afitzsimons1r@ebay.co.uk', 1, '1989-11-01', 'kui_fitzsimons', 1, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(65, 'Dà', 'Kalf', 'nkalf1s@businessinsider.com', 1, '1976-12-16', 'da_kalf', 1, 14, 3, '$2y$10$...');
CALL upsert_utilisateur(66, 'Bécassine', 'Ferreli', 'iferreli1t@youku.com', 2, '1984-04-11', 'becassine_ferreli', 3, 18, 3, '$2y$10$...');
CALL upsert_utilisateur(67, 'Marie-josée', 'Northedge', 'knorthedge1u@baidu.com', 1, '1965-07-31', 'marie_josee_northedge', 1, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(68, 'Méghane', 'Martinez', 'fmartinez1v@feedburner.com', 2, '1973-05-30', 'meghane_martinez', 4, 14, 3, '$2y$10$...');
CALL upsert_utilisateur(69, 'Adèle', 'Spandley', 'ispandley1w@addthis.com', 1, '1970-07-19', 'adele_spandley', 3, 6, 3, '$2y$10$...');
CALL upsert_utilisateur(70, 'Håkan', 'Stapylton', 'dstapylton1x@about.com', 1, '2011-02-03', 'hakan_stapylton', 4, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(71, 'Gaétane', 'Elleyne', 'selleyne1y@symantec.com', 1, '1992-04-29', 'gaetane_elleyne', 3, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(72, 'Angélique', 'Newborn', 'anewborn1z@economist.com', 1, '1984-11-02', 'angelique_newborn', 4, 16, 3, '$2y$10$...');
CALL upsert_utilisateur(73, 'Salomé', 'Aldritt', 'caldritt20@live.com', 1, '1969-07-19', 'salome_aldritt', 4, 17, 3, '$2y$10$...');
CALL upsert_utilisateur(74, 'Mélinda', 'Sewards', 'asewards21@google.co.uk', 1, '1967-04-24', 'melinda_sewards', 1, 16, 3, '$2y$10$...');
CALL upsert_utilisateur(75, 'Måns', 'covino', 'gcovino22@cisco.com', 2, '1979-09-09', 'mans_covino', 4, 5, 3, '$2y$10$...');
CALL upsert_utilisateur(76, 'Mårten', 'Blemen', 'cblemen23@bravesites.com', 1, '1988-05-30', 'marten_blemen', 1, 10, 3, '$2y$10$...');
CALL upsert_utilisateur(77, 'Anaël', 'Crabtree', 'mcrabtree24@jugem.jp', 2, '1967-09-25', 'anael_crabtree', 4, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(78, 'Yóu', 'Kenna', 'hkenna25@europa.eu', 2, '1989-02-23', 'you_kenna', 3, 13, 3, '$2y$10$...');
CALL upsert_utilisateur(79, 'Laurène', 'Hanmore', 'jhanmore26@omniture.com', 2, '2009-05-02', 'laurene_hanmore', 3, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(80, 'Lén', 'Whorlow', 'cwhorlow27@gov.uk', 2, '2014-08-28', 'len_whorlow', 4, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(81, 'Irène', 'Trapp', 'ytrapp28@addthis.com', 2, '2004-11-29', 'irene_trapp', 1, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(82, 'Marie-thérèse', 'Freshwater', 'efreshwater29@constantcontact.com', 2, '1985-04-09', 'marietherese_freshwater', 1, 11, 3, '$2y$10$...');
CALL upsert_utilisateur(83, 'Ophélie', 'Gulk', 'ygulk2a@ucoz.ru', 1, '2023-02-12', 'ophelie_gulk', 4, 10, 3, '$2y$10$...');
CALL upsert_utilisateur(84, 'Andréanne', 'Kynston', 'akynston2b@ebay.co.uk', 1, '1981-08-30', 'andreanne_kynston', 1, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(85, 'Ráo', 'McConnal', 'emcconnal2c@ifeng.com', 2, '1970-02-22', 'rao_mcconnal', 1, 10, 3, '$2y$10$...');
CALL upsert_utilisateur(86, 'Faîtes', 'Parkins', 'rparkins2d@studiopress.com', 2, '1980-06-15', 'faites_parkins', 4, 2, 3, '$2y$10$...');
CALL upsert_utilisateur(87, 'Östen', 'Rooms', 'mrooms2e@nhs.uk', 1, '1979-09-17', 'osten_rooms', 1, 14, 3, '$2y$10$...');
CALL upsert_utilisateur(88, 'Angélique', 'Mosedill', 'kmosedill2f@domainmarket.com', 2, '2011-08-27', 'angelique_mosedill', 4, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(89, 'Noëlla', 'Baldery', 'vbaldery2g@whitehouse.gov', 2, '1970-06-17', 'noella_baldery', 3, 7, 3, '$2y$10$...');
CALL upsert_utilisateur(90, 'Adélaïde', 'Beagan', 'mbeagan2h@examiner.com', 1, '1987-12-08', 'adelaide_beagan', 4, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(91, 'Intéressant', 'Kowalik', 'dkowalik2i@163.com', 2, '2011-03-10', 'interessant_kowalik', 3, 3, 3, '$2y$10$...');
CALL upsert_utilisateur(92, 'Fèi', 'Burleton', 'rburleton2j@wunderground.com', 2, '1989-07-17', 'fei_burleton', 4, 18, 3, '$2y$10$...');
CALL upsert_utilisateur(93, 'Sélène', 'Cauderlie', 'scauderlie2k@google.es', 2, '2012-10-15', 'selene_cauderlie', 3, 11, 3, '$2y$10$...');
CALL upsert_utilisateur(94, 'Göran', 'Leason', 'dleason2l@feedburner.com', 1, '2019-12-15', 'goran_leason', 1, 5, 3, '$2y$10$...');
CALL upsert_utilisateur(95, 'Agnès', 'Widger', 'twidger2m@mtv.com', 1, '1997-12-16', 'agnes_widger', 1, 16, 3, '$2y$10$...');
CALL upsert_utilisateur(96, 'Aimée', 'Clawson', 'aclawson2n@hugedomains.com', 1, '2009-05-21', 'aimee_clawson', 4, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(97, 'Françoise', 'Andreasson', 'candreasson2o@shutterfly.com', 2, '1990-02-02', 'francoise_andreasson', 3, 6, 3, '$2y$10$...');
CALL upsert_utilisateur(98, 'Lén', 'Comoletti', 'jcomoletti2p@domainmarket.com', 2, '1976-01-02', 'len_comoletti', 4, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(99, 'Björn', 'Eshelby', 'ceshelby2q@alibaba.com', 1, '2012-01-21', 'bjorn_eshelby', 3, 12, 3, '$2y$10$...');
CALL upsert_utilisateur(100, 'Amélie', 'Milam', 'gmilam2r@yandex.ru', 1, '1984-04-19', 'amelie_milam', 1, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(101, 'Åsa', 'Slainey', 'hslainey2s@quantcast.com', 2, '1990-02-15', 'asa_slainey', 4, 11, 3, '$2y$10$...');
CALL upsert_utilisateur(102, 'Valérie', 'Ortiger', 'mortiger2t@spiegel.de', 1, '2002-02-16', 'valerie_ortiger', 3, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(103, 'Dorothée', 'Weippert', 'eweippert2u@typepad.com', 2, '2010-09-03', 'dorothee_weippert', 4, 9, 3, '$2y$10$...');
CALL upsert_utilisateur(104, 'Yè', 'Lambin', 'hlambin2v@ucoz.ru', 1, '1961-10-21', 'ye_lambin', 4, 7, 3, '$2y$10$...');
CALL upsert_utilisateur(105, 'Nadège', 'Richardin', 'wrichardin2w@gizmodo.com', 2, '1961-03-01', 'nadege_richardin', 3, 20, 3, '$2y$10$...');
CALL upsert_utilisateur(106, 'Maïly', 'Narramore', 'jnarramore2x@jimdo.com', 2, '2016-04-30', 'maily_narramore', 3, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(107, 'Stévina', 'Pregal', 'spregal2y@oaic.gov.au', 2, '1998-11-03', 'stevina_pregal', 4, 1, 3, '$2y$10$...');
CALL upsert_utilisateur(108, 'Zoé', 'Forkan', 'aforkan2z@acquirethisname.com', 2, '1961-10-08', 'zoe_forkan', 3, 19, 3, '$2y$10$...');
CALL upsert_utilisateur(109, 'Maïlys', 'Searle', 'bsearle30@purevolume.com', 2, '2013-06-15', 'mailys_searle', 1, 5, 3, '$2y$10$...');
CALL upsert_utilisateur(110, 'Régine', 'Crampin', 'acrampin31@1688.com', 1, '2011-10-21', 'regine_crampin', 4, 18, 3, '$2y$10$...');
CALL upsert_utilisateur(111, 'Lucrèce', 'Phelipeaux', 'fphelipeaux32@histats.com', 2, '2023-10-04', 'lucrece_phelipeaux', 1, 14, 3, '$2y$10$...');
CALL upsert_utilisateur(112, 'Médiamass', 'Larmour', 'jlarmour33@t.co', 2, '1961-07-01', 'mediamass_larmour', 3, 15, 3, '$2y$10$...');
CALL upsert_utilisateur(113, 'Maïly', 'Thunders', 'dthunders34@yahoo.com', 2, '1991-05-03', 'maily_thunders', 3, 12, 3, '$2y$10$...');
CALL upsert_utilisateur(114, 'Esbjörn', 'Kedwell', 'bkedwell35@cornell.edu', 2, '1991-12-04', 'esbjorn_kedwell', 4, 6, 3, '$2y$10$...');
CALL upsert_utilisateur(115, 'Pénélope', 'Copeman', 'rcopeman36@sphinn.com', 1, '1976-05-11', 'penelope_copeman', 3, 20, 3, '$2y$10$...');
CALL upsert_utilisateur(116, 'Dà', 'Gregoli', 'mgregoli37@t.co', 2, '2022-10-29', 'da_gregoli', 1, 13, 3, '$2y$10$...');
CALL upsert_utilisateur(117, 'Aurélie', 'McKnockiter', 'gmcknockiter38@miitbeian.gov.cn', 2, '1993-07-22', 'aurélie_mcknockiter', 1, 21, 3, '$2y$10$...');
CALL upsert_utilisateur(118, 'Anaël', 'Mussared', 'imussared39@photobucket.com', 2, '2001-09-17', 'anael_mussared', 4, 13, 3, '$2y$10$...');
CALL upsert_utilisateur(119, 'Marie-hélène', 'Scarisbrick', 'pscarisbrick3a@ezinearticles.com', 2, '1980-07-24', 'marie_helene_scarisbrick', 3, 17, 3, '$2y$10$...');
CALL upsert_utilisateur(120, 'Stéphanie', 'Twiddy', 'jtwiddy3b@over-blog.com', 2, '2005-03-10', 'stephanie_twiddy', 3, 16, 2, '$2y$10$...');
CALL upsert_utilisateur(121, 'Tán', 'Nutkin', 'enutkin3c@oakley.com', 1, '1988-12-03', 'tan_nutkin', 3, 20, 2, '$2y$10$...');
CALL upsert_utilisateur(122, 'Börje', 'Casham', 'ecasham3d@theguardian.com', 1, '2013-01-31', 'borje_casham', 3, 18, 2, '$2y$10$...');
CALL upsert_utilisateur(123, 'Anaël', 'Larratt', 'dlarratt3e@live.com', 1, '2015-12-11', 'anael_larratt', 4, 19, 2, '$2y$10$...');
CALL upsert_utilisateur(124, 'Lóng', 'Dunridge', 'adunridge3f@homestead.com', 1, '1996-12-25', 'long_dunridge', 1, 17, 2, '$2y$10$...');
CALL upsert_utilisateur(125, 'Adélaïde', 'Izkovicz', 'aizkovicz3g@google.cn', 1, '2001-04-22', 'adelaide_izkovicz', 4, 20, 2, '$2y$10$...');
CALL upsert_utilisateur(126, 'Solène', 'Picken', 'kpicken3h@free.fr', 1, '1971-02-24', 'solene_picken', 4, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(127, 'Anaïs', 'Ladbrooke', 'nladbrooke3i@nydailynews.com', 1, '1981-01-05', 'anais_ladbrooke', 1, 18, 2, '$2y$10$...');
CALL upsert_utilisateur(128, 'Pénélope', 'Elloy', 'velloy3j@mediafire.com', 1, '1963-08-10', 'penelope_elloy', 3, 10, 2, '$2y$10$...');
CALL upsert_utilisateur(129, 'Sélène', 'Robroe', 'frobroe3k@bravesites.com', 1, '1967-04-04', 'selene_robroe', 3, 10, 2, '$2y$10$...');
CALL upsert_utilisateur(130, 'Mélys', 'Oris', 'boris3l@mozilla.com', 1, '2018-10-19', 'melys_oris', 4, 16, 2, '$2y$10$...');
CALL upsert_utilisateur(131, 'Stévina', 'Shearsby', 'gshearsby3m@biblegateway.com', 1, '2005-01-17', 'stevina_shearsby', 3, 16, 2, '$2y$10$...');
CALL upsert_utilisateur(132, 'Méthode', 'Durdle', 'ddurdle3n@myspace.com', 2, '1968-02-15', 'methode_durdle', 3, 2, 2, '$2y$10$...');
CALL upsert_utilisateur(133, 'Célestine', 'Vedenyapin', 'bvedenyapin3o@foxnews.com', 1, '2007-06-18', 'celestine_vedenyapin', 4, 7, 2, '$2y$10$...');
CALL upsert_utilisateur(134, 'Joséphine', 'Martelet', 'wmartelet3p@elegantthemes.com', 1, '2006-03-10', 'josephine_martelet', 3, 10, 2, '$2y$10$...');
CALL upsert_utilisateur(135, 'Vénus', 'Limerick', 'rlimerick3q@mapy.cz', 2, '1986-02-13', 'venus_limerick', 3, 17, 2, '$2y$10$...');
CALL upsert_utilisateur(136, 'Marie-ève', 'Mattersley', 'lmattersley3r@nps.gov', 1, '1975-04-26', 'marie_eve_mattersley', 3, 19, 2, '$2y$10$...');
CALL upsert_utilisateur(137, 'Estève', 'Mackriell', 'smackriell3s@constantcontact.com', 2, '1965-12-02', 'esteve_mackriell', 1, 10, 2, '$2y$10$...');
CALL upsert_utilisateur(138, 'Åsa', 'Ellph', 'kellph3t@theguardian.com', 2, '1977-05-26', 'asa_ellph', 4, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(139, 'Célia', 'Olford', 'molford3u@4shared.com', 2, '1961-05-13', 'celia_olford', 3, 7, 2, '$2y$10$...');
CALL upsert_utilisateur(140, 'Maëlann', 'Hugues', 'whugues3v@microsoft.com', 2, '1971-10-02', 'maelann_hugues', 4, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(141, 'Clémence', 'Coolahan', 'bcoolahan3w@google.com', 1, '2018-12-25', 'clemence_coolahan', 1, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(142, 'Laïla', 'Varfalameev', 'lvarfalameev3x@usa.gov', 2, '1961-06-20', 'laila_varfalameev', 1, 10, 2, '$2y$10$...');
CALL upsert_utilisateur(143, 'Agnès', 'Torrijos', 'dtorrijos3y@cmu.edu', 1, '1988-06-02', 'agnes_torrijos', 4, 15, 2, '$2y$10$...');
CALL upsert_utilisateur(144, 'Lyséa', 'McKirdy', 'fmckirdy3z@mac.com', 2, '2008-08-03', 'lysea_mckirdy', 3, 6, 2, '$2y$10$...');
CALL upsert_utilisateur(145, 'Maëlle', 'MacConchie', 'dmacconchie40@nbcnews.com', 1, '2000-07-08', 'maelle_macconchie', 3, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(146, 'Méghane', 'Kear', 'ckear41@shutterfly.com', 2, '2008-11-03', 'meghane_kear', 1, 14, 2, '$2y$10$...');
CALL upsert_utilisateur(147, 'Pò', 'Robjohns', 'crobjohns42@ebay.co.uk', 2, '1972-12-26', 'po_robjohns', 3, 7, 2, '$2y$10$...');
CALL upsert_utilisateur(148, 'Kù', 'Sharville', 'fsharville43@digg.com', 2, '2001-04-12', 'ku_sharville', 3, 16, 2, '$2y$10$...');
CALL upsert_utilisateur(149, 'Régine', 'Berkery', 'mberkery44@mashable.com', 1, '2018-11-29', 'regine_berkery', 1, 4, 2, '$2y$10$...');
CALL upsert_utilisateur(150, 'Daphnée', 'Hastilow', 'ghastilow45@zimbio.com', 1, '1980-03-10', 'daphnee_hastilow', 1, 13, 2, '$2y$10$...');
CALL upsert_utilisateur(151, 'Emmanuel', 'Snow', 'Emanuel.snow@gmail.com', 1, '1969-04-07', 'emanuel_snow', 5, 13, 2, '$2y$10$...');
CALL upsert_utilisateur(152, 'Robin', 'Rivière', 'Robin.riviere@gmail.com', 1, '1975-05-10', 'robin_riviere', 5, 13, 2, '$2y$10$...');
CALL upsert_utilisateur(153, 'Rachid', 'Belhoui', 'rachid.belhoui@gmail.com', 1, '1980-06-12', 'rachid_belhoui', 5, 13, 2, '$2y$10$...');
CALL upsert_utilisateur(154, 'Benoit', 'Houthoofd', 'houthoofd.benoit48@gmail.com', 1, '1993-08-12', 'benoit_houthoofd', 4, 13, 2, '$2y$10$...');


INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
SELECT last_name, first_name, email, grade_id, status_id
FROM utilisateurs
WHERE status_id = 5;


INSERT INTO paiements (utilisateur_id, montant, date_paiement, statut, abonnement_id, periode_debut, periode_fin) VALUES
(1, 300.00, '2025-01-01', 'validé', 3, '2025-01-01', '2025-12-31'),
(2, 300.00, '2025-01-01', 'validé', 3, '2025-01-01', '2025-12-31'),
(3, 300.00, '2025-01-01', 'validé', 3, '2025-01-01', '2025-12-31'),
(4, 300.00, '2025-01-01', 'validé', 3, '2025-01-01', '2025-12-31');


INSERT INTO commandes (utilisateur_id, statut) VALUES
(1, 'en attente'), (1, 'payée');

INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix) VALUES
(1, 1, 3, 1, 34.99),  -- Rashguard L
(1, 2, 2, 1, 29.99),  -- Short M
(2, 3, 3, 1, 89.99),  -- Kimono L
(2, 4, 3, 1, 14.99);  -- Ceinture L


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
CREATE TRIGGER maj_professeur_apres_update
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN
    IF OLD.status_id = 5 AND (NEW.status_id <> 5 OR OLD.email <> NEW.email) THEN
        DELETE FROM professeurs WHERE email = OLD.email;
    END IF;
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
        DELETE FROM professeurs WHERE email = OLD.email;
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
    TRUNCATE TABLE inscriptions;
    INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription)
    SELECT u.id, c.id, NOW()
    FROM utilisateurs u
    CROSS JOIN cours c;
    UPDATE inscriptions i
    JOIN (
        SELECT id, (0.5 + (grade_id * 0.02)) AS user_activity_level
        FROM utilisateurs
    ) u ON i.utilisateur_id = u.id
    SET i.status_id = IF(RAND() < u.user_activity_level, 1, NULL);
    SELECT 'Inscription et validation des présences terminées avec succès' AS message;
END//
DELIMITER ;




SET FOREIGN_KEY_CHECKS = 1;


CALL inscrire_utilisateurs_aleatoirement();


SELECT COUNT(*) AS total_inscriptions FROM inscriptions;
SELECT COUNT(*) AS total_presences_validees FROM inscriptions WHERE status_id = 1;
SELECT u.first_name, u.last_name, COUNT(i.id) AS total_presences_validees
FROM utilisateurs u
LEFT JOIN inscriptions i ON u.id = i.utilisateur_id AND i.status_id = 1
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_presences_validees DESC
LIMIT 10;
