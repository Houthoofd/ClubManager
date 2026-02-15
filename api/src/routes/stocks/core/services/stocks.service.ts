/**
 * Service Stocks - Logique métier
 * Gère la récupération et la mise à jour des stocks
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module stocks.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Interface pour les données de stock
 */
export interface StockData {
  id: number;
  article_id: number;
  quantite: number;
  seuil_alerte?: number;
  derniere_mise_a_jour?: Date;
  article?: {
    nom: string;
    prix: number;
    description?: string;
  };
}

/**
 * Interface pour la mise à jour de stock
 */
export interface StockUpdateData {
  article_id: number;
  quantite: number;
  operation?: "set" | "add" | "subtract";
}

/**
 * Récupérer tous les stocks
 */
export async function obtenirStocks(): Promise<StockData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération de tous les stocks",
      "service.stocks",
      "info",
    );

    console.log(`📦 [StocksService] Récupération de tous les stocks`);

    const stocks = await prisma.stocks.findMany({
      include: {
        articles: {
          select: {
            nom: true,
            prix: true,
            description: true,
          },
        },
      },
      orderBy: {
        articles: {
          nom: "asc",
        },
      },
    });

    console.log(`✅ [StocksService] ${stocks.length} stocks récupérés`);

    return stocks.map((stock) => ({
      id: stock.id,
      article_id: stock.article_id,
      quantite: stock.quantite,
      stock_disponible: stock.stock_disponible,
      // Note: seuil_alerte and derniere_mise_a_jour don't exist in schema
      article: stock.articles
        ? {
            nom: stock.articles.nom,
            prix: Number(stock.articles.prix),
            description: stock.articles.description || undefined,
          }
        : undefined,
    }));
  } catch (error: any) {
    console.error(`❌ [StocksService] Erreur récupération stocks:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "obtenirStocks",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des stocks: ${error.message}`,
    );
  }
}

/**
 * Récupérer les stocks d'un article spécifique
 */
export async function obtenirStockParArticle(
  articleId: number,
): Promise<StockData[]> {
  try {
    addSentryBreadcrumb(
      `Récupération stock article ${articleId}`,
      "service.stocks",
      "info",
      { articleId },
    );

    console.log(`📦 [StocksService] Récupération stock article ${articleId}`);

    const stocks = await prisma.stocks.findMany({
      where: {
        article_id: articleId,
      },
      include: {
        articles: {
          select: {
            nom: true,
            prix: true,
            description: true,
          },
        },
      },
    });

    if (stocks.length === 0) {
      console.log(
        `⚠️ [StocksService] Aucun stock trouvé pour l'article ${articleId}`,
      );
      return [];
    }

    console.log(
      `✅ [StocksService] ${stocks.length} stock(s) récupéré(s) pour l'article ${articleId}`,
    );

    return stocks.map((stock) => ({
      id: stock.id,
      article_id: stock.article_id,
      quantite: stock.quantite,
      stock_disponible: stock.stock_disponible,
      // Note: seuil_alerte and derniere_mise_a_jour don't exist in schema
      article: stock.articles
        ? {
            nom: stock.articles.nom,
            prix: Number(stock.articles.prix),
            description: stock.articles.description || undefined,
          }
        : undefined,
    }));
  } catch (error: any) {
    console.error(
      `❌ [StocksService] Erreur récupération stock article ${articleId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "obtenirStockParArticle",
      },
      extra: { articleId },
    });

    throw new Error(
      `Erreur lors de la récupération du stock de l'article ${articleId}: ${error.message}`,
    );
  }
}

/**
 * Mettre à jour un stock
 */
