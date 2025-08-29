-- Créer la base de données
CREATE DATABASE octopus_jjb;

-- Utiliser la base de données
USE octopus_jjb;

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL,
    description TEXT
);


-- Créer la table des genres
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  genre_name VARCHAR(50) NOT NULL
);


-- Créer la table des plans tarifaires
CREATE TABLE plans_tarifaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_plan VARCHAR(50) NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    periode VARCHAR(20) NOT NULL,
    description TEXT
);

-- Créer la table des grade_ids
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id VARCHAR(100) NOT NULL
);


-- Créer la table des utilisateurs
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,  -- Unicité de l'email
    genre_id INT,  -- Clé étrangère pour le genre
    date_of_birth DATE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Spécification de la taille du champ pour le mot de passe
    status_id INT DEFAULT 1,  -- Clé étrangère pour le statut
    grade_id INT DEFAULT 1,  -- Référence à l'ID de la table `grades`
    abonnement_id INT,  -- Clé étrangère pour le tarif (plan)
    
    -- Ajout des clés étrangères
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),  -- Référence correcte à `grades`
    FOREIGN KEY (status_id) REFERENCES status(id)  -- Clé étrangère vers la table `status`
);




-- Créer la table des cours
CREATE TABLE cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_cours DATE NOT NULL,
    type_cours VARCHAR(50) NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL
);

-- Créer la table des inscriptions avec ON DELETE CASCADE
CREATE TABLE inscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,  -- Clé étrangère vers la table utilisateurs
    cours_id INT,        -- Clé étrangère vers la table cours
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_id BOOLEAN DEFAULT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id)
);




-- Créer une table temporaire pour les dates
CREATE TEMPORARY TABLE dates (
    date_cours DATE
);

-- Insérer des dates dans la table temporaire (remplacer seq_0_to_729 par la bonne séquence)
INSERT INTO dates (date_cours)
SELECT DATE_ADD('2024-01-01', INTERVAL seq DAY)
FROM seq_0_to_729; -- Assurez-vous d'avoir une séquence pour 730 jours

-- Insérer les cours basés sur les dates
INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin)
SELECT 
    date_cours,
    CASE 
        WHEN DAYOFWEEK(date_cours) = 2 THEN 'JJB'         -- Lundi (2)
        WHEN DAYOFWEEK(date_cours) = 5 THEN 'JJB'         -- Jeudi (5)
        WHEN DAYOFWEEK(date_cours) = 7 THEN 'Grappling'   -- Samedi (7)
        WHEN DAYOFWEEK(date_cours) = 1 THEN 'Grappling'   -- Dimanche (1)
    END AS type_cours,
    CASE 
        WHEN DAYOFWEEK(date_cours) = 2 THEN '19:30:00'    -- Lundi
        WHEN DAYOFWEEK(date_cours) = 5 THEN '19:30:00'    -- Jeudi
        WHEN DAYOFWEEK(date_cours) = 7 THEN '12:00:00'    -- Samedi
        WHEN DAYOFWEEK(date_cours) = 1 THEN '14:15:00'    -- Dimanche
    END AS heure_debut,
    CASE 
        WHEN DAYOFWEEK(date_cours) = 2 THEN '21:15:00'    -- Lundi
        WHEN DAYOFWEEK(date_cours) = 5 THEN '21:15:00'    -- Jeudi
        WHEN DAYOFWEEK(date_cours) = 7 THEN '13:30:00'    -- Samedi
        WHEN DAYOFWEEK(date_cours) = 1 THEN '16:00:00'    -- Dimanche
    END AS heure_fin
FROM dates
WHERE DAYOFWEEK(date_cours) IN (1, 2, 5, 7);

-- Créer la table des réservations avec ON DELETE CASCADE
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT,
    cours_id INT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    UNIQUE (utilisateur_id, cours_id) -- pour éviter les réservations en double pour le même utilisateur et le même cours
);

-- Insérer les deux genres
INSERT INTO genres (genre_name) VALUES ('Masculin'), ('Féminin');

-- Insérer les rôles
INSERT INTO status (nom_role, description)
VALUES
    ('visiteur', "s'est rendu à un cours d'essai, pas encore inscrit dans le système"),
    ('utilisateur', "membre de l'équipe sportive"),
    ('administrateur', "En plus d'être un membre, l'administrateur a quelques droits supplémentaires par rapport au simple utilisateur, ce sont souvent des professeurs"),
    ('super-administrateur', "Le seul et unique, a tous les droits");


