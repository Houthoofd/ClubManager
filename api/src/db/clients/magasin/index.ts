/**
 * Point d'entrée principal du module Magasin
 * Exporte tous les éléments nécessaires pour utiliser le module
 */

// Repository
export { MagasinRepository, getMagasinRepository } from './magasin.repository.js';

// Types
export * from './types.js';

// Queries (pour usage avancé)
export * as MagasinQueries from './queries/index.js';

// Utils (pour usage avancé)
export * as MagasinUtils from './utils/index.js';

// GraphQL
export { typeDefs, resolvers } from './graphql/magasin.graphql.js';

/**
 * USAGE RECOMMANDÉ:
 *
 * 1. Import du repository (pattern singleton):
 *    import { getMagasinRepository } from './db/clients/magasin/index.js';
 *    const magasinRepo = getMagasinRepository();
 *
 * 2. Import des types:
 *    import type { Article, Commande, CreateArticleData } from './db/clients/magasin/index.js';
 *
 * 3. Import du schema GraphQL:
 *    import { typeDefs, resolvers } from './db/clients/magasin/index.js';
 *
 * EXEMPLES D'UTILISATION:
 *
 * // Récupérer tous les articles
 * const articles = await magasinRepo.getAllArticles();
 *
 * // Créer un article
 * const result = await magasinRepo.createArticle({
 *   nom: 'T-Shirt',
 *   prix: 25.99,
 *   categorie_id: 1,
 *   images: ['http://example.com/image.jpg'],
 *   stocks: [{ taille: 'M', quantite: 10 }]
 * });
 *
 * // Rechercher des articles
 * const resultats = await magasinRepo.searchArticlesByName('shirt');
 *
 * // Créer une commande
 * const commande = await magasinRepo.createCommande({
 *   utilisateur_id: 1,
 *   articles: [
 *     { article_id: 1, taille: 'M', quantite: 2, prix: 25.99 }
 *   ],
 *   total: 51.98
 * });
 *
 * // Obtenir les statistiques
 * const stats = await magasinRepo.getStats();
 */
