-- Supprimer la procédure si elle existe déjà
DROP PROCEDURE IF EXISTS ajouter_cours_recurrent_avec_professeurs;

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