

-- 2. Créer la table des cours
CREATE TABLE cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_cours DATE NOT NULL,
    type_cours VARCHAR(50) NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL
);

CREATE TEMPORARY TABLE dates (
    date_cours DATE
);

INSERT INTO dates (date_cours)
SELECT DATE_ADD('2024-01-01', INTERVAL seq DAY)
FROM seq_0_to_729; -- Remplacer par une séquence de 730 jours pour couvrir 2 ans


INSERT INTO dates (date_cours)
SELECT DATE_ADD('2024-01-01', INTERVAL seq DAY)
FROM seq_0_to_729; -- Remplacer par une séquence de 730 jours pour couvrir 2 ans

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

