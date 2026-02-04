/**
 * Index des handlers du module magasin
 * Exporte tous les handlers pour faciliter les imports
 */

export { getArticles, getArticleById } from './get-articles.handler.js';
export { createArticle } from './create-article.handler.js';
export { updateArticle } from './update-article.handler.js';
export { deleteArticle } from './delete-article.handler.js';
export { getCategories } from './get-categories.handler.js';
export { createCommande } from './create-commande.handler.js';
export { getCommandes } from './get-commandes.handler.js';
export { verifyCommandeUnicity } from './verify-commande.handler.js';
export { getTailles } from './get-tailles.handler.js';
export { getPaymentIntent } from './get-payment-intent.handler.js';
export {
  getStatistiquesMagasin,
  healthCheck,
  getDiagnostic,
} from './health.handler.js';
