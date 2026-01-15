/**
 * Point d'entrée des utilitaires pour le module professeurs
 * Re-exporte toutes les fonctions utilitaires
 */

// Utilitaires de parsing
export {
  parseProfesseurRow,
  parseProfesseurRows,
  parseProfesseurCompletRow,
  parseProfesseurCompletRows,
  parseUtilisateurRow,
  parseUtilisateurRows,
  parseCoursRecurrentRow,
  parseCoursRecurrentRows,
  toInt,
  toString,
  toBoolean,
  toDate,
  toFloat,
  isDefined,
  isNonEmptyString,
  isValidNumber,
  cleanString,
  parseRows,
  parseRowOrNull,
  parseCountResult,
  parseExistsResult,
} from './parsing.utils.js';

// Types pour parsing
export type {
  UtilisateurRow,
  CoursRecurrentRow,
} from './parsing.utils.js';

// Utilitaires de validation
export {
  isValidEmail,
  normalizeEmail,
  isValidId,
  areValidIds,
  isValidName,
  isValidUsername,
  isValidStatusId,
  isProfesseurStatus,
  isUtilisateurStatus,
  isValidDateOfBirth,
  formatDateForDB,
  isValidTimeFormat,
  isValidTimeRange,
  isValidDayOfWeek,
  isValidAjouterProfesseurDTO,
  isValidAjouterProfesseursBatchDTO,
  isValidModifierStatutProfesseurDTO,
  isValidProfesseurObject,
  isValidUtilisateurObject,
  validateUpdateUserData,
  sanitizeEmail,
  sanitizeName,
  sanitizeUsername,
  canBePromotedToProfesseur,
  canBeDemotedFromProfesseur,
  checkObjectIntegrity,
  checkProfesseurIntegrity,
  checkUtilisateurIntegrity,
  VALID_STATUS_IDS,
} from './validation.utils.js';
