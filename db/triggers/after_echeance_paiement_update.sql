DELIMITER //

DROP TRIGGER IF EXISTS after_echeance_paiement_update//

CREATE TRIGGER after_echeance_paiement_update
AFTER UPDATE ON echeances_paiements
FOR EACH ROW
BEGIN
    -- Vérifier si le statut a changé à 'payé' (que ce soit depuis 'en attente' ou 'échu')
    IF (OLD.statut = 'en attente' OR OLD.statut = 'échu') AND NEW.statut = 'payé' THEN
        
        -- AJOUTÉ: Vérifier qu'il n'existe pas déjà un paiement pour cette période
        -- Cela évite la violation de contrainte uk_utilisateur_periode_abonnement
        IF NOT EXISTS (
            SELECT 1 FROM paiements 
            WHERE utilisateur_id = NEW.utilisateur_id 
            AND abonnement_id = NEW.abonnement_id 
            AND periode_debut = DATE_SUB(NEW.date_echeance, INTERVAL 1 MONTH)
            AND periode_fin = NEW.date_echeance
        ) THEN
            -- Insérer une nouvelle ligne dans la table paiements SEULEMENT si elle n'existe pas
            INSERT INTO paiements (utilisateur_id, montant, date_paiement, statut, abonnement_id, periode_debut, periode_fin)
            VALUES (
                NEW.utilisateur_id,
                NEW.montant,
                NEW.date_paiement,
                'validé',
                NEW.abonnement_id,
                DATE_SUB(NEW.date_echeance, INTERVAL 1 MONTH),  -- Période de début
                NEW.date_echeance  -- Période de fin
            );
        ELSE
            -- AJOUTÉ: Log pour debug (optionnel)
            -- On peut ajouter une table de logs si nécessaire
            -- INSERT INTO trigger_logs (message, timestamp) VALUES 
            -- (CONCAT('Paiement déjà existant pour échéance ', NEW.id, ' utilisateur ', NEW.utilisateur_id), NOW());
            
            -- AJOUTÉ: Mettre à jour le paiement existant si nécessaire
            UPDATE paiements 
            SET 
                statut = 'validé',
                date_paiement = NEW.date_paiement,
                montant = NEW.montant
            WHERE utilisateur_id = NEW.utilisateur_id 
            AND abonnement_id = NEW.abonnement_id 
            AND periode_debut = DATE_SUB(NEW.date_echeance, INTERVAL 1 MONTH)
            AND periode_fin = NEW.date_echeance
            AND statut != 'validé';  -- Éviter les mises à jour inutiles
        END IF;
        
    END IF;
END//

DELIMITER ;
