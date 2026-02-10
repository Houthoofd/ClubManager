/**
 * Resolvers GraphQL pour le module Stocks
 * Gestion des stocks, alertes et mises à jour
 */

import { GraphQLError } from "graphql";
import { z } from "zod";
import {
  requireAuth,
  requireAdmin,
  withSentry,
  combineMiddlewares,
} from "../../../../shared/middleware/index.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";
import {
  articleIdGraphQLSchema,
  alerteParamsGraphQLSchema,
  stockUpdateSchema,
} from "@clubmanager/types/validators";
import {
  obtenirStocks,
  obtenirStockParArticle,
  obtenirAlertesStock,
  mettreAJourStock,
  verifierSanteService,
} from "../services/stocks.service.js";

/**
 * Context GraphQL avec utilisateur authentifié
 */
interface GraphQLContext {
  user?: {
    id: number;
    email: string;
    role_id: number;
  };
}

/**
 * Queries pour les stocks
 */
export const stocksQueries = {
  /**
   * Récupérer tous les stocks
   * Accessible aux administrateurs uniquement
   */
  stocks: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log("📦 [GraphQL Query] stocks - Récupération de tous les stocks");

    try {
      const stocks = await obtenirStocks();

      console.log(`✅ [GraphQL Query] ${stocks.length} stocks récupérés`);

      return {
        success: true,
        message: `${stocks.length} stock(s) récupéré(s)`,
        data: stocks,
      };
    } catch (error) {
      console.error("❌ [GraphQL Query] Erreur récupération stocks:", error);

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des stocks",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Récupérer le stock d'un article spécifique
   * Accessible aux administrateurs uniquement
   */
  stockParArticle: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, args: { articleId: number }, context: GraphQLContext) => {
    console.log(
      `📦 [GraphQL Query] stockParArticle - Récupération stock article ${args.articleId}`,
    );

    try {
      // Validation de l'ID
      const validatedData = articleIdGraphQLSchema.parse(args);

      const stocks = await obtenirStockParArticle(validatedData.articleId);

      console.log(
        `✅ [GraphQL Query] ${stocks.length} stock(s) récupéré(s) pour l'article ${validatedData.articleId}`,
      );

      return {
        success: true,
        message: `${stocks.length} stock(s) trouvé(s) pour l'article ${validatedData.articleId}`,
        data: stocks,
      };
    } catch (error) {
      console.error(
        `❌ [GraphQL Query] Erreur récupération stock article ${args.articleId}:`,
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "ID article invalide",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur serveur lors de la récupération du stock",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Récupérer les alertes de stock (stocks bas)
   * Accessible aux administrateurs uniquement
   */
  alertesStock: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, args: { seuil?: number }, context: GraphQLContext) => {
    console.log(
      `⚠️ [GraphQL Query] alertesStock - Récupération alertes stock (seuil: ${args.seuil || 5})`,
    );

    try {
      // Validation des paramètres
      const validatedData = alerteParamsGraphQLSchema.parse(args);
      const seuil = validatedData.seuil ?? 5;

      const alertes = await obtenirAlertesStock(seuil);

      console.log(
        `✅ [GraphQL Query] ${alertes.length} alerte(s) de stock récupérée(s)`,
      );

      return {
        success: true,
        message: `${alertes.length} alerte(s) de stock trouvée(s)`,
        data: alertes,
        count: alertes.length,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération alertes stock:",
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Paramètres invalides",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des alertes de stock",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Récupérer les statistiques de stock
   * Accessible aux administrateurs uniquement
   */
  statistiquesStock: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] statistiquesStock - Récupération statistiques stock",
    );

    try {
      const stocks = await obtenirStocks();

      // Calculer les statistiques
      const totalArticles = stocks.length;
      const stockTotal = stocks.reduce(
        (sum, stock) => sum + (stock.quantite || 0),
        0,
      );
      const alertes = await obtenirAlertesStock(5);
      const alertesCount = alertes.length;
      const valeurTotale = stocks.reduce(
        (sum, stock) =>
          sum + (stock.quantite || 0) * (stock.article_prix || 0),
        0,
      );

      const data = {
        totalArticles,
        stockTotal,
        alertesCount,
        valeurTotale,
      };

      console.log("✅ [GraphQL Query] Statistiques stock récupérées");

      return {
        success: true,
        message: "Statistiques de stock récupérées avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération statistiques stock:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des statistiques de stock",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Health check du service stocks
   * Accessible aux administrateurs uniquement
   */
  stocksHealth: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log("🏥 [GraphQL Query] stocksHealth - Vérification santé service");

    try {
      const healthData = await verifierSanteService();

      console.log(
        `✅ [GraphQL Query] Health check complété: ${healthData.status}`,
      );

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      console.error("❌ [GraphQL Query] Erreur health check:", error);

      throw new InternalServerError(
        "Erreur serveur lors de la vérification de santé",
        error instanceof Error ? error : undefined,
      );
    }
  }),
};

/**
 * Mutations pour les stocks
 */
export const stocksMutations = {
  /**
   * Mettre à jour un stock
   * Accessible aux administrateurs uniquement
   */
  mettreAJourStock: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      args: {
        input: { article_id: number; quantite: number; operation: string };
      },
      context: GraphQLContext,
    ) => {
      console.log(
        "🔄 [GraphQL Mutation] mettreAJourStock - Mise à jour stock",
      );

      try {
        const { article_id, quantite, operation } = args.input;

        console.log(
          `📋 [GraphQL Mutation] Article ${article_id}: ${operation} ${quantite}`,
        );

        // Validation avec Zod
        const validatedData = stockUpdateSchema.parse({
          article_id,
          quantite,
          operation,
        });

        // Mettre à jour le stock
        const result = await mettreAJourStock(validatedData);

        console.log(
          `📊 [GraphQL Mutation] Résultat mise à jour: ${result.success}`,
        );

        if (!result.success) {
          throw new NotFoundError(result.message);
        }

        // Récupérer le stock mis à jour
        const updatedStocks = await obtenirStockParArticle(
          validatedData.article_id,
        );

        return {
          success: true,
          message: result.message,
          data: updatedStocks[0] || null,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Mutation] Erreur mise à jour stock:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Données invalides",
            formatZodErrors(error.errors),
          );
        }

        if (error instanceof NotFoundError) {
          throw error;
        }

        throw new InternalServerError(
          "Erreur serveur lors de la mise à jour du stock",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),
};

/**
 * Resolvers combinés pour export
 */
export const stocksResolvers = {
  Query: stocksQueries,
  Mutation: stocksMutations,
};
