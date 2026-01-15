/**
 * Point d'entrée du module professeurs
 * Exporte toutes les fonctionnalités publiques du module
 */

// Repository principal
export { ProfesseursRepository, getProfesseursRepository } from './professeurs.repository.js';

// Repositories spécialisés
export { ProfesseursReadRepository } from './repositories/read.repository.js';
export { ProfesseursWriteRepository } from './repositories/write.repository.js';
export { ProfesseursValidationRepository } from './repositories/validation.repository.js';

// Types
export type {
  Professeur,
  ProfesseurComplet,
  CoursRecurrent,
  Utilisateur,
  AjouterProfesseurDTO,
  AjouterProfesseursBatchDTO,
  ModifierStatutProfesseurDTO,
  RetirerPromotionDTO,
  ConfirmationResult,
  VerifyResultWithData,
  ProfesseursSearchResult,
  PlanningCoursResult,
} from './types.js';

// Enums et constantes
export {
  PROFESSEUR_STATUS_ID,
  UTILISATEUR_STATUS_ID,
  UserStatus,
  JourSemaine,
} from './types.js';

// Type guards
export {
  isProfesseur,
  isProfesseurComplet,
  isCoursRecurrent,
  isUtilisateur,
  isUtilisateurProfesseur,
} from './types.js';

// Utilitaires de mapping
export {
  mapRowToProfesseur,
  mapRowToProfesseurComplet,
  mapRowToCoursRecurrent,
  mapRowToUtilisateur,
} from './types.js';

// Client legacy (pour compatibilité)
export { Professeurs } from './professeurs.js';

// Export par défaut du repository principal
export { getProfesseursRepository as default } from './professeurs.repository.js';
