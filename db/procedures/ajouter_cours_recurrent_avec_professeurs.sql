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
    -- Déclaration des variables
    DECLARE v_jour_semaine INT;
    DECLARE v_cours_recurrent_id INT;
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_days_until_target_day INT;
    DECLARE i INT DEFAULT 0;  -- Variable locale déclarée correctement
    DECLARE v_professeur_count INT;
    DECLARE v_professeur_nom VARCHAR(255);
    DECLARE v_professeur_id INT;

    -- Gestionnaire d'erreur pour rollback automatique
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

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

    -- 2. Calcul des dates (1 an comme demandé)
    SET v_days_until_target_day = (v_jour_semaine - (DAYOFWEEK(CURDATE()) - 1) + 7) % 7;
    IF v_days_until_target_day = 0 THEN SET v_days_until_target_day = 7; END IF;
    SET v_start_date = DATE_ADD(CURDATE(), INTERVAL v_days_until_target_day DAY);
    SET v_end_date = DATE_ADD(v_start_date, INTERVAL 1 YEAR);

    -- 3. Configuration pour éviter les timeouts
    SET SESSION innodb_lock_wait_timeout = 10;
    SET autocommit = 0;
    START TRANSACTION;

    -- 4. Insertion cours récurrent
    INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin)
    VALUES (p_type_cours, v_jour_semaine, p_heure_debut, p_heure_fin);
    SET v_cours_recurrent_id = LAST_INSERT_ID();

    -- 5. Génération OPTIMISÉE des cours avec batch insert
    SET @batch_size = 10;
    SET @current_date = v_start_date;

    batch_loop: LOOP
        -- Insert par batches de 10 pour éviter les gros locks
        SET @insert_values = '';
        SET @batch_count = 0;

        inner_loop: LOOP
            IF @batch_count > 0 THEN
                SET @insert_values = CONCAT(@insert_values, ',');
            END IF;

            SET @insert_values = CONCAT(@insert_values,
                '(', QUOTE(@current_date), ',',
                     QUOTE(p_type_cours), ',',
                     QUOTE(p_heure_debut), ',',
                     QUOTE(p_heure_fin), ',',
                     v_cours_recurrent_id, ')');

            SET @current_date = DATE_ADD(@current_date, INTERVAL 7 DAY);
            SET @batch_count = @batch_count + 1;

            IF @batch_count >= @batch_size OR @current_date > v_end_date THEN
                LEAVE inner_loop;
            END IF;
        END LOOP inner_loop;

        -- Exécuter le batch
        IF LENGTH(@insert_values) > 0 THEN
            SET @sql = CONCAT('INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id) VALUES ', @insert_values);
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;

        IF @current_date > v_end_date THEN
            LEAVE batch_loop;
        END IF;
    END LOOP batch_loop;

    -- 6. Association professeurs (avec mapping utilisateurs -> professeurs)
    SET v_professeur_count = JSON_LENGTH(p_professeurs);
    SET @professeurs_associes = 0;

    WHILE i < v_professeur_count DO
        SET v_professeur_nom = JSON_UNQUOTE(JSON_EXTRACT(p_professeurs, CONCAT('$[', i, ']')));
        SET v_professeur_id = NULL;

        -- 1. Recherche directe dans professeurs - ordre prenom nom
        SELECT id INTO v_professeur_id
        FROM professeurs
        WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) = TRIM(v_professeur_nom)
        AND status_id = 5
        LIMIT 1;

        -- 2. Si pas trouvé, recherche dans utilisateurs et mapping vers professeurs
        IF v_professeur_id IS NULL THEN
            SELECT p.id INTO v_professeur_id
            FROM utilisateurs u
            JOIN professeurs p ON (
                TRIM(u.first_name) = TRIM(p.prenom) AND TRIM(u.last_name) = TRIM(p.nom)
            )
            WHERE CONCAT(TRIM(u.first_name), ' ', TRIM(u.last_name)) = TRIM(v_professeur_nom)
            AND u.status_id = 5 AND p.status_id = 5
            LIMIT 1;
        END IF;

        -- 3. Recherche par ordre inverse - nom prenom
        IF v_professeur_id IS NULL THEN
            SELECT id INTO v_professeur_id
            FROM professeurs
            WHERE CONCAT(TRIM(nom), ' ', TRIM(prenom)) = TRIM(v_professeur_nom)
            AND status_id = 5
            LIMIT 1;
        END IF;

        -- Insérer seulement si le professeur existe
        IF v_professeur_id IS NOT NULL THEN
            INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
            VALUES (v_cours_recurrent_id, v_professeur_id);
            SET @professeurs_associes = @professeurs_associes + 1;
        END IF;

        SET i = i + 1;
    END WHILE;

    -- 7. Commit final
    COMMIT;
    SET autocommit = 1;
    SET SESSION innodb_lock_wait_timeout = 50;

    -- Retour du résultat avec information sur les professeurs non trouvés
    SET @professeurs_non_trouves = v_professeur_count - @professeurs_associes;
    
    SELECT
        v_cours_recurrent_id AS cours_recurrent_id,
        @professeurs_associes AS professeurs_associes,
        @professeurs_non_trouves AS professeurs_non_trouves,
        CASE 
            WHEN @professeurs_associes = 0 AND @professeurs_non_trouves > 0 THEN
                CONCAT('Attention: Cours créé mais aucun professeur trouvé (', @professeurs_non_trouves, ' professeur(s) inexistant(s))')
            WHEN @professeurs_non_trouves > 0 THEN
                CONCAT('Succès partiel: ', @professeurs_associes, ' professeur(s) associé(s), ', @professeurs_non_trouves, ' professeur(s) non trouvé(s)')
            ELSE
                CONCAT('Succès: ', @professeurs_associes, ' professeur(s) associé(s)')
        END AS message;
END//
DELIMITER ;