DELIMITER //
CREATE PROCEDURE supprimer_association_professeur_cours(
    IN p_professeur_id INT,
    IN p_jour_semaine INT
)
BEGIN
    DECLARE association_id INT;

    -- Trouver l'ID de l'association
    SELECT id INTO association_id
    FROM cours_recurrent_professeur
    WHERE professeur_id = p_professeur_id
      AND cours_recurrent_id IN (
          SELECT id
          FROM cours_recurrent
          WHERE jour_semaine = p_jour_semaine
      )
    LIMIT 1;

    -- Supprimer l'association si elle existe
    IF association_id IS NOT NULL THEN
        DELETE FROM cours_recurrent_professeur
        WHERE id = association_id;
        SELECT CONCAT('Association supprimée avec succès (ID: ', association_id, ')') AS message;
    ELSE
        SELECT 'Aucune association trouvée pour ce professeur et ce jour.' AS message;
    END IF;
END //
DELIMITER ;
