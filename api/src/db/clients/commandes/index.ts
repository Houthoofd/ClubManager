/**
 * Point d'entrée pour le module Commandes
 * Exporte tous les composants nécessaires
 */

// Façade principale (API recommandée)
export { Commandes, CommandesClient, default } from './commandes.js';

// Repository (accès direct aux données)
export { CommandesRepository, getCommandesRepository } from './commandes.repository.js';

// Types
export type {
  Commande,
  ArticleCommande,
  StatutCommande,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeStatistiques,
  CommandeSearchFilters,
  CommandeSearchResult,
  CommandeStatsPeriode,
  TopProduit,
  CommandeRow,
  StatistiquesRow,
  ChiffreAffairesMoisRow,
  CountByStatutRow,
  StatsPeriodeRow,
  SearchCountRow,
} from './types.js';

export {
  isValidStatut,
  isValidArticle,
  isValidCommande,
} from './types.js';

// Queries SQL (pour usage avancé)
export * as CommandesQueries from './queries.js';

// Utilitaires
export {
  // Parsing
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
  // Validation
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
} from './utils/index.js';
