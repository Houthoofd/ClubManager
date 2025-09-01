DELIMITER //

CREATE TRIGGER after_echeance_paiement_update
AFTER UPDATE ON echeances_paiements
FOR EACH ROW
BEGIN
    -- Vérifier si le statut a changé à 'payé' (que ce soit depuis 'en attente' ou 'échu')
    IF (OLD.statut = 'en attente' OR OLD.statut = 'échu') AND NEW.statut = 'payé' THEN
        -- Insérer une nouvelle ligne dans la table paiements
        INSERT INTO paiements (utilisateur_id, montant, date_paiement, statut, abonnement_id, periode_debut, periode_fin)
        VALUES (
            NEW.utilisateur_id,
            NEW.montant,
            NEW.date_paiement,  -- Assurez-vous que cette colonne est remplie lors de la mise à jour
            'validé',
            NEW.abonnement_id,
            -- Déterminer la période de début et de fin en fonction de la date d'échéance
            DATE_SUB(NEW.date_echeance, INTERVAL 1 MONTH),  -- Période de début (ajustez selon votre logique)
            NEW.date_echeance  -- Période de fin
        );
    END IF;
END//

DELIMITER ;
