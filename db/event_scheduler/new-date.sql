DELIMITER //

CREATE EVENT IF NOT EXISTS create_cours_annuel
ON SCHEDULE
EVERY 1 YEAR
STARTS DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL (9 - MONTH(CURDATE())) MONTH), '%Y-09-01 00:00:00')  -- Prochain 1er septembre
DO
BEGIN
    -- 1. Définir la saison (2 ans à partir du 1er septembre de l'année en cours)
    SET @current_year = YEAR(CURDATE());
    SET @season_start = STR_TO_DATE(
      CONCAT(
        CASE WHEN MONTH(CURDATE()) < 9 THEN @current_year ELSE @current_year + 1 END,
        '-09-01'
      ), '%Y-%m-%d'
    );
    SET @season_end = DATE_ADD(@season_start, INTERVAL 365 DAY);  -- 2 ans

    -- 2. Créer la table temporaire pour les dates valides
    DROP TEMPORARY TABLE IF EXISTS dates_valides;
    CREATE TEMPORARY TABLE dates_valides (
        date_cours DATE,
        jour_semaine INT
    );

    -- 3. Générer les dates valides (lundi, jeudi, samedi, dimanche)
    INSERT INTO dates_valides (date_cours, jour_semaine)
    SELECT
      date_generated,
      DAYOFWEEK(date_generated)
    FROM (
        SELECT DATE_ADD(@season_start, INTERVAL seq DAY) AS date_generated
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
        WHERE DATE_ADD(@season_start, INTERVAL seq DAY) <= @season_end
    ) dates
    WHERE DAYOFWEEK(date_generated) IN (1, 2, 5, 7);  -- Dimanche=1, Lundi=2, Jeudi=5, Samedi=7

    -- 4. Insérer dans la table cours (en évitant les doublons)
    INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
    SELECT
        dv.date_cours,
        cr.type_cours,
        CASE
            WHEN dv.jour_semaine = 2 THEN '19:30:00'    -- Lundi
            WHEN dv.jour_semaine = 5 THEN '19:30:00'    -- Jeudi
            WHEN dv.jour_semaine = 7 THEN '12:00:00'    -- Samedi
            WHEN dv.jour_semaine = 1 THEN '14:15:00'    -- Dimanche
        END AS heure_debut,
        CASE
            WHEN dv.jour_semaine = 2 THEN '21:15:00'
            WHEN dv.jour_semaine = 5 THEN '21:15:00'
            WHEN dv.jour_semaine = 7 THEN '13:30:00'
            WHEN dv.jour_semaine = 1 THEN '16:00:00'
        END AS heure_fin,
        cr.id AS cours_recurrent_id
    FROM dates_valides dv
    JOIN cours_recurrent cr ON cr.jour_semaine = dv.jour_semaine
    LEFT JOIN cours c ON c.date_cours = dv.date_cours
    WHERE c.date_cours IS NULL;  -- Éviter les doublons

    -- 5. Nettoyage
    DROP TEMPORARY TABLE IF EXISTS dates_valides;
END //

DELIMITER ;

-- Activer le planificateur d'événements (si ce n'est pas déjà fait)
SET GLOBAL event_scheduler = ON;
