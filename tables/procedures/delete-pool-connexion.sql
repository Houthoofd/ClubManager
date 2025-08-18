-- Création d'un EVENT qui nettoie automatiquement les connexions Sleep indésirables toutes les 5 minutes
-- Sauf rdsadmin et event_scheduler

DELIMITER //

CREATE EVENT IF NOT EXISTS auto_kill_sleep
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    -- Construire la liste des process à tuer
    SET @kill_list = (
        SELECT GROUP_CONCAT(CONCAT('KILL ', id) SEPARATOR '; ')
        FROM information_schema.processlist
        WHERE user NOT IN ('rdsadmin')
          AND command = 'Sleep'
          AND id != CONNECTION_ID()
    );

    -- Exécuter la liste des KILLs si elle n'est pas vide
    IF @kill_list IS NOT NULL THEN
        PREPARE stmt FROM @kill_list;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;
//

DELIMITER ;
