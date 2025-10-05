-- Procédure pour renvoyer le userId par email/SMS
DELIMITER //
CREATE PROCEDURE recuperer_userId(IN p_email VARCHAR(100))
BEGIN
    DECLARE v_userId VARCHAR(20);
    DECLARE v_first_name VARCHAR(50);
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count FROM utilisateurs WHERE email = p_email;
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Aucun compte trouvé avec cet email.';
    ELSE
        SELECT userId, first_name INTO v_userId, v_first_name
        FROM utilisateurs
        WHERE email = p_email
        LIMIT 1;

        -- Envoyer un email avec le userId (à implémenter côté application)
        SELECT CONCAT('Votre userId est : ', v_userId) AS message;
        -- Exemple de contenu d'email :
        -- "Bonjour ', v_first_name, ', voici votre userId pour vous connecter : ', v_userId, '. Conservez-le précieusement."
    END IF;
END//
DELIMITER ;
