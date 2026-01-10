/**
 * Point d'entrée pour les utilitaires du module Cours
 * Centralise tous les exports des différents fichiers d'utilitaires
 */

// ============================================================================
// PARSING UTILITIES
// ============================================================================

export {
  // Parsing des rows DB - Cours
  parseCoursRow,
  parseCoursRows,
  parseCoursRecurrentRow,
  parseCoursRecurrentRows,

  // Parsing des rows DB - Professeurs
  parseProfesseurRow,
  parseProfesseurRows,
  parseProfesseursString,

  // Parsing des rows DB - Participants
  parseUtilisateurParticipantRow,
  parseUtilisateurParticipantRows,

  // Parsing des rows DB - Inscriptions
  parseInscriptionRow,
  parseInscriptionRows,

  // Parsing des rows DB - Planning
  parseJourDeCoursRow,
  parseJourDeCoursRows,

  // Parsing des rows DB - Statistiques
  parseStatistiquesPresenceCoursRow,
  parseStatistiquesPresenceUtilisateurRow,

  // Conversion de types
  toNumber,
  toInt,
  toBoolean,

  // Formatting - Dates et heures
  formatDate,
  formatDateTime,
  formatDateForSQL,
  formatTime,
  formatPlageHoraire,
  formatJourSemaine,
  formatJourSemaineLower,

  // Formatting - Cours
  formatCoursTitre,
  formatCoursForDisplay,
  formatParticipantForDisplay,

  // Calculs et statistiques
  calculateTauxPresence,
  calculatePlacesDisponibles,
  isCoursComplet,
  createDisponibiliteCours,

  // Extraction et manipulation de données
  extractProfesseursNames,
  groupCoursByDate,
  groupCoursByType,
  sortCoursByDateTime,
  filterCoursFuturs,
  filterCoursPasses,

  // Transformation de données
  snakeToCamel,
  camelToSnake,
  prepareUpdateData,

  // Validation de données
  isDateInFuture,
  isDateInPast,
  isDateToday,
} from './parsing.utils.js';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export {
  // Types de validation
  type ValidationResult,

  // Validation des cours
  validateCreateCoursData,
  validateCreateCoursRecurrentData,
  validateUpdateCoursData,
  validateUpdateCoursRecurrentData,

  // Validation des inscriptions
  validateInscriptionData,

  // Validation des identifiants
  validateCoursId,
  validateCoursRecurrentId,
  validateInscriptionId,
  validateUtilisateurId,
  validateProfesseurId,

  // Validation des recherches
  validateCoursSearchFilters,

  // Validation des horaires
  validateHoraireCoherence,
  validateMinDuration,
  validateMaxDuration,

  // Validation des capacités
  validateCapaciteMax,
  canAcceptNewInscription,

  // Sanitization
  sanitizeTypeCours,
  sanitizeDescription,
  sanitizeNotes,
  sanitizeProfesseurName,

  // Vérifications de logique métier
  isCoursModifiable,
  isCoursSupprimable,
  isInscriptionAnnulable,
  jourNameToNumber,
} from './validation.utils.js';

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/**
 * @example
 * // Parsing d'une row de cours
 * import { parseCoursRow } from '@db/clients/cours/utils';
 *
 * const coursRow = await db.query('SELECT * FROM cours WHERE id = ?', [1]);
 * const cours = parseCoursRow(coursRow[0]);
 *
 * @example
 * // Validation des données
 * import { validateCreateCoursData } from '@db/clients/cours/utils';
 *
 * const result = validateCreateCoursData({
 *   date_cours: '2024-01-15',
 *   type_cours: 'Karaté',
 *   heure_debut: '18:00',
 *   heure_fin: '19:30'
 * });
 *
 * if (!result.isValid) {
 *   console.error('Erreurs:', result.errors);
 * }
 *
 * @example
 * // Formatting de dates et heures
 * import { formatPlageHoraire, formatDate } from '@db/clients/cours/utils';
 *
 * const horaire = formatPlageHoraire('18:00', '19:30'); // "18:00 - 19:30"
 * const date = formatDate(new Date()); // "15/01/2024"
 */
