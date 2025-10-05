DELIMITER //
CREATE PROCEDURE create_email_validation_token(IN p_user_id INT)
BEGIN
    DECLARE v_token VARCHAR(64);

    -- Supprimer les tokens existants non utilisés
    DELETE FROM email_validation_tokens
    WHERE user_id = p_user_id AND token_type = 'email_validation' AND is_used = FALSE;

    -- Générer un nouveau token
    SET v_token = generate_token();

    -- Insérer le token (valable 24h)
    INSERT INTO email_validation_tokens (user_id, token, token_type, expires_at)
    VALUES (p_user_id, v_token, 'email_validation', DATE_ADD(NOW(), INTERVAL 24 HOUR));

    SELECT v_token AS validation_token;
END//
DELIMITER ;
