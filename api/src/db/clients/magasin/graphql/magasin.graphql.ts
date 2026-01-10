/**
 * Schema et Resolvers GraphQL pour le module Magasin
 */

import { getMagasinRepository } from '../magasin.repository.js';
import type {
  CreateArticleData,
  UpdateArticleData,
  CreateCommandeData,
  AddStockData,
  UpdateStockData,
} from '../types.js';

const repository = getMagasinRepository();

// ============================================================================
// TYPE DEFINITIONS (SCHEMA)
// ============================================================================

export const typeDefs = `#graphql
  # Types de base

  type Article {
    id: Int!
    nom: String!
    prix: Float!
    description: String
    categorie: Categorie!
    images: [String!]!
    stocks: [StockArticle!]!
    created_at: String
    updated_at: String
  }

  type StockArticle {
    taille: String!
    quantite: Int!
  }

  type StockDetail {
    id: Int!
    article_id: Int!
    taille_id: Int!
    taille: String!
    quantite: Int!
  }

  type Categorie {
    id: Int!
    nom: String!
  }

  type Taille {
    id: Int!
    nom: String!
  }

  type Commande {
    id: Int!
    utilisateur_id: Int!
    date_commande: String!
    statut: String!
    total: Float!
    articles: [ArticleCommande!]!
    created_at: String
    updated_at: String
  }

  type CommandeAvecClient {
    commande_id: Int!
    date_commande: String!
    statut: String!
    total: Float!
    client: Client!
    articles: [ArticleCommande!]!
  }

  type Client {
    id: Int!
    nom: String!
    email: String!
  }

  type ArticleCommande {
    article_id: Int!
    nom: String
    taille: String!
    quantite: Int!
    prix: Float!
  }

  type ArticlesParCategorie {
    categorie: String!
    articles: [Article!]!
  }

  type MagasinStats {
    totalArticles: Int!
    totalCommandes: Int!
    totalRevenu: Float!
    articlesEnRupture: Int!
    commandesEnAttente: Int!
  }

  type ConfirmationResult {
    isConfirm: Boolean!
    message: String!
    data: JSON
  }

  # Scalar personnalisé pour JSON
  scalar JSON

  # Inputs

  input CreateArticleInput {
    nom: String!
    prix: Float!
    description: String
    categorie_id: Int!
    images: [String!]
    stocks: [CreateStockInput!]
  }

  input CreateStockInput {
    taille: String!
    quantite: Int!
  }

  input UpdateArticleInput {
    nom: String
    prix: Float
    description: String
    categorie_id: Int
    images: [String!]
    stocks: [CreateStockInput!]
  }

  input CreateCommandeInput {
    utilisateur_id: Int!
    articles: [CreateArticleCommandeInput!]!
    total: Float!
    date: String
    statut: String
  }

  input CreateArticleCommandeInput {
    article_id: Int!
    taille: String!
    quantite: Int!
    prix: Float!
  }

  input AddStockInput {
    article_id: Int!
    taille_id: Int!
    quantite: Int!
  }

  input UpdateStockInput {
    article_id: Int!
    taille_id: Int!
    quantite: Int!
  }

  # Queries

  type Query {
    # Articles
    getAllArticles: [Article!]!
    getArticleById(id: Int!): Article
    getArticlesParCategories: [ArticlesParCategorie!]!
    getArticlesByCategorie(categorieId: Int!): [Article!]!
    searchArticlesByName(searchTerm: String!): [Article!]!
    searchArticlesByPriceRange(minPrice: Float!, maxPrice: Float!): [Article!]!

    # Stocks
    getAllStocks: [StockDetail!]!
    getStocksByArticle(articleId: Int!): [StockDetail!]!
    getStockByArticleAndTaille(articleId: Int!, tailleId: Int!): StockDetail
    getOutOfStockArticles: [Article!]!
    getLowStockArticles(threshold: Int): [StockDetail!]!

    # Catégories
    getAllCategories: [Categorie!]!
    getCategorieById(id: Int!): Categorie
    getCategorieByName(nom: String!): Categorie

    # Tailles
    getAllTailles: [Taille!]!
    getTailleById(id: Int!): Taille
    getTailleByName(nom: String!): Taille

    # Commandes
    getAllCommandes: [CommandeAvecClient!]!
    getCommandeById(id: Int!): CommandeAvecClient
    getCommandesByUser(utilisateurId: Int!): [CommandeAvecClient!]!
    getCommandesByStatut(statut: String!): [CommandeAvecClient!]!

    # Statistiques
    getMagasinStats: MagasinStats!

    # Validations
    articleExists(id: Int!): Boolean!
    categorieExists(id: Int!): Boolean!
    checkStockSufficient(articleId: Int!, tailleId: Int!, quantite: Int!): Boolean!
  }

  # Mutations

  type Mutation {
    # Articles
    createArticle(input: CreateArticleInput!): ConfirmationResult!
    updateArticle(id: Int!, input: UpdateArticleInput!): ConfirmationResult!
    deleteArticle(id: Int!): ConfirmationResult!

    # Stocks
    addStock(input: AddStockInput!): ConfirmationResult!
    updateStock(input: UpdateStockInput!): ConfirmationResult!

    # Commandes
    createCommande(input: CreateCommandeInput!): ConfirmationResult!
    updateCommandeStatut(id: Int!, statut: String!): ConfirmationResult!
    cancelCommande(id: Int!): ConfirmationResult!
  }
`;

