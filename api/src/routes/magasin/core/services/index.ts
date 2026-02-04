/**
 * Index des services du module magasin
 * Exporte tous les services pour faciliter les imports
 */

export {
  obtenirArticlesParCategories,
  obtenirLesCategories,
  ajouterArticle,
  modifierArticle,
  supprimerArticle,
  creerCommande,
  obtenirLesCommandes,
  verifierUniciteCommande,
  obtenirTailles,
  obtenirPaymentIntentCommande,
  calculerStatistiquesMagasin,
  generateUniqueCommandeId,
  generateSequentialCommandeNumber,
  nettoyerCacheCommandes,
  type Article,
  type Commande,
  type CommandeAvecDetails,
  type ArticleCommande,
  type StatistiquesMagasin,
} from './magasin.service.js';
