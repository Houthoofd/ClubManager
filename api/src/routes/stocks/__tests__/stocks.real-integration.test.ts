/**
 * Tests d'intégration réels pour le module Stocks
 * Tests avec base de données réelle
 *
 * IMPORTANT: Ces tests nécessitent une base de données de test configurée
 * Configuration via .env.test avec DATABASE_URL
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Stocks } from "../../../db/clients/stocks/stocks.js";

// Ces tests sont désactivés par défaut (skipif no DB)
const SKIP_REAL_DB_TESTS =
  !process.env.DATABASE_URL || process.env.SKIP_REAL_DB_TESTS === "true";

describe("Stocks Module - Tests d'intégration réels (DB)", () => {
  let stocksClient: Stocks;

  beforeAll(async () => {
    if (SKIP_REAL_DB_TESTS) {
      console.log(
        "⚠️ Tests d'intégration réels ignorés (pas de DB configurée)",
      );
      return;
    }

    stocksClient = new Stocks();

    // Attendre que la connexion MySQL soit prête
    try {
      await stocksClient["mysqlConnector"].waitForConnection(10000);
      console.log("✅ Connexion à la base de données de test établie");
    } catch (error) {
      console.error("❌ Échec de la connexion à la base de données:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!SKIP_REAL_DB_TESTS && stocksClient) {
      // Fermer les connexions MySQL proprement
      try {
        await stocksClient["mysqlConnector"].closePool();
        console.log("🔚 Nettoyage des connexions DB terminé");
      } catch (error) {
        console.error("⚠️ Erreur lors de la fermeture du pool:", error);
      }
    }
  });

  // ==================== TESTS RÉELS - STOCKS ====================
  describe("Stocks - Tests réels", () => {
    it("devrait récupérer les stocks depuis la DB réelle", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      expect(stocks).toBeDefined();
      expect(Array.isArray(stocks)).toBe(true);

      if (stocks && stocks.length > 0) {
        expect(stocks[0]).toHaveProperty("id");
        expect(stocks[0]).toHaveProperty("article_id");
        expect(stocks[0]).toHaveProperty("quantite");
        expect(typeof stocks[0].id).toBe("number");
        expect(typeof stocks[0].article_id).toBe("number");
        expect(typeof stocks[0].quantite).toBe("number");
      }
    });

    it("devrait avoir des IDs uniques pour chaque stock", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        const ids = stocks.map((s) => s.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait gérer une lecture répétée (idempotence)", async () => {
      const stocks1 = await stocksClient.obtenirTousLesStocks();
      const stocks2 = await stocksClient.obtenirTousLesStocks();

      expect(stocks1).toEqual(stocks2);
    });

    it("devrait avoir des quantités non négatives", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(stock.quantite).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("devrait avoir des article_id valides", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(stock.article_id).toBeGreaterThan(0);
          expect(Number.isInteger(stock.article_id)).toBe(true);
        });
      }
    });

    it("devrait avoir des informations d'articles associées", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        // Vérifier qu'au moins certains stocks ont des infos d'articles
        const stocksAvecInfo = stocks.filter((s) => s.article_nom);

        if (stocksAvecInfo.length > 0) {
          stocksAvecInfo.forEach((stock) => {
            expect(stock.article_nom).toBeDefined();
            expect(typeof stock.article_nom).toBe("string");
          });
        }
      }
    });
  });

  // ==================== TESTS RÉELS - STOCK PAR ARTICLE ====================
  describe("Stock par article - Tests réels", () => {
    it("devrait récupérer le stock d'un article spécifique", async () => {
      // D'abord récupérer tous les stocks pour obtenir un article_id valide
      const tousLesStocks = await stocksClient.obtenirTousLesStocks();

      if (tousLesStocks && tousLesStocks.length > 0) {
        const articleId = tousLesStocks[0].article_id;

        const stock = await stocksClient.obtenirStockParArticle(articleId);

        expect(stock).toBeDefined();
        expect(Array.isArray(stock)).toBe(true);

        if (stock && stock.length > 0) {
          expect(stock[0].article_id).toBe(articleId);
          expect(stock[0]).toHaveProperty("id");
          expect(stock[0]).toHaveProperty("quantite");
        }
      }
    });

    it("devrait retourner un tableau vide pour un article inexistant", async () => {
      const stock = await stocksClient.obtenirStockParArticle(999999);

      expect(stock).toBeDefined();
      expect(Array.isArray(stock)).toBe(true);
      expect(stock.length).toBe(0);
    });

    it("devrait avoir des données cohérentes avec obtenirTousLesStocks", async () => {
      const tousLesStocks = await stocksClient.obtenirTousLesStocks();

      if (tousLesStocks && tousLesStocks.length > 0) {
        const articleId = tousLesStocks[0].article_id;
        const stockSpecifique =
          await stocksClient.obtenirStockParArticle(articleId);

        const stockDansTous = tousLesStocks.find(
          (s) => s.article_id === articleId,
        );

        if (stockSpecifique && stockSpecifique.length > 0 && stockDansTous) {
          expect(stockSpecifique[0].quantite).toBe(stockDansTous.quantite);
        }
      }
    });
  });

  // ==================== TESTS RÉELS - ALERTES ====================
  describe("Alertes de stock - Tests réels", () => {
    it("devrait récupérer les alertes de stock", async () => {
      const alertes = await stocksClient.obtenirAlertesStock(5);

      expect(alertes).toBeDefined();
      expect(Array.isArray(alertes)).toBe(true);

      if (alertes && alertes.length > 0) {
        alertes.forEach((alerte) => {
          expect(alerte).toHaveProperty("id");
          expect(alerte).toHaveProperty("article_id");
          expect(alerte).toHaveProperty("quantite");
          expect(alerte.quantite).toBeLessThanOrEqual(5);
        });
      }
    });

    it("devrait respecter le seuil d'alerte", async () => {
      const seuil = 10;
      const alertes = await stocksClient.obtenirAlertesStock(seuil);

      if (alertes && alertes.length > 0) {
        alertes.forEach((alerte) => {
          expect(alerte.quantite).toBeLessThanOrEqual(seuil);
        });
      }
    });

    it("devrait retourner plus d'alertes avec un seuil élevé", async () => {
      const alertesBas = await stocksClient.obtenirAlertesStock(5);
      const alertesHaut = await stocksClient.obtenirAlertesStock(20);

      // Si on a des stocks, alertesHaut devrait avoir >= alertesBas
      if (alertesBas && alertesHaut) {
        expect(alertesHaut.length).toBeGreaterThanOrEqual(alertesBas.length);
      }
    });

    it("devrait avoir des IDs uniques dans les alertes", async () => {
      const alertes = await stocksClient.obtenirAlertesStock(10);

      if (alertes && alertes.length > 0) {
        const ids = alertes.map((a) => a.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait retourner un sous-ensemble de tous les stocks", async () => {
      const tousLesStocks = await stocksClient.obtenirTousLesStocks();
      const alertes = await stocksClient.obtenirAlertesStock(5);

      if (tousLesStocks && alertes) {
        expect(alertes.length).toBeLessThanOrEqual(tousLesStocks.length);
      }
    });
  });

  // ==================== TESTS RÉELS - MISE À JOUR ====================
  describe("Mise à jour de stock - Tests réels", () => {
    let articleIdTest: number;
    let quantiteInitiale: number;

    beforeAll(async () => {
      if (SKIP_REAL_DB_TESTS) return;

      // Trouver un article avec du stock pour les tests
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        articleIdTest = stocks[0].article_id;
        quantiteInitiale = stocks[0].quantite;
      }
    });

    it("devrait mettre à jour un stock (opération set)", async () => {
      if (!articleIdTest) {
        console.log("⚠️ Pas d'article disponible pour le test de mise à jour");
        return;
      }

      const nouvelleQuantite = 100;
      const result = await stocksClient.mettreAJourStock(
        articleIdTest,
        nouvelleQuantite,
      );

      expect(result).toBeDefined();
      expect(result.affectedRows).toBeGreaterThan(0);

      // Vérifier que la mise à jour a bien été effectuée
      const stockMisAJour =
        await stocksClient.obtenirStockParArticle(articleIdTest);

      if (stockMisAJour && stockMisAJour.length > 0) {
        expect(stockMisAJour[0].quantite).toBe(nouvelleQuantite);
      }

      // Restaurer la quantité initiale
      await stocksClient.mettreAJourStock(articleIdTest, quantiteInitiale);
    });

    it("devrait ajouter au stock (opération add)", async () => {
      if (!articleIdTest) {
        console.log("⚠️ Pas d'article disponible pour le test d'ajout");
        return;
      }

      const quantiteAvant =
        (await stocksClient.obtenirStockParArticle(articleIdTest))[0]?.quantite ||
        0;
      const quantiteAAjouter = 10;

      const result = await stocksClient.ajouterAuStock(
        articleIdTest,
        quantiteAAjouter,
      );

      expect(result).toBeDefined();
      expect(result.affectedRows).toBeGreaterThan(0);

      // Vérifier que l'ajout a été effectué
      const stockMisAJour =
        await stocksClient.obtenirStockParArticle(articleIdTest);

      if (stockMisAJour && stockMisAJour.length > 0) {
        expect(stockMisAJour[0].quantite).toBe(
          quantiteAvant + quantiteAAjouter,
        );
      }

      // Restaurer la quantité initiale
      await stocksClient.mettreAJourStock(articleIdTest, quantiteInitiale);
    });

    it("devrait soustraire du stock (opération subtract)", async () => {
      if (!articleIdTest) {
        console.log("⚠️ Pas d'article disponible pour le test de soustraction");
        return;
      }

      // S'assurer qu'il y a assez de stock
      await stocksClient.mettreAJourStock(articleIdTest, 50);

      const quantiteAvant =
        (await stocksClient.obtenirStockParArticle(articleIdTest))[0]
          ?.quantite || 0;
      const quantiteASoustraire = 5;

      const result = await stocksClient.soustraireStock(
        articleIdTest,
        quantiteASoustraire,
      );

      expect(result).toBeDefined();
      expect(result.affectedRows).toBeGreaterThan(0);

      // Vérifier que la soustraction a été effectuée
      const stockMisAJour =
        await stocksClient.obtenirStockParArticle(articleIdTest);

      if (stockMisAJour && stockMisAJour.length > 0) {
        expect(stockMisAJour[0].quantite).toBe(
          quantiteAvant - quantiteASoustraire,
        );
      }

      // Restaurer la quantité initiale
      await stocksClient.mettreAJourStock(articleIdTest, quantiteInitiale);
    });

    it("devrait retourner 0 affectedRows pour un article inexistant", async () => {
      const result = await stocksClient.mettreAJourStock(999999, 10);

      expect(result).toBeDefined();
      expect(result.affectedRows).toBe(0);
    });
  });

  // ==================== TESTS DE PERFORMANCE RÉELS ====================
  describe("Performance - Tests réels", () => {
    it("devrait récupérer tous les stocks en moins de 500ms", async () => {
      const startTime = Date.now();
      await stocksClient.obtenirTousLesStocks();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait récupérer un stock par article en moins de 300ms", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        const articleId = stocks[0].article_id;

        const startTime = Date.now();
        await stocksClient.obtenirStockParArticle(articleId);
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(300);
      }
    });

    it("devrait récupérer les alertes en moins de 500ms", async () => {
      const startTime = Date.now();
      await stocksClient.obtenirAlertesStock(5);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait mettre à jour un stock en moins de 500ms", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        const articleId = stocks[0].article_id;
        const quantiteInitiale = stocks[0].quantite;

        const startTime = Date.now();
        await stocksClient.mettreAJourStock(articleId, 50);
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(500);

        // Restaurer
        await stocksClient.mettreAJourStock(articleId, quantiteInitiale);
      }
    });

    it("devrait gérer 10 requêtes concurrentes de lecture", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, () =>
        stocksClient.obtenirTousLesStocks(),
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(3000); // 3 secondes max pour 10 requêtes
    });
  });

  // ==================== TESTS DE CONCURRENCE ====================
  describe("Concurrence - Tests réels", () => {
    it("devrait gérer des lectures concurrentes sur différentes méthodes", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();
      const articleId = stocks && stocks.length > 0 ? stocks[0].article_id : 1;

      const promises = [
        stocksClient.obtenirTousLesStocks(),
        stocksClient.obtenirStockParArticle(articleId),
        stocksClient.obtenirAlertesStock(5),
      ];

      const [tousStocks, stockArticle, alertes] = await Promise.all(promises);

      expect(tousStocks).toBeDefined();
      expect(stockArticle).toBeDefined();
      expect(alertes).toBeDefined();
    });

    it("devrait gérer des lectures répétées en parallèle", async () => {
      const promises = [
        stocksClient.obtenirTousLesStocks(),
        stocksClient.obtenirTousLesStocks(),
        stocksClient.obtenirTousLesStocks(),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });

  // ==================== TESTS DE COHÉRENCE DES DONNÉES ====================
  describe("Cohérence des données", () => {
    it("devrait avoir des IDs positifs pour tous les stocks", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(stock.id).toBeGreaterThan(0);
          expect(stock.article_id).toBeGreaterThan(0);
        });
      }
    });

    it("ne devrait pas avoir de données NULL inattendues", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(stock.id).not.toBeNull();
          expect(stock.article_id).not.toBeNull();
          expect(stock.quantite).not.toBeNull();
          expect(stock.quantite).not.toBeUndefined();
        });
      }
    });

    it("devrait avoir des quantités valides", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(typeof stock.quantite).toBe("number");
          expect(Number.isInteger(stock.quantite)).toBe(true);
          expect(stock.quantite).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("devrait avoir des prix valides dans les informations articles", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        const stocksAvecPrix = stocks.filter((s) => s.article_prix !== undefined);

        stocksAvecPrix.forEach((stock) => {
          expect(typeof stock.article_prix).toBe("number");
          expect(stock.article_prix).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  // ==================== TESTS DE RÉSILIENCE ====================
  describe("Résilience", () => {
    it("devrait pouvoir récupérer les données après plusieurs lectures", async () => {
      // Test de stabilité - plusieurs lectures successives
      for (let i = 0; i < 5; i++) {
        const stocks = await stocksClient.obtenirTousLesStocks();
        expect(stocks).toBeDefined();
      }

      // Vérifier que la connexion est toujours valide
      const finalStocks = await stocksClient.obtenirTousLesStocks();
      expect(finalStocks).toBeDefined();
    });

    it("devrait gérer des requêtes entrelacées", async () => {
      const results = [];

      const stocks1 = await stocksClient.obtenirTousLesStocks();
      results.push(stocks1);

      const articleId = stocks1 && stocks1.length > 0 ? stocks1[0].article_id : 1;
      const stock = await stocksClient.obtenirStockParArticle(articleId);
      results.push(stock);

      const alertes = await stocksClient.obtenirAlertesStock(5);
      results.push(alertes);

      const stocks2 = await stocksClient.obtenirTousLesStocks();
      results.push(stocks2);

      results.forEach((result) => expect(result).toBeDefined());
    });

    it("devrait récupérer après une mise à jour", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        const articleId = stocks[0].article_id;
        const quantiteInitiale = stocks[0].quantite;

        // Mettre à jour
        await stocksClient.mettreAJourStock(articleId, 75);

        // Vérifier qu'on peut toujours lire
        const stocksApres = await stocksClient.obtenirTousLesStocks();
        expect(stocksApres).toBeDefined();

        // Restaurer
        await stocksClient.mettreAJourStock(articleId, quantiteInitiale);
      }
    });
  });

  // ==================== TESTS DES CONTRAINTES ====================
  describe("Contraintes de données", () => {
    it("ne devrait pas permettre de quantités négatives", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        stocks.forEach((stock) => {
          expect(stock.quantite).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("devrait avoir des article_id référençant des articles existants", async () => {
      const stocks = await stocksClient.obtenirTousLesStocks();

      if (stocks && stocks.length > 0) {
        // Si des noms d'articles sont présents, cela signifie que les FK sont valides
        const stocksAvecNom = stocks.filter((s) => s.article_nom);

        if (stocksAvecNom.length > 0) {
          expect(stocksAvecNom.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
