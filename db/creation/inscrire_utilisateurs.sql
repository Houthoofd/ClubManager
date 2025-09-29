SET SQL_SAFE_UPDATES = 0;  -- Désactive le mode sécurisé
CALL inscrire_utilisateurs_aleatoirement();
SET SQL_SAFE_UPDATES = 1;  -- Réactive le mode sécurisé (recommandé)
