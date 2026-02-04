/**
 * Index des validators du module magasin
 * Exporte tous les schémas de validation pour faciliter les imports
 */

export {
  getArticlesSchema,
  getArticleByIdSchema,
  createArticleSchema,
  updateArticleSchema,
  deleteArticleSchema,
  articleCommandeSchema,
  createCommandeSchema,
  getCommandesUtilisateurSchema,
  getCommandeByUniqueIdSchema,
  getCommandeByNumeroSchema,
  getPaymentIntentSchema,
  getTaillesSchema,
  getStatistiquesMagasinSchema,
  type GetArticlesData,
  type GetArticleByIdData,
  type CreateArticleData,
  type UpdateArticleData,
  type DeleteArticleData,
  type ArticleCommandeData,
  type CreateCommandeData,
  type GetCommandesUtilisateurData,
  type GetCommandeByUniqueIdData,
  type GetCommandeByNumeroData,
  type GetPaymentIntentData,
  type GetTaillesData,
  type GetStatistiquesMagasinData,
} from './magasin.schema.js';
