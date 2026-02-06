/**
 * Index des validators du module professeurs
 * Exporte tous les schémas de validation pour faciliter les imports
 */

export {
  getProfesseursSchema,
  getProfesseurByIdSchema,
  ajouterProfesseurSchema,
  modifierStatutProfesseurSchema,
  getPlanningProfesseurSchema,
  utilisateurSchema,
  coursSchema,
  type GetProfesseursData,
  type GetProfesseurByIdData,
  type AjouterProfesseurData,
  type ModifierStatutProfesseurData,
  type GetPlanningProfesseurData,
  type UtilisateurData,
  type CoursData,
} from './professeur.schema.js';
