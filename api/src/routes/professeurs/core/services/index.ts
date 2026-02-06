/**
 * Index des services du module professeurs
 * Exporte tous les services pour faciliter les imports
 */

export {
  obtenirTousLesProfesseurs,
  obtenirProfesseurParId,
  ajouterProfesseur,
  modifierStatutProfesseur,
  obtenirPlanningProfesseur,
  extraireIdsUtilisateurs,
  validerUtilisateurPourPromotion,
  type Professeur,
  type CoursProfesseur,
  type OperationResult,
  type PlanningResult,
} from './professeurs.service.js';