-- Insérer les trois plans tarifaires
INSERT INTO plans_tarifaires (nom_plan, prix, periode, description) VALUES
    ('Paiement mensuel', 25.00, 'mois', 'Abonnement de 25 EUR par mois'),
    ('Paiement trimestriel', 100.00, 'trimestre', 'Abonnement de 100 EUR tous les 3 mois'),
    ('Paiement annuel', 300.00, 'an', 'Abonnement de 300 EUR pour une année complète');


-- Insérer les différents grade_ids
INSERT INTO grades (grade_id) VALUES 
('ceinture blanche'),
('ceinture blanche une barette'),
('ceinture blanche deux barettes'),
('ceinture blanche trois barettes'),
('ceinture blanche quatre barettes'),
('ceinture bleue'),
('ceinture bleue une barette'),
('ceinture bleue deux barettes'),
('ceinture bleue trois barettes'),
('ceinture bleue quatre barettes'),
('ceinture violette'),
('ceinture violette une barette'),
('ceinture violette deux barettes'),
('ceinture violette trois barettes'),
('ceinture violette quatre barettes'),
('ceinture marron'),
('ceinture marron une barette'),
('ceinture marron deux barettes'),
('ceinture marron trois barettes'),
('ceinture marron quatre barettes'),
('ceinture noire'),
('ceinture noire une barette'),
('ceinture noire deux barettes'),
('ceinture noire trois barettes'),
('ceinture noire quatre barettes'),
('ceinture noire cinq barettes (ceinture noire avec bande rouge)'),
('ceinture noire six barettes (ceinture noire avec bande rouge)'),
('ceinture noire sept barettes (ceinture rouge et noire)'),
('ceinture noire huit barettes (ceinture rouge et noire)'),
('ceinture noire neuf barettes (ceinture rouge)'),
('ceinture noire dix barettes (ceinture rouge)');


insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (1, 'Cinéma', 'Burkinshaw', 'sburkinshaw0@reference.com', 1, '2002-08-09', 3, 10, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (2, 'Thérèsa', 'Farrall', 'hfarrall1@youku.com', 1, '1992-12-03', 1, 4, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (3, 'Mélanie', 'Paolacci', 'opaolacci2@indiegogo.com', 1, '1995-09-26', 4, 13, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (4, 'Jú', 'Farguhar', 'mfarguhar3@biblegateway.com', 1, '1967-06-06', 3, 1, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (5, 'Mélina', 'Dyter', 'cdyter4@last.fm', 1, '1970-08-20', 3, 10, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (6, 'Andrée', 'Scripture', 'jscripture5@slashdot.org', 1, '1997-12-18', 4, 4, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (7, 'Estée', 'Velte', 'mvelte6@soundcloud.com', 2, '1981-07-03', 3, 4, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (8, 'Rachèle', 'Hame', 'jhame7@businesswire.com', 1, '1986-06-23', 4, 18, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (9, 'Maïlis', 'Bracer', 'tbracer8@cloudflare.com', 2, '2011-09-13', 3, 14, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (10, 'Cécilia', 'Ick', 'dick9@jigsy.com', 2, '1972-07-13', 4, 8, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (11, 'Pò', 'Venart', 'evenarta@nhs.uk', 2, '2003-06-04', 3, 14, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (12, 'Dafnée', 'Woolston', 'mwoolstonb@skype.com', 2, '1993-03-24', 4, 8, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (13, 'Danièle', 'Edler', 'nedlerc@newyorker.com', 2, '1965-01-05', 4, 10, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (14, 'Mélina', 'Bourton', 'lbourtond@miibeian.gov.cn', 2, '1983-06-26', 1, 5, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (15, 'Camélia', 'Stripling', 'jstriplinge@java.com', 1, '2000-03-12', 4, 1, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (16, 'Irène', 'Castanaga', 'icastanagaf@google.com.br', 2, '2023-08-15', 3, 6, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (17, 'Léone', 'Cranstone', 'ecranstoneg@google.it', 2, '1988-12-28', 1, 10, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (18, 'Maëly', 'Trayton', 'jtraytonh@barnesandnoble.com', 2, '2008-06-12', 4, 20, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (19, 'Néhémie', 'Gronav', 'sgronavi@whitehouse.gov', 1, '2007-06-15', 1, 4, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (20, 'Kuí', 'O''Garmen', 'sogarmenj@posterous.com', 2, '1998-03-16', 3, 3, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (21, 'Mårten', 'Haspineall', 'ahaspineallk@cdbaby.com', 1, '2005-11-09', 3, 16, 1);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (22, 'Gaïa', 'Egarr', 'pegarrl@toplist.cz', 2, '1980-02-11', 3, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (23, 'Angèle', 'Tickle', 'dticklem@washington.edu', 1, '1983-09-10', 1, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (24, 'Maëline', 'MacKowle', 'omackowlen@zimbio.com', 1, '1962-01-06', 1, 4, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (25, 'Märta', 'Porch', 'cporcho@qq.com', 1, '1986-07-29', 1, 13, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (26, 'Léana', 'Bessett', 'sbessettp@economist.com', 1, '2013-06-23', 1, 18, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (27, 'Eugénie', 'Petrello', 'lpetrelloq@reuters.com', 2, '1964-01-24', 3, 17, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (28, 'Loïs', 'Caneo', 'jcaneor@harvard.edu', 1, '1965-01-02', 3, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (29, 'Bécassine', 'Odhams', 'nodhamss@is.gd', 1, '2007-02-27', 4, 14, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (30, 'Bérénice', 'Gateman', 'jgatemant@hhs.gov', 2, '1991-03-01', 4, 6, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (31, 'Cléa', 'Caverhill', 'bcaverhillu@mayoclinic.com', 2, '2002-02-08', 1, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (32, 'Styrbjörn', 'Foucar', 'afoucarv@nps.gov', 1, '1997-12-29', 1, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (33, 'Océane', 'Aleksashin', 'baleksashinw@chron.com', 2, '1996-03-02', 3, 16, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (34, 'Maéna', 'Brownlee', 'ebrownleex@scribd.com', 2, '1964-07-29', 4, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (35, 'Danièle', 'Hunnam', 'nhunnamy@theguardian.com', 1, '2006-12-19', 3, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (36, 'Yáo', 'Mee', 'dmeez@bravesites.com', 2, '1963-05-17', 3, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (37, 'Garçon', 'Liddiatt', 'aliddiatt10@typepad.com', 1, '1985-08-14', 3, 1, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (38, 'Illustrée', 'Farfull', 'efarfull11@1688.com', 1, '2000-01-24', 1, 20, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (39, 'Michèle', 'Capon', 'hcapon12@yale.edu', 1, '2005-01-18', 1, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (40, 'Régine', 'Goulder', 'lgoulder13@twitpic.com', 2, '2008-04-02', 1, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (41, 'Josée', 'Lightbody', 'alightbody14@mac.com', 2, '1987-03-30', 4, 17, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (42, 'Aimée', 'Rudman', 'trudman15@sina.com.cn', 2, '2008-10-31', 3, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (43, 'Renée', 'Gregg', 'bgregg16@yellowbook.com', 2, '2017-08-13', 3, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (44, 'Marie-josée', 'Stanners', 'cstanners17@feedburner.com', 2, '1993-05-11', 1, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (45, 'Illustrée', 'Strafford', 'dstrafford18@parallels.com', 2, '2002-06-03', 3, 20, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (46, 'Léonore', 'Elcox', 'relcox19@vkontakte.ru', 1, '2022-06-02', 3, 13, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (47, 'Maëly', 'Carrivick', 'scarrivick1a@gov.uk', 2, '1994-01-29', 3, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (48, 'Geneviève', 'McFayden', 'nmcfayden1b@aol.com', 1, '1966-05-14', 3, 4, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (49, 'Nadège', 'Renowden', 'crenowden1c@furl.net', 2, '1991-12-08', 4, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (50, 'Yè', 'Brunker', 'mbrunker1d@bluehost.com', 1, '2018-06-26', 3, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (51, 'Thérèsa', 'Kindleysides', 'rkindleysides1e@foxnews.com', 2, '1981-09-10', 1, 8, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (52, 'Lèi', 'Willimont', 'wwillimont1f@army.mil', 2, '2004-03-01', 3, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (53, 'Clélia', 'Darwent', 'zdarwent1g@multiply.com', 2, '2001-10-01', 4, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (54, 'Rachèle', 'Bradmore', 'dbradmore1h@rakuten.co.jp', 1, '2011-12-25', 1, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (55, 'Dà', 'Huburn', 'mhuburn1i@intel.com', 2, '1961-03-13', 1, 10, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (56, 'Clélia', 'Hargreave', 'jhargreave1j@macromedia.com', 1, '1989-12-28', 3, 7, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (57, 'Céline', 'Dring', 'bdring1k@csmonitor.com', 1, '1980-07-29', 3, 12, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (58, 'Görel', 'Seine', 'fseine1l@abc.net.au', 2, '1993-11-02', 4, 20, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (59, 'Loïs', 'Kettle', 'lkettle1m@reuters.com', 1, '1981-07-08', 4, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (60, 'Félicie', 'MacCulloch', 'cmacculloch1n@jigsy.com', 2, '1995-11-28', 4, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (61, 'Ruì', 'Corrie', 'scorrie1o@cmu.edu', 1, '1986-02-09', 3, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (62, 'Bérénice', 'Dumpleton', 'tdumpleton1p@myspace.com', 2, '1963-09-24', 3, 16, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (63, 'Marylène', 'Ledster', 'gledster1q@prnewswire.com', 1, '1990-03-18', 3, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (64, 'Kuí', 'Fitzsimons', 'afitzsimons1r@ebay.co.uk', 1, '1989-11-01', 1, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (65, 'Dà', 'Kalf', 'nkalf1s@businessinsider.com', 1, '1976-12-16', 1, 14, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (66, 'Bécassine', 'Ferreli', 'iferreli1t@youku.com', 2, '1984-04-11', 3, 18, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (67, 'Marie-josée', 'Northedge', 'knorthedge1u@baidu.com', 1, '1965-07-31', 1, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (68, 'Méghane', 'Martinez', 'fmartinez1v@feedburner.com', 2, '1973-05-30', 4, 14, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (69, 'Adèle', 'Spandley', 'ispandley1w@addthis.com', 1, '1970-07-19', 3, 6, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (70, 'Håkan', 'Stapylton', 'dstapylton1x@about.com', 1, '2011-02-03', 4, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (71, 'Gaétane', 'Elleyne', 'selleyne1y@symantec.com', 1, '1992-04-29', 3, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (72, 'Angélique', 'Newborn', 'anewborn1z@economist.com', 1, '1984-11-02', 4, 16, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (73, 'Salomé', 'Aldritt', 'caldritt20@live.com', 1, '1969-07-19', 4, 17, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (74, 'Mélinda', 'Sewards', 'asewards21@google.co.uk', 1, '1967-04-24', 1, 16, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (75, 'Måns', 'covino', 'gcovino22@cisco.com', 2, '1979-09-09', 4, 5, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (76, 'Mårten', 'Blemen', 'cblemen23@bravesites.com', 1, '1988-05-30', 1, 10, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (77, 'Anaël', 'Crabtree', 'mcrabtree24@jugem.jp', 2, '1967-09-25', 4, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (78, 'Yóu', 'Kenna', 'hkenna25@europa.eu', 2, '1989-02-23', 3, 13, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (79, 'Laurène', 'Hanmore', 'jhanmore26@omniture.com', 2, '2009-05-02', 3, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (80, 'Lén', 'Whorlow', 'cwhorlow27@gov.uk', 2, '2014-08-28', 4, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (81, 'Irène', 'Trapp', 'ytrapp28@addthis.com', 2, '2004-11-29', 1, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (82, 'Marie-thérèse', 'Freshwater', 'efreshwater29@constantcontact.com', 2, '1985-04-09', 1, 11, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (83, 'Ophélie', 'Gulk', 'ygulk2a@ucoz.ru', 1, '2023-02-12', 4, 10, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (84, 'Andréanne', 'Kynston', 'akynston2b@ebay.co.uk', 1, '1981-08-30', 1, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (85, 'Ráo', 'McConnal', 'emcconnal2c@ifeng.com', 2, '1970-02-22', 1, 10, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (86, 'Faîtes', 'Parkins', 'rparkins2d@studiopress.com', 2, '1980-06-15', 4, 2, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (87, 'Östen', 'Rooms', 'mrooms2e@nhs.uk', 1, '1979-09-17', 1, 14, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (88, 'Angélique', 'Mosedill', 'kmosedill2f@domainmarket.com', 2, '2011-08-27', 4, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (89, 'Noëlla', 'Baldery', 'vbaldery2g@whitehouse.gov', 2, '1970-06-17', 3, 7, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (90, 'Adélaïde', 'Beagan', 'mbeagan2h@examiner.com', 1, '1987-12-08', 4, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (91, 'Intéressant', 'Kowalik', 'dkowalik2i@163.com', 2, '2011-03-10', 3, 3, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (92, 'Fèi', 'Burleton', 'rburleton2j@wunderground.com', 2, '1989-07-17', 4, 18, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (93, 'Sélène', 'Cauderlie', 'scauderlie2k@google.es', 2, '2012-10-15', 3, 11, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (94, 'Göran', 'Leason', 'dleason2l@feedburner.com', 1, '2019-12-15', 1, 5, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (95, 'Agnès', 'Widger', 'twidger2m@mtv.com', 1, '1997-12-16', 1, 16, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (96, 'Aimée', 'Clawson', 'aclawson2n@hugedomains.com', 1, '2009-05-21', 4, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (97, 'Françoise', 'Andreasson', 'candreasson2o@shutterfly.com', 2, '1990-02-02', 3, 6, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (98, 'Lén', 'Comoletti', 'jcomoletti2p@domainmarket.com', 2, '1976-01-02', 4, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (99, 'Björn', 'Eshelby', 'ceshelby2q@alibaba.com', 1, '2012-01-21', 3, 12, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (100, 'Amélie', 'Milam', 'gmilam2r@yandex.ru', 1, '1984-04-19', 1, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (101, 'Åsa', 'Slainey', 'hslainey2s@quantcast.com', 2, '1990-02-15', 4, 11, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (102, 'Valérie', 'Ortiger', 'mortiger2t@spiegel.de', 1, '2002-02-16', 3, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (103, 'Dorothée', 'Weippert', 'eweippert2u@typepad.com', 2, '2010-09-03', 4, 9, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (104, 'Yè', 'Lambin', 'hlambin2v@ucoz.ru', 1, '1961-10-21', 4, 7, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (105, 'Nadège', 'Richardin', 'wrichardin2w@gizmodo.com', 2, '1961-03-01', 3, 20, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (106, 'Maïly', 'Narramore', 'jnarramore2x@jimdo.com', 2, '2016-04-30', 3, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (107, 'Stévina', 'Pregal', 'spregal2y@oaic.gov.au', 2, '1998-11-03', 4, 1, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (108, 'Zoé', 'Forkan', 'aforkan2z@acquirethisname.com', 2, '1961-10-08', 3, 19, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (109, 'Maïlys', 'Searle', 'bsearle30@purevolume.com', 2, '2013-06-15', 1, 5, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (110, 'Régine', 'Crampin', 'acrampin31@1688.com', 1, '2011-10-21', 4, 18, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (111, 'Lucrèce', 'Phelipeaux', 'fphelipeaux32@histats.com', 2, '2023-10-04', 1, 14, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (112, 'Médiamass', 'Larmour', 'jlarmour33@t.co', 2, '1961-07-01', 3, 15, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (113, 'Maïly', 'Thunders', 'dthunders34@yahoo.com', 2, '1991-05-03', 3, 12, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (114, 'Esbjörn', 'Kedwell', 'bkedwell35@cornell.edu', 2, '1991-12-04', 4, 6, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (115, 'Pénélope', 'Copeman', 'rcopeman36@sphinn.com', 1, '1976-05-11', 3, 20, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (116, 'Dà', 'Gregoli', 'mgregoli37@t.co', 2, '2022-10-29', 1, 13, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (117, 'Aurélie', 'McKnockiter', 'gmcknockiter38@miitbeian.gov.cn', 2, '1993-07-22', 1, 21, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (118, 'Anaël', 'Mussared', 'imussared39@photobucket.com', 2, '2001-09-17', 4, 13, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (119, 'Marie-hélène', 'Scarisbrick', 'pscarisbrick3a@ezinearticles.com', 2, '1980-07-24', 3, 17, 3);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (120, 'Stéphanie', 'Twiddy', 'jtwiddy3b@over-blog.com', 2, '2005-03-10', 3, 16, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (121, 'Tán', 'Nutkin', 'enutkin3c@oakley.com', 1, '1988-12-03', 3, 20, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (122, 'Börje', 'Casham', 'ecasham3d@theguardian.com', 1, '2013-01-31', 3, 18, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (123, 'Anaël', 'Larratt', 'dlarratt3e@live.com', 1, '2015-12-11', 4, 19, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (124, 'Lóng', 'Dunridge', 'adunridge3f@homestead.com', 1, '1996-12-25', 1, 17, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (125, 'Adélaïde', 'Izkovicz', 'aizkovicz3g@google.cn', 1, '2001-04-22', 4, 20, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (126, 'Solène', 'Picken', 'kpicken3h@free.fr', 1, '1971-02-24', 4, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (127, 'Anaïs', 'Ladbrooke', 'nladbrooke3i@nydailynews.com', 1, '1981-01-05', 1, 18, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (128, 'Pénélope', 'Elloy', 'velloy3j@mediafire.com', 1, '1963-08-10', 3, 10, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (129, 'Sélène', 'Robroe', 'frobroe3k@bravesites.com', 1, '1967-04-04', 3, 10, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (130, 'Mélys', 'Oris', 'boris3l@mozilla.com', 1, '2018-10-19', 4, 16, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (131, 'Stévina', 'Shearsby', 'gshearsby3m@biblegateway.com', 1, '2005-01-17', 3, 16, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (132, 'Méthode', 'Durdle', 'ddurdle3n@myspace.com', 2, '1968-02-15', 3, 2, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (133, 'Célestine', 'Vedenyapin', 'bvedenyapin3o@foxnews.com', 1, '2007-06-18', 4, 7, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (134, 'Joséphine', 'Martelet', 'wmartelet3p@elegantthemes.com', 1, '2006-03-10', 3, 10, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (135, 'Vénus', 'Limerick', 'rlimerick3q@mapy.cz', 2, '1986-02-13', 3, 17, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (136, 'Marie-ève', 'Mattersley', 'lmattersley3r@nps.gov', 1, '1975-04-26', 3, 19, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (137, 'Estève', 'Mackriell', 'smackriell3s@constantcontact.com', 2, '1965-12-02', 1, 10, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (138, 'Åsa', 'Ellph', 'kellph3t@theguardian.com', 2, '1977-05-26', 4, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (139, 'Célia', 'Olford', 'molford3u@4shared.com', 2, '1961-05-13', 3, 7, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (140, 'Maëlann', 'Hugues', 'whugues3v@microsoft.com', 2, '1971-10-02', 4, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (141, 'Clémence', 'Coolahan', 'bcoolahan3w@google.com', 1, '2018-12-25', 1, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (142, 'Laïla', 'Varfalameev', 'lvarfalameev3x@usa.gov', 2, '1961-06-20', 1, 10, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (143, 'Agnès', 'Torrijos', 'dtorrijos3y@cmu.edu', 1, '1988-06-02', 4, 15, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (144, 'Lyséa', 'McKirdy', 'fmckirdy3z@mac.com', 2, '2008-08-03', 3, 6, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (145, 'Maëlle', 'MacConchie', 'dmacconchie40@nbcnews.com', 1, '2000-07-08', 3, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (146, 'Méghane', 'Kear', 'ckear41@shutterfly.com', 2, '2008-11-03', 1, 14, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (147, 'Pò', 'Robjohns', 'crobjohns42@ebay.co.uk', 2, '1972-12-26', 3, 7, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (148, 'Kù', 'Sharville', 'fsharville43@digg.com', 2, '2001-04-12', 3, 16, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (149, 'Régine', 'Berkery', 'mberkery44@mashable.com', 1, '2018-11-29', 1, 4, 2);
insert into utilisateurs (id, first_name, last_name, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id) values (150, 'Daphnée', 'Hastilow', 'ghastilow45@zimbio.com', 1, '1980-03-10', 1, 13, 2);

