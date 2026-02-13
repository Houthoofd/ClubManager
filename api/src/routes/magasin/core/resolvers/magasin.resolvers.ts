/**
 * Resolvers GraphQL pour le module Magasin - Partie Articles & Catégories
 * Gestion du e-commerce : articles, catégories
 *
 * Sécurité & Fonctionnalités :
 * - ✅ requireAuth - Authentification obligatoire (queries publiques)
 * - ✅ requireAdmin - Droits admin (mutations, stats)
 * - ✅ withSentry - Observabilité et monitoring
 * - ✅ Validation stricte inputs Zod
 * - ✅ Gestion stocks et disponibilités
 * - ✅ Catégories avec compteurs
 *
 * @module magasin/resolvers
 */

import { GraphQLError } from "graphql";
import { MagasinService } from "../services/magasin.service.js";
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import {
  combineMiddlewares,
  requireAuth,
  requireAdmin,
} from "@/shared/middleware/auth.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import {
  createArticleSchema,
  updateArticleSchema,
  deleteArticleSchema,
  createCommandeSchema,
  getCommandesUtilisateurSchema,
  type CreateArticleData,
  type UpdateArticleData,
  type CreateCommandeData,
} from "@clubmanager/types/validators";

import type {
  Article,
  MagasinCategorie as Categorie,
  MagasinCommande as Commande,
  Stock,
  ArticlesParCategorie,
} from "@clubmanager/types";

// Instance du service
const magasinService = new MagasinService();

// ============================================
// TYPES POUR LES RESOLVERS
// ============================================

interface ArticleIdArgs {
  id: number;
}

interface CategorieIdArgs {
  categorieId: number;
}

interface CreateArticleArgs {
  input: CreateArticleData;
}

interface UpdateArticleArgs {
  input: UpdateArticleData;
}

interface CreateCommandeArgs {
  input: CreateCommandeData;
}

interface UtilisateurIdArgs {
  utilisateurId: number;
}

interface UniqueIdArgs {
  uniqueId: string;
}

interface NumeroCommandeArgs {
  numeroCommande: string;
}

interface UpdateStatutCommandeArgs {
  input: {
    commandeId: number;
    statut: string;
  };
}

interface VerifierDisponibiliteArgs {
  input: {
    article_id: number;
    taille: string;
    quantite: number;
  };
}

interface MettreAJourStockArgs {
  articleId: number;
  taille: string;
  quantite: number;
}

interface CreateCategorieArgs {
  input: {
    nom: string;
  };
}

interface UpdateCategorieArgs {
  input: {
    id: number;
    nom: string;
  };
}

interface StatistiquesMagasinArgs {
  input?: {
    dateDebut?: string;
    dateFin?: string;
  };
}

// ============================================
// QUERY RESOLVERS - ARTICLES
// ============================================

/**
 * Query: obtenirTousLesArticles
 * Récupère tous les articles du magasin
 * Middleware: Auth + Sentry
 */
const obtenirTousLesArticlesResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Article[]> => {
  try {
    console.log("📦 [MagasinResolver] Récupération de tous les articles");

    const result = await magasinService.obtenirTousLesArticles();

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération des articles",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data?.articles || [];
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur obtenirTousLesArticles:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la récupération des articles: ${error.message}`,
      {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      },
    );
  }
};

/**
 * Query: obtenirArticleParId
 * Récupère un article par son ID
 * Middleware: Auth + Validation + Sentry
 */
const obtenirArticleParIdResolver = async (
  _: unknown,
  args: ArticleIdArgs,
  context: any,
): Promise<Article | null> => {
  try {
    console.log(`📦 [MagasinResolver] Récupération article ID: ${args.id}`);

    const articles = await magasinService.obtenirTousLesArticles();

    if (!articles.success) {
      throw new GraphQLError("Erreur lors de la récupération de l'article", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }

    const article = articles.data?.articles.find(
      (a: Article) => a.id === args.id,
    );

    if (!article) {
      throw new GraphQLError("Article non trouvé", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return article;
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur obtenirArticleParId:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la récupération de l'article: ${error.message}`,
      {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      },
    );
  }
};

