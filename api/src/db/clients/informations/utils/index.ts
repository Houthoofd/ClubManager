/**
 * Point d'entrée pour les utilitaires du module Informations
 * Centralise tous les exports des différents fichiers d'utilitaires
 */

// ============================================================================
// PARSING UTILITIES
// ============================================================================

export {
  // Parsing des rows DB - Informations
  parseInformationRow,
  parseInformationRows,
  parseInformationAvecRelationsRow,
  parseInformationAvecRelationsRows,

  // Parsing des rows DB - Référentiels
  parseStatusRow,
  parseStatusRows,
  parseGenreRow,
  parseGenreRows,
  parseGradeRow,
  parseGradeRows,
  parsePlanTarifaireRow,
  parsePlanTarifaireRows,
  parseCategorieInformationRow,
  parseCategorieInformationRows,

  // Conversion de types
  toNumber,
  toInt,
  toBoolean,

  // Formatting - Dates
  formatDate,
  formatDateTime,
  formatDateForSQL,
  formatDateRelative,

  // Formatting - Informations
  createInformationResume,
  formatInformationForDisplay,
  getPrioriteLabel,
  getStatusLabel,
  getPrioriteCouleur,

  // Extraction et manipulation
  stripHtml,
  countWords,
  estimateReadingTime,
  groupInformationsByCategorie,
  groupInformationsByPriorite,
  sortInformationsByDate,
  sortInformationsByPriorite,
  filterVisibleInformations,
  filterRecentInformations,

  // Transformation de données
  snakeToCamel,
  camelToSnake,
  prepareUpdateData,

  // Validation de données
  isDateInFuture,
  isDateInPast,
  isDateToday,
  daysSince,
} from './parsing.utils.js';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export {
  // Types de validation
  type ValidationResult,

  // Validation des informations
  validateCreateInformationData,
  validateUpdateInformationData,

  // Validation des identifiants
  validateInformationId,
  validateCategorieId,
  validateAuteurId,
  validateStatusId,

  // Validation des recherches
  validateInformationSearchFilters,

  // Sanitization
  sanitizeTitre,
  sanitizeContenu,
  sanitizeCategorieName,
  sanitizeDescription,

  // Vérifications de logique métier
  isInformationModifiable,
  isInformationSupprimable,
  isInformationPubliable,
  isInformationArchivable,
  isInformationRestauable,
  isInformationVisible,
  canUserEditInformation,
  canUserDeleteInformation,

  // Validation complète
  validateBeforePublish,
  validateCategorieData,
  validateCouleurHex,
  validateCompleteCategorieData,
} from './validation.utils.js';

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/**
 * @example
 * // Parsing d'une row d'information
 * import { parseInformationRow } from '@db/clients/informations/utils';
 *
 * const infoRow = await db.query('SELECT * FROM informations WHERE id = ?', [1]);
 * const info = parseInformationRow(infoRow[0]);
 *
 * @example
 * // Validation des données
 * import { validateCreateInformationData } from '@db/clients/informations/utils';
 *
 * const result = validateCreateInformationData({
 *   titre: 'Nouvelle information',
 *   contenu: 'Contenu de l\'information...',
 *   priorite: 2
 * });
 *
 * if (!result.isValid) {
 *   console.error('Erreurs:', result.errors);
 * }
 *
 * @example
 * // Formatting de dates
 * import { formatDateRelative, formatDate } from '@db/clients/informations/utils';
 *
 * const dateRelative = formatDateRelative(new Date()); // "Aujourd'hui"
 * const date = formatDate(new Date()); // "15/01/2024"
 *
 * @example
 * // Création d'un résumé
 * import { createInformationResume } from '@db/clients/informations/utils';
 *
 * const resume = createInformationResume(information, 150);
 * console.log(resume.extrait); // Premier 150 caractères + "..."
 */
