/**
 * Point d'entrée pour les services du module Commandes
 * Exporte tous les services et leurs types
 */

// Services
export { CommandesService, getCommandesService, CommandeError } from './commandesService.js';
export { StockService, getStockService, StockError } from './stockService.js';

// Types des services
export type {
  StockArticle,
  StockCheckResult,
} from './stockService.js';

/**
 * Export par défaut
 */
export default {
  getCommandesService,
  getStockService,
};
