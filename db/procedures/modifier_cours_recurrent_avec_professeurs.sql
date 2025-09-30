DROP PROCEDURE IF EXISTS modifier_cours_recurrent_avec_professeurs;
DELIMITER //
CREATE PROCEDURE modifier_cours_recurrent_avec_professeurs(
    IN p_cours_recurrent_id INT,
    IN p_type_cours VARCHAR(50),
    IN p_jour_semaine VARCHAR(20),
    IN p_heure_debut TIME,
    IN p_heure_fin TIME,
    IN p_professeurs JSON
)
BEGIN
    DECLARE v_jour_semaine INT;
    DECLARE v_professeur_nom VARCHAR(255);
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_professeur_count INT;
    DECLARE v_professeur_id INT;
    DECLARE v_professeurs_associes INT DEFAULT 0;
    DECLARE v_existing_count INT;

    -- Gestionnaire d'erreur pour rollback automatique
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. Validation du jour
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

    -- 2. Vérification préalable de l'existence du cours
    SELECT COUNT(*) INTO v_existing_count
    FROM cours_recurrent
    WHERE id = p_cours_recurrent_id;

    IF v_existing_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cours récurrent non trouvé';
    END IF;

    -- 3. Création d'une table temporaire pour les professeurs (optimisation)
    DROP TEMPORARY TABLE IF EXISTS temp_professeurs;
    CREATE TEMPORARY TABLE temp_professeurs (
        idx INT AUTO_INCREMENT PRIMARY KEY,
        professeur_id INT NOT NULL,
        nom_complet VARCHAR(255) NOT NULL,
        UNIQUE KEY (professeur_id)
    );

    -- 4. Chargement des professeurs en une seule passe (optimisation majeure)
    SET v_professeur_count = JSON_LENGTH(p_professeurs);

    WHILE v_idx < v_professeur_count DO
        SET v_professeur_nom = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_professeurs, CONCAT('$[', v_idx, ']'))));
        SET v_professeur_id = NULL;

        -- Recherche EXACTE dans professeurs - ordre prenom nom (priorité)
        SELECT p.id INTO v_professeur_id
        FROM professeurs p
        WHERE CONCAT(TRIM(p.prenom), ' ', TRIM(p.nom)) = v_professeur_nom
        AND p.status_id = 5
        LIMIT 1;

        -- Si pas trouvé, recherche dans utilisateurs - ordre prenom nom
        IF v_professeur_id IS NULL THEN
            SELECT u.id INTO v_professeur_id
            FROM utilisateurs u
            WHERE CONCAT(TRIM(u.first_name), ' ', TRIM(u.last_name)) = v_professeur_nom
            AND u.status_id = 5
            LIMIT 1;
        END IF;

        -- N'ajouter que si le professeur existe vraiment
        IF v_professeur_id IS NOT NULL THEN
            INSERT IGNORE INTO temp_professeurs (professeur_id, nom_complet)
            VALUES (v_professeur_id, v_professeur_nom);
        END IF;

        SET v_idx = v_idx + 1;
    END WHILE;

    -- Vérification qu'au moins un professeur a été trouvé
    SELECT COUNT(*) INTO v_professeurs_associes FROM temp_professeurs;
    
    -- Permettre la modification même si aucun professeur n'est trouvé (cours sans professeur)
    -- IF v_professeurs_associes = 0 THEN
    --     DROP TEMPORARY TABLE IF EXISTS temp_professeurs;
    --     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Aucun professeur valide trouvé dans la liste fournie';
    -- END IF;

    -- 5. Transaction unique avec timeout optimisé
    SET SESSION innodb_lock_wait_timeout = 5;
    START TRANSACTION;

    -- Mise à jour du cours récurrent
    UPDATE cours_recurrent
    SET
        type_cours = p_type_cours,
        jour_semaine = v_jour_semaine,
        heure_debut = p_heure_debut,
        heure_fin = p_heure_fin
    WHERE id = p_cours_recurrent_id;

    -- Suppression de toutes les anciennes associations (même si aucun nouveau professeur)
    DELETE FROM cours_recurrent_professeur
    WHERE cours_recurrent_id = p_cours_recurrent_id;

    -- Association des nouveaux professeurs (seulement si des professeurs valides ont été trouvés)
    IF v_professeurs_associes > 0 THEN
        INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
        SELECT p_cours_recurrent_id, professeur_id
        FROM temp_professeurs
        WHERE professeur_id IS NOT NULL;
    END IF;

    -- Recompter les professeurs réellement associés
    SELECT COUNT(*) INTO v_professeurs_associes
    FROM temp_professeurs
    WHERE professeur_id IS NOT NULL;

    -- Nettoyage
    DROP TEMPORARY TABLE IF EXISTS temp_professeurs;

    -- Commit final
    COMMIT;
    SET SESSION innodb_lock_wait_timeout = 50;

    -- 6. Retour du résultat avec information détaillée
    SET @professeurs_non_trouves = v_professeur_count - v_professeurs_associes;
    
    SELECT
        p_cours_recurrent_id AS cours_recurrent_id,
        v_professeurs_associes AS professeurs_associes,
        @professeurs_non_trouves AS professeurs_non_trouves,
        CASE 
            WHEN v_professeurs_associes = 0 AND @professeurs_non_trouves > 0 THEN
                CONCAT('Attention: Cours modifié mais aucun professeur trouvé (', @professeurs_non_trouves, ' professeur(s) inexistant(s))')
            WHEN @professeurs_non_trouves > 0 THEN
                CONCAT('Succès partiel: ', v_professeurs_associes, ' professeur(s) associé(s), ', @professeurs_non_trouves, ' professeur(s) non trouvé(s)')
            ELSE
                CONCAT('Succès: ', v_professeurs_associes, ' professeur(s) associé(s)')
        END AS message;
END//
DELIMITER ;