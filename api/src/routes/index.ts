/**
 * Exports centralisés de tous les modules routes
 *
 * ✅ Barrel export pour simplifier les imports inter-modules
 *
 * @example
 * // Avant
 * import { authService } from '../auth/core/services/auth.service.js';
 *
 * // Après
 * import { authService } from '@/routes/auth';
 */

// ===== Auth =====
export * from "./auth/index.js";

// ===== Alertes =====
export * from "./alertes/index.js";

// ===== Commandes =====
export * from "./commandes/index.js";

// ===== Compte =====
export * from "./compte/index.js";

// ===== Confirmation =====
export * from "./confirmation/index.js";

// ===== Cours =====
export * from "./cours/index.js";

// ===== Echeances =====
export * from "./echeances/index.js";

// ===== Informations =====
export * from "./informations/index.js";

// ===== Inscription =====
export * from "./inscription/index.js";

// ===== Magasin =====
export * from "./magasin/index.js";

// ===== Messages =====
export * from "./messages/index.js";

// ===== Paiements =====
export { paiementsResolvers } from "./paiements/index.js";
export type {
  PaiementData,
  PaiementFilters,
} from "./paiements/core/types/paiements.types.js";

// ===== Professeurs =====
export * from "./professeurs/index.js";

// ===== Statistiques =====
export * from "./statistiques/index.js";

// ===== Stocks =====
export { stocksResolvers } from "./stocks/index.js";
export type {
  StockData,
  StockFilters,
} from "./stocks/core/types/stocks.types.js";

// ===== Stripe =====
export * from "./stripe/index.js";

// ===== Upload =====
export * from "./upload/index.js";

// ===== Utilisateurs =====
export * from "./utilisateurs/index.js";

// ===== Verification =====
export { verificationResolvers } from "./verification/index.js";
