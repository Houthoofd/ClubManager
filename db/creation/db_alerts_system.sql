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

-- Insertion des types d'alertes
INSERT INTO alertes_types (code, nom, description, priorite) VALUES
('COMPTE_INCOMPLET', 'Profil incomplet', 'Informations manquantes dans le profil utilisateur', 'normale'),
('MOT_PASSE_FAIBLE', 'Mot de passe non sécurisé', 'Mot de passe par défaut ou trop faible', 'haute'),
('PAIEMENT_RETARD', 'Paiement en retard', 'Échéance de paiement dépassée', 'haute'),
('PAIEMENT_CRITIQUE', 'Paiement très en retard', 'Plus de 30 jours de retard', 'critique'),
('ABSENCE_PROLONGEE', 'Absence prolongée', 'Aucune présence depuis plus de 30 jours', 'normale'),
('SANS_ABONNEMENT', 'Pas d\'abonnement', 'Utilisateur sans plan tarifaire', 'haute'),
('INFORMATIONS_OBSOLETES', 'Informations obsolètes', 'Profil non mis à jour depuis longtemps', 'basse'),
('GRADE_INCOHERENT', 'Grade incohérent', 'Grade ne correspond pas à l\'ancienneté', 'normale');

DELIMITER //

-- Procédure pour détecter et créer les alertes
CREATE PROCEDURE detecter_alertes_utilisateurs()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id INT;
    DECLARE v_alerte_type_id INT;
    DECLARE v_donnees JSON;
    
    -- Cursor pour parcourir les utilisateurs
    DECLARE user_cursor CURSOR FOR 
        SELECT id FROM utilisateurs WHERE status_id IN (1, 2, 3, 4, 5); -- Exclure les visiteurs
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Nettoyer les anciennes alertes résolues automatiquement
    DELETE FROM alertes_utilisateurs 
    WHERE statut = 'active' 
    AND date_detection < DATE_SUB(NOW(), INTERVAL 1 DAY);
    
    OPEN user_cursor;
    
    user_loop: LOOP
        FETCH user_cursor INTO v_user_id;
        IF done THEN LEAVE user_loop; END IF;
        
        -- 1. Vérifier profil incomplet
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'COMPTE_INCOMPLET';
        SELECT JSON_OBJECT(
            'champs_manquants', 
            JSON_ARRAY(
                CASE WHEN u.email = '' OR u.email IS NULL THEN 'email' END,
                CASE WHEN u.date_of_birth IS NULL THEN 'date_naissance' END,
                CASE WHEN u.genre_id IS NULL THEN 'genre' END,
                CASE WHEN u.abonnement_id IS NULL THEN 'abonnement' END
            )
        ) INTO v_donnees
        FROM utilisateurs u WHERE u.id = v_user_id;
        
        IF JSON_LENGTH(JSON_EXTRACT(v_donnees, '$.champs_manquants')) > 0 THEN
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
        -- 2. Vérifier mot de passe faible (mot de passe par défaut)
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'MOT_PASSE_FAIBLE';
        IF EXISTS (
            SELECT 1 FROM utilisateurs 
            WHERE id = v_user_id 
            AND (password = '$2y$10$...' OR password = '' OR password IS NULL)
        ) THEN
            SET v_donnees = JSON_OBJECT('raison', 'Mot de passe par défaut');
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
        -- 3. Vérifier paiements en retard
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'PAIEMENT_RETARD';
        IF EXISTS (
            SELECT 1 FROM echeances_paiements 
            WHERE utilisateur_id = v_user_id 
            AND statut = 'en attente' 
            AND date_echeance < CURDATE()
            AND date_echeance >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) THEN
            SELECT JSON_OBJECT(
                'echeances_retard', 
                (SELECT COUNT(*) FROM echeances_paiements 
                 WHERE utilisateur_id = v_user_id AND statut = 'en attente' AND date_echeance < CURDATE()),
                'montant_total',
                (SELECT SUM(montant) FROM echeances_paiements 
                 WHERE utilisateur_id = v_user_id AND statut = 'en attente' AND date_echeance < CURDATE())
            ) INTO v_donnees;
            
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
        -- 4. Vérifier paiements très en retard (> 30 jours)
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'PAIEMENT_CRITIQUE';
        IF EXISTS (
            SELECT 1 FROM echeances_paiements 
            WHERE utilisateur_id = v_user_id 
            AND statut = 'en attente' 
            AND date_echeance < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) THEN
            SELECT JSON_OBJECT(
                'jours_retard', 
                DATEDIFF(CURDATE(), MIN(date_echeance)),
                'montant_total',
                SUM(montant)
            ) INTO v_donnees
            FROM echeances_paiements 
            WHERE utilisateur_id = v_user_id AND statut = 'en attente' AND date_echeance < CURDATE();
            
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
        -- 5. Vérifier absence prolongée
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'ABSENCE_PROLONGEE';
        IF NOT EXISTS (
            SELECT 1 FROM inscriptions i
            JOIN cours c ON i.cours_id = c.id
            WHERE i.utilisateur_id = v_user_id 
            AND i.status_id = 1
            AND c.date_cours >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) THEN
            SELECT JSON_OBJECT(
                'derniere_presence', 
                COALESCE(MAX(c.date_cours), 'Jamais')
            ) INTO v_donnees
            FROM inscriptions i
            JOIN cours c ON i.cours_id = c.id
            WHERE i.utilisateur_id = v_user_id AND i.status_id = 1;
            
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
        -- 6. Vérifier utilisateurs sans abonnement
        SELECT id INTO v_alerte_type_id FROM alertes_types WHERE code = 'SANS_ABONNEMENT';
        IF EXISTS (
            SELECT 1 FROM utilisateurs 
            WHERE id = v_user_id 
            AND (abonnement_id IS NULL OR abonnement_id = 0)
            AND status_id IN (2, 3, 4, 5) -- Pas les visiteurs
        ) THEN
            SET v_donnees = JSON_OBJECT('statut', 'Aucun abonnement actif');
            INSERT IGNORE INTO alertes_utilisateurs (utilisateur_id, alerte_type_id, donnees_contexte)
            VALUES (v_user_id, v_alerte_type_id, v_donnees);
        END IF;
        
    END LOOP;
    
    CLOSE user_cursor;
    
    -- Résoudre automatiquement les alertes qui ne sont plus d'actualité
    UPDATE alertes_utilisateurs au
    JOIN alertes_types at ON au.alerte_type_id = at.id
    SET au.statut = 'resolue', au.date_resolution = NOW()
    WHERE au.statut = 'active' 
    AND (
        (at.code = 'COMPTE_INCOMPLET' AND NOT EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id = au.utilisateur_id 
            AND (u.email = '' OR u.email IS NULL OR u.date_of_birth IS NULL 
                 OR u.genre_id IS NULL OR u.abonnement_id IS NULL)
        ))
        OR
        (at.code = 'PAIEMENT_RETARD' AND NOT EXISTS (
            SELECT 1 FROM echeances_paiements ep
            WHERE ep.utilisateur_id = au.utilisateur_id 
            AND ep.statut = 'en attente' 
            AND ep.date_echeance < CURDATE()
        ))
        OR
        (at.code = 'SANS_ABONNEMENT' AND EXISTS (
            SELECT 1 FROM utilisateurs u
            WHERE u.id = au.utilisateur_id 
            AND u.abonnement_id IS NOT NULL 
            AND u.abonnement_id > 0
        ))
    );
    
    SELECT 'Détection des alertes terminée' AS message;