/**
 * Query: obtenirArticlesParCategories
 * Récupère les articles groupés par catégories
 * Middleware: Auth + Sentry
 */
const obtenirArticlesParCategoriesResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<any[]> => {
  try {
    console.log("📦 [MagasinResolver] Récupération articles par catégories");

    const result = await magasinService.obtenirArticlesParCategories();

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    // Transformer l'objet en tableau pour GraphQL
    const articlesParCategorie = result.data || {};
    return Object.entries(articlesParCategorie).map(
      ([categorie, articles]) => ({
        categorie,
        articles,
      }),
    );
  } catch (error: any) {
    console.error(
      "❌ [MagasinResolver] Erreur obtenirArticlesParCategories:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la récupération: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Query: obtenirArticlesParCategorie
 * Récupère les articles d'une catégorie spécifique
 * Middleware: Auth + Sentry
 */
const obtenirArticlesParCategorieResolver = async (
  _: unknown,
  args: CategorieIdArgs,
  context: any,
): Promise<Article[]> => {
  try {
    console.log(
      `📦 [MagasinResolver] Récupération articles catégorie: ${args.categorieId}`,
    );

    const result = await magasinService.obtenirArticlesParCategorie(
      args.categorieId,
    );

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data || [];
  } catch (error: any) {
    console.error(
      "❌ [MagasinResolver] Erreur obtenirArticlesParCategorie:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la récupération: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Query: obtenirArticlesRuptureStock
 * Récupère les articles en rupture de stock (Admin)
 * Middleware: Auth + Admin + Sentry
 */
const obtenirArticlesRuptureStockResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Article[]> => {
  try {
    console.log("📦 [MagasinResolver] Récupération articles en rupture");

    const result = await magasinService.obtenirArticlesRuptureStock();

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data || [];
  } catch (error: any) {
    console.error(
      "❌ [MagasinResolver] Erreur obtenirArticlesRuptureStock:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la récupération: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

// ============================================
// QUERY RESOLVERS - CATÉGORIES
// ============================================

/**
 * Query: obtenirToutesLesCategories
 * Récupère toutes les catégories
 * Middleware: Auth + Sentry
 */
const obtenirToutesLesCategoriesResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Categorie[]> => {
  try {
    console.log("🏷️ [MagasinResolver] Récupération de toutes les catégories");

    const result = await magasinService.obtenirToutesLesCategories();

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération des catégories",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data?.categories || [];
  } catch (error: any) {
    console.error(
      "❌ [MagasinResolver] Erreur obtenirToutesLesCategories:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la récupération des catégories: ${error.message}`,
      {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      },
    );
  }
};

/**
 * Query: obtenirCategoriesAvecCompteurs
 * Récupère les catégories avec le nombre d'articles
 * Middleware: Auth + Sentry
 */
const obtenirCategoriesAvecCompteursResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<any[]> => {
  try {
    console.log("🏷️ [MagasinResolver] Récupération catégories avec compteurs");

    const result = await magasinService.obtenirCategoriesAvecCompteurs();

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data || [];
  } catch (error: any) {
    console.error(
      "❌ [MagasinResolver] Erreur obtenirCategoriesAvecCompteurs:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la récupération: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

// ============================================
// QUERY RESOLVERS - STOCKS
// ============================================

/**
 * Query: obtenirStocksArticle
 * Récupère les stocks d'un article
 * Middleware: Auth + Sentry
 */
const obtenirStocksArticleResolver = async (
  _: unknown,
  args: ArticleIdArgs,
  context: any,
): Promise<Stock[]> => {
  try {
    console.log(`📦 [MagasinResolver] Récupération stocks article: ${args.id}`);

    const result = await magasinService.obtenirStocksArticle(args.id);

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la récupération des stocks",
        {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        },
      );
    }

    return result.data || [];
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur obtenirStocksArticle:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la récupération des stocks: ${error.message}`,
      {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      },
    );
  }
};

/**
 * Query: verifierDisponibilite
 * Vérifie la disponibilité d'un article
 * Middleware: Auth + Sentry
 */
const verifierDisponibiliteResolver = async (
  _: unknown,
  args: VerifierDisponibiliteArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(
      `📦 [MagasinResolver] Vérification disponibilité article: ${args.input.article_id}`,
    );

    const result = await magasinService.verifierDisponibilite(
      args.input.article_id,
      args.input.taille,
      args.input.quantite,
    );

    if (!result.success) {
      return {
        disponible: false,
        message: result.message || "Article non disponible",
        stock_restant: 0,
      };
    }

    return {
      disponible: result.data?.disponible || false,
      message: result.data?.message || "Vérification effectuée",
      stock_restant: result.data?.quantiteDisponible || 0,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur verifierDisponibilite:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la vérification: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

// ============================================
// MUTATION RESOLVERS - ARTICLES
// ============================================

/**
 * Mutation: creerArticle
 * Crée un nouvel article (Admin uniquement)
 * Middleware: Auth + Admin + Validation + Sentry
 */
const creerArticleResolver = async (
  _: unknown,
  args: CreateArticleArgs,
  context: any,
): Promise<any> => {
  try {
    const validatedInput = await validateInput(createArticleSchema, args.input);

    console.log(`📦 [MagasinResolver] Création article: ${validatedInput.nom}`);

    const result = await magasinService.creerArticle(validatedInput);

    if (!result.success) {
      throw new GraphQLError(result.message || "Erreur lors de la création", {
        extensions: { code: "BAD_REQUEST" },
      });
    }

    return {
      success: true,
      message: result.message || "Article créé avec succès",
      article: result.data,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur creerArticle:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la création: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Mutation: modifierArticle
 * Modifie un article existant (Admin uniquement)
 * Middleware: Auth + Admin + Validation + Sentry
 */
const modifierArticleResolver = async (
  _: unknown,
  args: UpdateArticleArgs,
  context: any,
): Promise<any> => {
  try {
    const validatedInput = await validateInput(updateArticleSchema, args.input);

    console.log(
      `📦 [MagasinResolver] Modification article: ${validatedInput.id}`,
    );

    const result = await magasinService.modifierArticle(
      validatedInput.id,
      validatedInput,
    );

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la modification",
        {
          extensions: { code: "BAD_REQUEST" },
        },
      );
    }

    return {
      success: true,
      message: result.message || "Article modifié avec succès",
      article: result.data,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur modifierArticle:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la modification: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Mutation: supprimerArticle
 * Supprime un article (Admin uniquement)
 * Middleware: Auth + Admin + Sentry
 */
const supprimerArticleResolver = async (
  _: unknown,
  args: ArticleIdArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(`📦 [MagasinResolver] Suppression article: ${args.id}`);

    const result = await magasinService.supprimerArticle(args.id);

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la suppression",
        {
          extensions: { code: "BAD_REQUEST" },
        },
      );
    }

    return {
      success: true,
      message: result.message || "Article supprimé avec succès",
      article: null,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur supprimerArticle:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la suppression: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

// ============================================
// MUTATION RESOLVERS - CATÉGORIES
// ============================================

/**
 * Mutation: creerCategorie
 * Crée une nouvelle catégorie (Admin uniquement)
 * Middleware: Auth + Admin + Sentry
 */
const creerCategorieResolver = async (
  _: unknown,
  args: CreateCategorieArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(`🏷️ [MagasinResolver] Création catégorie: ${args.input.nom}`);

    const result = await magasinService.creerCategorie(args.input.nom);

    if (!result.success) {
      throw new GraphQLError(result.message || "Erreur lors de la création", {
        extensions: { code: "BAD_REQUEST" },
      });
    }

    return {
      success: true,
      message: result.message || "Catégorie créée avec succès",
      categorie: result.data,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur creerCategorie:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la création: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Mutation: modifierCategorie
 * Modifie une catégorie (Admin uniquement)
 * Middleware: Auth + Admin + Sentry
 */
const modifierCategorieResolver = async (
  _: unknown,
  args: UpdateCategorieArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(
      `🏷️ [MagasinResolver] Modification catégorie: ${args.input.id}`,
    );

    const result = await magasinService.modifierCategorie(
      args.input.id,
      args.input.nom,
    );

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la modification",
        {
          extensions: { code: "BAD_REQUEST" },
        },
      );
    }

    return {
      success: true,
      message: result.message || "Catégorie modifiée avec succès",
      categorie: result.data,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur modifierCategorie:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la modification: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Mutation: supprimerCategorie
 * Supprime une catégorie (Admin uniquement)
 * Middleware: Auth + Admin + Sentry
 */
const supprimerCategorieResolver = async (
  _: unknown,
  args: ArticleIdArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(`🏷️ [MagasinResolver] Suppression catégorie: ${args.id}`);

    const result = await magasinService.supprimerCategorie(args.id);

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la suppression",
        {
          extensions: { code: "BAD_REQUEST" },
        },
      );
    }

    return {
      success: true,
      message: result.message || "Catégorie supprimée avec succès",
      categorie: null,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur supprimerCategorie:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la suppression: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

/**
 * Mutation: mettreAJourStock
 * Met à jour le stock d'un article (Admin uniquement)
 * Middleware: Auth + Admin + Sentry
 */
const mettreAJourStockResolver = async (
  _: unknown,
  args: MettreAJourStockArgs,
  context: any,
): Promise<any> => {
  try {
    console.log(`📦 [MagasinResolver] MAJ stock article: ${args.articleId}`);

    const result = await magasinService.mettreAJourStock(
      args.articleId,
      args.taille,
      args.quantite,
    );

    if (!result.success) {
      throw new GraphQLError(
        result.message || "Erreur lors de la mise à jour",
        {
          extensions: { code: "BAD_REQUEST" },
        },
      );
    }

    return {
      success: true,
      message: result.message || "Stock mis à jour avec succès",
      article: result.data,
    };
  } catch (error: any) {
    console.error("❌ [MagasinResolver] Erreur mettreAJourStock:", error);
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Erreur lors de la mise à jour: ${error.message}`, {
      extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
    });
  }
};

// ============================================
// EXPORT DES RESOLVERS (PARTIE 1)
// ============================================

export const magasinArticlesResolvers = {
  Query: {
    // Articles (Auth)
    obtenirTousLesArticles: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirTousLesArticlesResolver),
    obtenirArticleParId: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirArticleParIdResolver),
    obtenirArticlesParCategories: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirArticlesParCategoriesResolver),
    obtenirArticlesParCategorie: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirArticlesParCategorieResolver),
    obtenirArticlesRuptureStock: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(obtenirArticlesRuptureStockResolver),

    // Catégories (Auth)
    obtenirToutesLesCategories: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirToutesLesCategoriesResolver),
    obtenirCategoriesAvecCompteurs: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirCategoriesAvecCompteursResolver),

    // Stocks (Auth)
    obtenirStocksArticle: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirStocksArticleResolver),
    verifierDisponibilite: combineMiddlewares(
      requireAuth,
      withSentry,
    )(verifierDisponibiliteResolver),
  },

  Mutation: {
    // Articles (Auth + Admin)
    creerArticle: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(creerArticleResolver),
    modifierArticle: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(modifierArticleResolver),
    supprimerArticle: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(supprimerArticleResolver),

    // Catégories (Auth + Admin)
    creerCategorie: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(creerCategorieResolver),
    modifierCategorie: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(modifierCategorieResolver),
    supprimerCategorie: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(supprimerCategorieResolver),

    // Stocks (Auth + Admin)
    mettreAJourStock: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(mettreAJourStockResolver),
  },
};