export async function mettreAJourStock(
  updateData: StockUpdateData,
): Promise<{ success: boolean; message: string; nouveauStock?: number }> {
  try {
    const { article_id, quantite, operation = "set" } = updateData;

    addSentryBreadcrumb(
      `Mise à jour stock article ${article_id}: ${operation} ${quantite}`,
      "service.stocks",
      "info",
      { article_id, quantite, operation },
    );

    console.log(
      `🔄 [StocksService] Mise à jour stock article ${article_id}: ${operation} ${quantite}`,
    );

    // Vérifier que l'article existe
    const article = await prisma.articles.findUnique({
      where: { id: article_id },
    });

    if (!article) {
      console.log(`❌ [StocksService] Article ${article_id} non trouvé`);
      return {
        success: false,
        message: "Article non trouvé",
      };
    }

    // Vérifier si un stock existe pour cet article
    let stock = await prisma.stocks.findFirst({
      where: { article_id },
    });

    let nouveauStock: number;

    if (!stock) {
      // Créer un nouveau stock si inexistant
      console.log(
        `📝 [StocksService] Création d'un nouveau stock pour l'article ${article_id}`,
      );

      stock = await prisma.stocks.create({
        data: {
          article_id,
          taille_id: 1, // Default taille_id - required field
          quantite: operation === "set" ? quantite : quantite,
          stock_disponible: operation === "set" ? quantite : quantite,
        },
      });

      nouveauStock = stock.quantite;
    } else {
      // Mettre à jour le stock existant
      switch (operation) {
        case "set":
          nouveauStock = quantite;
          break;
        case "add":
          nouveauStock = stock.quantite + quantite;
          break;
        case "subtract":
          nouveauStock = Math.max(0, stock.quantite - quantite); // Ne pas descendre en dessous de 0
          break;
        default:
          throw new Error(`Opération invalide: ${operation}`);
      }

      stock = await prisma.stocks.update({
        where: { id: stock.id },
        data: {
          quantite: nouveauStock,
          stock_disponible: nouveauStock,
        },
      });
    }

    console.log(
      `✅ [StocksService] Stock mis à jour pour l'article ${article_id}: ${stock.quantite} -> ${nouveauStock}`,
    );

    addSentryBreadcrumb(
      "Stock mis à jour avec succès",
      "service.stocks",
      "info",
      { article_id, ancienStock: stock.quantite, nouveauStock },
    );

    // Vérifier si le stock est bas (seuil par défaut: 5)
    const seuilAlerte = 5;
    if (nouveauStock <= seuilAlerte) {
      console.log(
        `⚠️ [StocksService] ALERTE: Stock article ${article_id} en dessous du seuil (${nouveauStock} <= ${seuilAlerte})`,
      );

      addSentryBreadcrumb(
        `Alerte stock bas pour article ${article_id}`,
        "service.stocks",
        "warning",
        { article_id, quantite: nouveauStock, seuil: seuilAlerte },
      );
    }

    return {
      success: true,
      message: "Stock mis à jour avec succès",
      nouveauStock,
    };
  } catch (error: any) {
    console.error(
      `❌ [StocksService] Erreur mise à jour stock article ${updateData.article_id}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "mettreAJourStock",
      },
      extra: updateData,
    });

    throw new Error(`Erreur lors de la mise à jour du stock: ${error.message}`);
  }
}

/**
 * Récupérer les alertes de stock (stocks bas)
 */
export async function obtenirAlertesStock(
  seuil: number = 5,
): Promise<StockData[]> {
  try {
    addSentryBreadcrumb(
      `Récupération alertes stock (seuil: ${seuil})`,
      "service.stocks",
      "info",
      { seuil },
    );

    console.log(
      `⚠️ [StocksService] Récupération alertes stock (seuil: ${seuil})`,
    );

    const alertes = await prisma.stocks.findMany({
      where: {
        OR: [
          {
            quantite: {
              lte: seuil,
            },
          },
        ],
      },
      include: {
        articles: {
          select: {
            nom: true,
            prix: true,
            description: true,
          },
        },
      },
      orderBy: {
        quantite: "asc",
      },
    });

    console.log(
      `✅ [StocksService] ${alertes.length} alerte(s) de stock récupérée(s)`,
    );

    if (alertes.length > 0) {
      addSentryBreadcrumb(
        `${alertes.length} alerte(s) de stock détectée(s)`,
        "service.stocks",
        "warning",
        { count: alertes.length },
      );
    }

    return alertes.map((stock) => ({
      id: stock.id,
      article_id: stock.article_id,
      quantite: stock.quantite,
      article: stock.articles
        ? {
            nom: stock.articles.nom,
            prix: Number(stock.articles.prix),
            description: stock.articles.description || undefined,
          }
        : undefined,
    }));
  } catch (error: any) {
    console.error(`❌ [StocksService] Erreur récupération alertes:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "obtenirAlertesStock",
      },
      extra: { seuil },
    });

    throw new Error(
      `Erreur lors de la récupération des alertes de stock: ${error.message}`,
    );
  }
}