END //

-- Procédure pour obtenir le tableau de bord des alertes
CREATE PROCEDURE obtenir_dashboard_alertes()
BEGIN
    -- Résumé par type d'alerte
    SELECT 
        at.nom as type_alerte,
        at.priorite,
        COUNT(au.id) as nombre_alertes,
        COUNT(CASE WHEN au.statut = 'active' THEN 1 END) as alertes_actives
    FROM alertes_types at
    LEFT JOIN alertes_utilisateurs au ON at.id = au.alerte_type_id
    WHERE at.actif = TRUE
    GROUP BY at.id, at.nom, at.priorite
    ORDER BY 
        CASE at.priorite 
            WHEN 'critique' THEN 1 
            WHEN 'haute' THEN 2 
            WHEN 'normale' THEN 3 
            WHEN 'basse' THEN 4 
        END;
END //

-- Procédure pour obtenir les détails des alertes par utilisateur
CREATE PROCEDURE obtenir_alertes_utilisateur(IN p_utilisateur_id INT)
BEGIN
    SELECT 
        au.id,
        at.nom as type_alerte,
        at.description,
        at.priorite,
        au.statut,
        au.donnees_contexte,
        au.date_detection,
        au.date_resolution,
        au.notes,
        CONCAT(u.first_name, ' ', u.last_name) as nom_utilisateur,
        u.email
    FROM alertes_utilisateurs au
    JOIN alertes_types at ON au.alerte_type_id = at.id
    JOIN utilisateurs u ON au.utilisateur_id = u.id
    WHERE au.utilisateur_id = p_utilisateur_id
    ORDER BY au.date_detection DESC;
END //

-- Procédure pour résoudre une alerte
CREATE PROCEDURE resoudre_alerte(
    IN p_alerte_id INT,
    IN p_notes TEXT,
    IN p_effectue_par INT
)
BEGIN
    UPDATE alertes_utilisateurs 
    SET statut = 'resolue', 
        date_resolution = NOW(),
        notes = p_notes
    WHERE id = p_alerte_id;
    
    INSERT INTO alertes_actions (alerte_id, action_type, description, effectue_par)
    VALUES (p_alerte_id, 'autre', CONCAT('Alerte résolue: ', p_notes), p_effectue_par);
    
    SELECT 'Alerte résolue avec succès' AS message;
END //

DELIMITER ;

-- Event pour exécuter la détection automatiquement (chaque jour à 6h du matin)
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS detection_alertes_quotidienne
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '06:00:00')
DO
BEGIN
    CALL detecter_alertes_utilisateurs();
END //
DELIMITER ;
