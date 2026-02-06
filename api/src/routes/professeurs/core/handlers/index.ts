/**
 * Index des handlers du module professeurs
 * Exporte tous les handlers pour faciliter les imports
 */

export { getProfesseurs, getProfesseurById } from './get-professeurs.handler.js';
export { ajouterProfesseurHandler } from './ajouter-professeur.handler.js';
export { modifierStatutProfesseurHandler } from './modifier-statut.handler.js';
export { getPlanningProfesseur } from './get-planning.handler.js';
export { healthCheck, getDiagnostic } from './health.handler.js';
