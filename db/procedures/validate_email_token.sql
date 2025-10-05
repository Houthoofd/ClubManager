DELIMITER //
CREATE PROCEDURE validate_email_token(IN p_token VARCHAR(64))
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_email VARCHAR(100);
    DECLARE v_first_name VARCHAR(50);

    -- Vérifier que le token existe et n'est pas expiré
    SELECT user_id INTO v_user_id
    FROM email_validation_tokens
    WHERE token = p_token
    AND token_type = 'email_validation'
    AND is_used = FALSE
    AND expires_at > NOW()
    LIMIT 1;

    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Token invalide ou expiré';
    ELSE
        -- Marquer le token comme utilisé
        UPDATE email_validation_tokens
        SET is_used = TRUE
        WHERE token = p_token;

        -- Activer le compte utilisateur
        UPDATE utilisateurs
        SET active = TRUE
        WHERE id = v_user_id;

        -- Récupérer les infos pour l'email de confirmation
        SELECT email, first_name INTO v_email, v_first_name
        FROM utilisateurs
        WHERE id = v_user_id;

        -- Retourner les infos pour l'email de confirmation
        SELECT
            v_user_id AS user_id,
            v_email AS email,
            v_first_name AS first_name,
            'Compte activé avec succès' AS message;
    END IF;
END//
DELIMITER ;
