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
    DECLARE v_professeur_id INT;
    DECLARE v_professeur_nom VARCHAR(255);
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_days_until_target_day INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE i INT DEFAULT 0;
    DECLARE v_professeur_count INT;

    -- Mappage des jours de la semaine
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

    -- Validation du jour de la semaine
    IF v_jour_semaine IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jour de la semaine invalide';
    END IF;

    -- Calcul des dates de début et de fin
    SET v_start_date = CURDATE();
    -- Conversion: MySQL DAYOFWEEK() (1=Dim, 2=Lun...) vers notre système (1=Lun, 2=Mar...)
    SET v_days_until_target_day = (v_jour_semaine - (DAYOFWEEK(CURDATE()) - 1) + 7) % 7;
    -- Si c'est aujourd'hui, prendre la semaine suivante
    IF v_days_until_target_day = 0 THEN
        SET v_days_until_target_day = 7;
    END IF;
    SET v_start_date = DATE_ADD(v_start_date, INTERVAL v_days_until_target_day DAY);
    SET v_end_date = DATE_ADD(v_start_date, INTERVAL 1 YEAR);

    -- Début de la transaction
    START TRANSACTION;

    -- Insertion du cours récurrent
    INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin)
    VALUES (p_type_cours, v_jour_semaine, p_heure_debut, p_heure_fin);
    SET v_cours_recurrent_id = LAST_INSERT_ID();

    -- Génération des cours
    INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
    SELECT
        DATE_ADD(v_start_date, INTERVAL (7 * n) DAY) AS date_cours,
        p_type_cours,
        p_heure_debut,
        p_heure_fin,
        v_cours_recurrent_id
    FROM (
        SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
        UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13
        UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
        UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27
        UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34
        UNION SELECT 35 UNION SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION SELECT 41
        UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION SELECT 46 UNION SELECT 47 UNION SELECT 48
        UNION SELECT 49 UNION SELECT 50 UNION SELECT 51 UNION SELECT 52
    ) t
    WHERE DATE_ADD(v_start_date, INTERVAL (7 * n) DAY) BETWEEN v_start_date AND v_end_date;

    -- Association des professeurs
    SET v_professeur_count = JSON_LENGTH(p_professeurs);

    WHILE i < v_professeur_count DO
        SET v_professeur_nom = JSON_UNQUOTE(JSON_EXTRACT(p_professeurs, CONCAT('$[', i, ']')));

        -- Recherche de l'ID du professeur en utilisant le nom complet (prénom + nom)
        SELECT id INTO v_professeur_id
        FROM professeurs
        WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) = TRIM(v_professeur_nom)
        AND status_id = 5  -- Seulement les professeurs actifs
        LIMIT 1;

        -- Si un professeur est trouvé, on l'associe au cours récurrent
        IF v_professeur_id IS NOT NULL THEN
            INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
            VALUES (v_cours_recurrent_id, v_professeur_id);
        END IF;

        SET i = i + 1;
    END WHILE;

    -- Validation de la transaction
    COMMIT;

    SELECT
        v_cours_recurrent_id AS cours_recurrent_id,
        'Cours récurrent + cours générés + professeurs associés avec succès' AS message;
END //

DELIMITER ;
