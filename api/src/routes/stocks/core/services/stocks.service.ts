/**
 * Service Stocks - Logique métier
 * Gère la récupération et la mise à jour des stocks
 */

import {
  Stocks,
  StockData,
  StockUpdateData,
} from "../../../../db/clients/stocks/stocks.js";

/**
 * Récupérer tous les stocks
 */
export async function obtenirStocks(
  stocksClient?: Stocks,
): Promise<StockData[]> {
  const client = stocksClient || new Stocks();

  console.log(`📦 [Service Stocks] Récupération de tous les stocks`);

  try {
    const stocks = await client.obtenirTousLesStocks();

    if (!stocks || stocks.length === 0) {
      console.log(`⚠️ [Service Stocks] Aucun stock trouvé`);
      return [];
    }

    console.log(`✅ [Service Stocks] ${stocks.length} stocks récupérés`);

    return stocks;
  } catch (error) {
    console.error(`❌ [Service Stocks] Erreur récupération stocks:`, error);
    // Propager l'erreur originale pour préserver le message d'erreur
    throw error;
  }
}

/**
 * Récupérer les stocks d'un article spécifique
 */
export async function obtenirStockParArticle(
  articleId: number,
  stocksClient?: Stocks,
): Promise<StockData[]> {
  const client = stocksClient || new Stocks();

  console.log(`📦 [Service Stocks] Récupération stock article ${articleId}`);

  try {
    const stocks = await client.obtenirStockParArticle(articleId);

    if (!stocks || stocks.length === 0) {
      console.log(
        `⚠️ [Service Stocks] Aucun stock trouvé pour l'article ${articleId}`,
      );
      return [];
    }

    console.log(
      `✅ [Service Stocks] ${stocks.length} stock(s) récupéré(s) pour l'article ${articleId}`,
    );

    return stocks;
  } catch (error) {
    console.error(
      `❌ [Service Stocks] Erreur récupération stock article ${articleId}:`,
      error,
    );
    // Propager l'erreur originale pour préserver le message d'erreur
    throw error;
  }
}

/**
 * Mettre à jour un stock
 */
export async function mettreAJourStock(
  updateData: StockUpdateData,
  stocksClient?: Stocks,
): Promise<{ success: boolean; message: string }> {
  const client = stocksClient || new Stocks();

  const { article_id, quantite, operation = "set" } = updateData;

  console.log(
    `🔄 [Service Stocks] Mise à jour stock article ${article_id}: ${operation} ${quantite}`,
  );

  try {
    let result: { affectedRows: number };

    switch (operation) {
      case "set":
        result = await client.mettreAJourStock(article_id, quantite);
        break;
      case "add":
        result = await client.ajouterAuStock(article_id, quantite);
        break;
      case "subtract":
        result = await client.soustraireStock(article_id, quantite);
        break;
      default:
        throw new Error(`Opération invalide: ${operation}`);
    }

    if (result.affectedRows === 0) {
      console.log(
        `⚠️ [Service Stocks] Aucun stock trouvé pour l'article ${article_id}`,
      );
      return {
        success: false,
        message: "Stock non trouvé pour cet article",
      };
    }

    console.log(
      `✅ [Service Stocks] Stock mis à jour pour l'article ${article_id}`,
    );

    return {
      success: true,
      message: "Stock mis à jour avec succès",
    };
  } catch (error) {
    console.error(
      `❌ [Service Stocks] Erreur mise à jour stock article ${article_id}:`,
      error,
    );
    // Propager l'erreur originale pour préserver le message d'erreur
    throw error;
  }
}

/**
 * Récupérer les alertes de stock (stocks bas)
 */
export async function obtenirAlertesStock(
  seuil: number = 5,
  stocksClient?: Stocks,
): Promise<StockData[]> {
  const client = stocksClient || new Stocks();

  console.log(
    `⚠️ [Service Stocks] Récupération alertes stock (seuil: ${seuil})`,
  );

  try {
    const alertes = await client.obtenirAlertesStock(seuil);

    console.log(
      `✅ [Service Stocks] ${alertes.length} alerte(s) de stock récupérée(s)`,
    );

    return alertes;
  } catch (error) {
    console.error(`❌ [Service Stocks] Erreur récupération alertes:`, error);
    // Propager l'erreur originale pour préserver le message d'erreur
    throw error;
  }
}

/**
 * Vérifier la santé du service stocks
 */
export async function verifierSanteService(stocksClient?: Stocks): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    stocks: boolean;
    alertes: boolean;
  };
  message: string;
}> {
  const client = stocksClient || new Stocks();

  console.log(`🏥 [Service Stocks] Vérification de santé`);

  const checks = {
    stocks: false,
    alertes: false,
  };

  try {
    // Vérifier chaque endpoint
    const [stocksTest, alertesTest] = await Promise.allSettled([
      client.obtenirTousLesStocks(),
      client.obtenirAlertesStock(5),
    ]);

    checks.stocks = stocksTest.status === "fulfilled";
    checks.alertes = alertesTest.status === "fulfilled";

    const healthyCount = Object.values(checks).filter(Boolean).length;

    if (healthyCount === 2) {
      return {
        status: "healthy",
        checks,
        message: "Tous les services sont opérationnels",
      };
    } else if (healthyCount === 1) {
      return {
        status: "degraded",
        checks,
        message: `${healthyCount}/2 services opérationnels`,
      };
    } else {
      return {
        status: "unhealthy",
        checks,
        message: "Services non opérationnels",
      };
    }
  } catch (error) {
    console.error(`❌ [Service Stocks] Erreur vérification santé:`, error);
    return {
      status: "unhealthy",
      checks,
      message: "Erreur lors de la vérification de santé",
    };
  }
}
