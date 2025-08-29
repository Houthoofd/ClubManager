-- Supprimer la procédure si elle existe déjà
DROP PROCEDURE IF EXISTS inscrire_utilisateurs_aleatoirement;

DELIMITER //
CREATE PROCEDURE inscrire_utilisateurs_aleatoirement()
BEGIN
    -- Vider la table inscriptions pour éviter les doublons
    TRUNCATE TABLE inscriptions;

    -- Inscrire tous les utilisateurs à tous les cours
    INSERT INTO inscriptions (utilisateur_id, cours_id, date_inscription)
    SELECT u.id, c.id, NOW()
    FROM utilisateurs u
    CROSS JOIN cours c;

    -- Mettre à jour aléatoirement les présences
    UPDATE inscriptions i
    JOIN (
        SELECT id, (0.5 + (grade_id * 0.02)) AS user_activity_level
        FROM utilisateurs
    ) u ON i.utilisateur_id = u.id
    SET i.status_id = IF(RAND() < u.user_activity_level, 1, NULL);

    SELECT 'Inscription et validation des présences terminées avec succès' AS message;
END //
DELIMITER ;

-- Exécuter la procédure
CALL inscrire_utilisateurs_aleatoirement();

-- Vérifier les résultats
SELECT COUNT(*) AS total_inscriptions FROM inscriptions;
SELECT COUNT(*) AS total_presences_validees FROM inscriptions WHERE status_id = 1;
SELECT u.first_name, u.last_name, COUNT(i.id) AS total_presences_validees
FROM utilisateurs u
LEFT JOIN inscriptions i ON u.id = i.utilisateur_id AND i.status_id = 1
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_presences_validees DESC
LIMIT 10;