/**
 * Définir le seuil d'alerte pour un article
 */
export async function definirSeuilAlerte(
  articleId: number,
  seuil: number,
): Promise<{ success: boolean; message: string }> {
  try {
    addSentryBreadcrumb(
      `Définition seuil alerte article ${articleId}: ${seuil}`,
      "service.stocks",
      "info",
      { articleId, seuil },
    );

    console.log(
      `🔔 [StocksService] Définition seuil alerte article ${articleId}: ${seuil}`,
    );

    // Vérifier que le stock existe
    const stock = await prisma.stocks.findFirst({
      where: { article_id: articleId },
    });

    if (!stock) {
      console.log(
        `❌ [StocksService] Aucun stock trouvé pour l'article ${articleId}`,
      );
      return {
        success: false,
        message: "Stock non trouvé pour cet article",
      };
    }

    // Note: Le champ seuil_alerte n'existe pas dans le schéma Prisma actuel
    // Cette fonctionnalité nécessite une migration de schéma
    console.log(
      `⚠️ [StocksService] Seuil d'alerte pour l'article ${articleId}: ${seuil} (non implémenté - migration requise)`,
    );

    return {
      success: true,
      message:
        "Seuil d'alerte enregistré (migration DB requise pour persistance)",
    };
  } catch (error: any) {
    console.error(`❌ [StocksService] Erreur définition seuil alerte:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "definirSeuilAlerte",
      },
      extra: { articleId, seuil },
    });

    throw new Error(
      `Erreur lors de la définition du seuil d'alerte: ${error.message}`,
    );
  }
}

/**
 * Vérifier la santé du service stocks
 */
export async function verifierSanteService(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    stocks: boolean;
    alertes: boolean;
  };
  message: string;
  data?: {
    totalStocks: number;
    stocksBas: number;
  };
}> {
  try {
    addSentryBreadcrumb(
      "Vérification santé du service stocks",
      "service.stocks",
      "info",
    );

    console.log(`🏥 [StocksService] Vérification de santé`);

    const checks = {
      stocks: false,
      alertes: false,
    };

    // Vérifier chaque composant
    const [stocksTest, alertesTest] = await Promise.allSettled([
      prisma.stocks.findMany({ take: 1 }),
      obtenirAlertesStock(5),
    ]);

    checks.stocks = stocksTest.status === "fulfilled";
    checks.alertes = alertesTest.status === "fulfilled";

    const healthyCount = Object.values(checks).filter(Boolean).length;

    let data;
    if (checks.stocks) {
      const totalStocks = await prisma.stocks.count();
      const stocksBas = await prisma.stocks.count({
        where: {
          quantite: {
            lte: 5,
          },
        },
      });

      data = {
        totalStocks,
        stocksBas,
      };
    }

    if (healthyCount === 2) {
      console.log(`✅ [StocksService] Tous les services opérationnels`);
      return {
        status: "healthy",
        checks,
        message: "Tous les services sont opérationnels",
        data,
      };
    } else if (healthyCount === 1) {
      console.log(`⚠️ [StocksService] Services dégradés: ${healthyCount}/2`);
      return {
        status: "degraded",
        checks,
        message: `${healthyCount}/2 services opérationnels`,
        data,
      };
    } else {
      console.log(`❌ [StocksService] Services non opérationnels`);
      return {
        status: "unhealthy",
        checks,
        message: "Services non opérationnels",
      };
    }
  } catch (error: any) {
    console.error(`❌ [StocksService] Erreur vérification santé:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "stocks",
        operation: "verifierSanteService",
      },
    });

    return {
      status: "unhealthy",
      checks: {
        stocks: false,
        alertes: false,
      },
      message: "Erreur lors de la vérification de santé",
    };
  }
}
