USE clubmanager;

-- 1. Supprimer l'ancienne contrainte unique qui pose problème
ALTER TABLE paiements DROP INDEX uk_utilisateur_periode;

-- 2. Modifier les colonnes periode_debut et periode_fin pour accepter NULL
ALTER TABLE paiements 
MODIFY COLUMN periode_debut DATE NULL,
MODIFY COLUMN periode_fin DATE NULL;

-- 3. Ajouter la nouvelle contrainte unique seulement pour les abonnements
-- Cette contrainte ne s'applique que quand abonnement_id n'est pas NULL
ALTER TABLE paiements 
ADD CONSTRAINT uk_utilisateur_periode_abonnement 
UNIQUE (utilisateur_id, periode_debut, abonnement_id);

-- 4. Vérifier la structure mise à jour
DESCRIBE paiements;

-- 5. Afficher les contraintes pour vérification
SHOW INDEX FROM paiements;
