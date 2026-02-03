/**
 * Index des handlers du module paiements
 * Exporte tous les handlers pour faciliter les imports
 */

export { createPaymentEcheance } from './create-payment-echeance.handler.js';
export { createPaymentCommande } from './create-payment-commande.handler.js';
export { confirmEcheancePayment } from './confirm-echeance.handler.js';
export { confirmCommandePayment } from './confirm-commande.handler.js';
export { handleStripeWebhook } from './webhook.handler.js';
export {
  getHistoriquePaiements,
  getEcheancesUtilisateur,
  getEcheanceDetails,
} from './get-historique.handler.js';
export {
  healthCheck,
  getDiagnostic,
  testStripeKeys,
} from './health.handler.js';
