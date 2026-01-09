/**
 * Point d'entrée pour les utilitaires du module Commandes
 */

// Parsing utilities
export {
  parseArticles,
  stringifyArticles,
  parseCommandeRow,
  parseCommandeRows,
  toNumber,
  toInt,
  calculateTotal,
  recalculateArticlePrices,
  countTotalArticles,
  formatPrice,
  formatDate,
  formatCommandeForDisplay,
  sanitizeCommandeId,
  sanitizePaymentIntentId,
  sanitizeArticle,
  sanitizeArticles,
} from './parsing.utils.js';

// Validation utilities
export {
  validateArticle,
  validateArticles,
  validateCreateCommandeData,
  validateUpdateCommandeData,
  validateCommandeId,
  validateUtilisateurId,
  validateStatut,
  validateSearchFilters,
  isValidDateString,
  isAmountInRange,
  isValidQuantity,
  isCommandeModifiable,
  isCommandeAnnulable,
  isValidStatusTransition,
  getValidNextStatuses,
} from './validation.utils.js';