// ============================================================================
// RESOLVERS
// ============================================================================

export const resolvers = {
  // Custom scalar for JSON
  JSON: {
    parseValue(value: any) {
      return value;
    },
    serialize(value: any) {
      return value;
    },
    parseLiteral(ast: any) {
      return ast.value;
    },
  },

  // Queries
  Query: {
    // Articles
    getAllArticles: async () => {
      try {
        return await repository.getAllArticles();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des articles: ${error.message}`);
      }
    },

    getArticleById: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.getArticleById(id);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de l'article: ${error.message}`);
      }
    },

    getArticlesParCategories: async () => {
      try {
        const articlesParCategorie = await repository.getArticlesParCategories();
        // Convertir l'objet en array pour GraphQL
        return Object.entries(articlesParCategorie).map(([categorie, articles]) => ({
          categorie,
          articles,
        }));
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des articles par catégories: ${error.message}`
        );
      }
    },

    getArticlesByCategorie: async (_: any, { categorieId }: { categorieId: number }) => {
      try {
        return await repository.getArticlesByCategorie(categorieId);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des articles par catégorie: ${error.message}`
        );
      }
    },

    searchArticlesByName: async (_: any, { searchTerm }: { searchTerm: string }) => {
      try {
        return await repository.searchArticlesByName(searchTerm);
      } catch (error: any) {
        throw new Error(`Erreur lors de la recherche d'articles: ${error.message}`);
      }
    },

    searchArticlesByPriceRange: async (
      _: any,
      { minPrice, maxPrice }: { minPrice: number; maxPrice: number }
    ) => {
      try {
        return await repository.searchArticlesByPriceRange(minPrice, maxPrice);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la recherche d'articles par prix: ${error.message}`
        );
      }
    },

    // Stocks
    getAllStocks: async () => {
      try {
        return await repository.getAllStocks();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des stocks: ${error.message}`);
      }
    },

    getStocksByArticle: async (_: any, { articleId }: { articleId: number }) => {
      try {
        return await repository.getStocksByArticle(articleId);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des stocks de l'article: ${error.message}`
        );
      }
    },

    getStockByArticleAndTaille: async (
      _: any,
      { articleId, tailleId }: { articleId: number; tailleId: number }
    ) => {
      try {
        return await repository.getStockByArticleAndTaille(articleId, tailleId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération du stock: ${error.message}`);
      }
    },

    getOutOfStockArticles: async () => {
      try {
        return await repository.getOutOfStockArticles();
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des articles en rupture: ${error.message}`
        );
      }
    },

    getLowStockArticles: async (_: any, { threshold }: { threshold?: number }) => {
      try {
        return await repository.getLowStockArticles(threshold || 5);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des articles à faible stock: ${error.message}`
        );
      }
    },

    // Catégories
    getAllCategories: async () => {
      try {
        return await repository.getAllCategories();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`);
      }
    },

    getCategorieById: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.getCategorieById(id);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de la catégorie: ${error.message}`);
      }
    },

    getCategorieByName: async (_: any, { nom }: { nom: string }) => {
      try {
        return await repository.getCategorieByName(nom);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de la catégorie: ${error.message}`);
      }
    },

    // Tailles
    getAllTailles: async () => {
      try {
        return await repository.getAllTailles();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des tailles: ${error.message}`);
      }
    },

    getTailleById: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.getTailleById(id);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de la taille: ${error.message}`);
      }
    },

    getTailleByName: async (_: any, { nom }: { nom: string }) => {
      try {
        return await repository.getTailleByName(nom);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de la taille: ${error.message}`);
      }
    },

    // Commandes
    getAllCommandes: async () => {
      try {
        return await repository.getAllCommandes();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des commandes: ${error.message}`);
      }
    },

    getCommandeById: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.getCommandeById(id);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération de la commande: ${error.message}`);
      }
    },

    getCommandesByUser: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
      try {
        return await repository.getCommandesByUser(utilisateurId);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des commandes de l'utilisateur: ${error.message}`
        );
      }
    },

    getCommandesByStatut: async (_: any, { statut }: { statut: string }) => {
      try {
        return await repository.getCommandesByStatut(statut);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la récupération des commandes par statut: ${error.message}`
        );
      }
    },

    // Statistiques
    getMagasinStats: async () => {
      try {
        return await repository.getStats();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
      }
    },

    // Validations
    articleExists: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.articleExists(id);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la vérification de l'existence de l'article: ${error.message}`
        );
      }
    },

    categorieExists: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.categorieExists(id);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la vérification de l'existence de la catégorie: ${error.message}`
        );
      }
    },

    checkStockSufficient: async (
      _: any,
      { articleId, tailleId, quantite }: { articleId: number; tailleId: number; quantite: number }
    ) => {
      try {
        return await repository.checkStockSufficient(articleId, tailleId, quantite);
      } catch (error: any) {
        throw new Error(
          `Erreur lors de la vérification de la disponibilité du stock: ${error.message}`
        );
      }
    },
  },

  // Mutations
  Mutation: {
    // Articles
    createArticle: async (_: any, { input }: { input: CreateArticleData }) => {
      try {
        return await repository.createArticle(input);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la création de l'article: ${error.message}`,
          data: null,
        };
      }
    },

    updateArticle: async (
      _: any,
      { id, input }: { id: number; input: UpdateArticleData }
    ) => {
      try {
        return await repository.updateArticle(id, input);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la mise à jour de l'article: ${error.message}`,
          data: null,
        };
      }
    },

    deleteArticle: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.deleteArticle(id);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la suppression de l'article: ${error.message}`,
          data: null,
        };
      }
    },

    // Stocks
    addStock: async (_: any, { input }: { input: AddStockData }) => {
      try {
        return await repository.addStock(input);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de l'ajout du stock: ${error.message}`,
          data: null,
        };
      }
    },

    updateStock: async (_: any, { input }: { input: UpdateStockData }) => {
      try {
        return await repository.updateStock(input);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la mise à jour du stock: ${error.message}`,
          data: null,
        };
      }
    },

    // Commandes
    createCommande: async (_: any, { input }: { input: CreateCommandeData }) => {
      try {
        return await repository.createCommande(input);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la création de la commande: ${error.message}`,
          data: null,
        };
      }
    },

    updateCommandeStatut: async (
      _: any,
      { id, statut }: { id: number; statut: string }
    ) => {
      try {
        return await repository.updateCommandeStatut(id, statut);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de la mise à jour du statut de la commande: ${error.message}`,
          data: null,
        };
      }
    },

    cancelCommande: async (_: any, { id }: { id: number }) => {
      try {
        return await repository.cancelCommande(id);
      } catch (error: any) {
        return {
          isConfirm: false,
          message: `Erreur lors de l'annulation de la commande: ${error.message}`,
          data: null,
        };
      }
    },
  },
};
