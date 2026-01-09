/**
 * Point d'entrée pour les utilitaires du module Compte
 */

// Parsing utilities
export {
  parseUtilisateurRow,
  parseUtilisateurRows,
  parseUtilisateurAvecRelationsRow,
  parseCompteInfoRow,
  parseGenreRow,
  parseGradeRow,
  parseStatusRow,
  parsePlanTarifaireRow,
  toNumber,
  toInt,
  toBoolean,
  formatFullName,
  formatDate,
  formatDateTime,
  formatDateForSQL,
  formatPhone,
  formatUtilisateurForDisplay,
  maskEmail,
  maskPhone,
  removePassword,
  removePasswords,
  getInitials,
  calculateAge,
  extractEmailDomain,
  snakeToCamel,
  camelToSnake,
  prepareUpdateData,
} from './parsing.utils.js';

// Validation utilities
export {
  validateUtilisateur,
  validateUpdateCompteData,
  validateUpdateUtilisateurData,
  validateUserId,
  validateGenreId,
  validateGradeId,
  validateStatusId,
  validateAbonnementId,
  validateName,
  validateUsername,
  validatePasswordUpdateData,
  validateSearchParams,
  isUserModifiable,
  isUserDeletable,
  getValueType,
  sanitizeName,
  sanitizeEmail,
  sanitizeUsername,
  sanitizePhone,
} from './validation.utils.js';
