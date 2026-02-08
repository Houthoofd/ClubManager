/**
 * Index des handlers du module Utilisateurs
 * Exporte tous les handlers pour faciliter les imports
 */

export { verifierExistence } from "./verifier-existence.handler.js";
export { getUtilisateurs } from "./get-utilisateurs.handler.js";
export { getUtilisateurById } from "./get-utilisateur-by-id.handler.js";
export { inscription } from "./inscription.handler.js";
export { connexionUserId } from "./connexion-userid.handler.js";
export { updateUtilisateur } from "./update-utilisateur.handler.js";
export { deleteUtilisateur } from "./delete-utilisateur.handler.js";
export { getStats } from "./get-stats.handler.js";
export { healthCheck } from "./health.handler.js";
