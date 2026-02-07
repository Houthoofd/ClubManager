/**
 * Tests de couverture des branches du service Stocks
 * Couverture à 100% des branches non testées ailleurs
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Stocks } from "../../../db/clients/stocks/stocks.js";
import * as stocksService from "../core/services/stocks.service.js";

describe("Stocks Service - Tests de couverture des branches", () => {
  let mockStocksClient: Partial<Stocks>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStocksClient = {
      obtenirTousLesStocks: jest.fn(),
      obtenirStockParArticle: jest.fn(),
      mettreAJourStock: jest.fn(),
      ajouterAuStock: jest.fn(),
      soustraireStock: jest.fn(),
      obtenirAlertesStock: jest.fn(),
    };
  });

  // ==================== OBTENIR STOCKS - BRANCHES ====================
  describe("obtenirStocks - Couverture des branches", () => {
    it("devrait logger et retourner les stocks quand succès", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 1,
          quantite: 50,
          article_nom: "Kimono",
          article_prix: 89.99,
        },
        {
          id: 2,
          article_id: 2,
          quantite: 30,
          article_nom: "Ceinture",
          article_prix: 15.0,
        },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStocks(
        mockStocksClient as Stocks,
      );

      expect(result).toEqual(mockStocks);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Récupération de tous les stocks"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("2 stocks récupérés"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger un warning et retourner [] quand aucun stock", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        [],
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStocks(
        mockStocksClient as Stocks,
      );

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun stock trouvé"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger un warning quand stocks null", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        null,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStocks(
        mockStocksClient as Stocks,
      );

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun stock trouvé"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger l'erreur et lancer une exception en cas d'erreur", async () => {
      const error = new Error("Database error");

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        error,
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        stocksService.obtenirStocks(mockStocksClient as Stocks),
      ).rejects.toThrow("Database error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur récupération stocks"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== OBTENIR STOCK PAR ARTICLE - BRANCHES ====================
  describe("obtenirStockParArticle - Couverture des branches", () => {
    it("devrait logger et retourner le stock quand succès", async () => {
      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 50,
          article_nom: "Kimono",
          article_prix: 89.99,
        },
      ];

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStockParArticle(
        5,
        mockStocksClient as Stocks,
      );

      expect(result).toEqual(mockStock);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Récupération stock article 5"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("1 stock(s) récupéré(s) pour l'article 5"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger un warning et retourner [] quand aucun stock", async () => {
      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        [],
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStockParArticle(
        5,
        mockStocksClient as Stocks,
      );

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun stock trouvé pour l'article 5"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger un warning quand stock null", async () => {
      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        null,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirStockParArticle(
        10,
        mockStocksClient as Stocks,
      );

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun stock trouvé pour l'article 10"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger l'erreur et lancer une exception", async () => {
      const error = new Error("Connection error");

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        error,
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        stocksService.obtenirStockParArticle(5, mockStocksClient as Stocks),
      ).rejects.toThrow("Connection error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur récupération stock article 5"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== METTRE À JOUR STOCK - BRANCHES ====================
  describe("mettreAJourStock - Couverture des branches", () => {
    it("devrait logger et effectuer l'opération 'set'", async () => {
      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 30, operation: "set" },
        mockStocksClient as Stocks,
      );

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mise à jour stock article 5: set 30"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Stock mis à jour pour l'article 5"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger et effectuer l'opération 'add'", async () => {
      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 15, operation: "add" },
        mockStocksClient as Stocks,
      );

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mise à jour stock article 5: add 15"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger et effectuer l'opération 'subtract'", async () => {
      (mockStocksClient.soustraireStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 10, operation: "subtract" },
        mockStocksClient as Stocks,
      );

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mise à jour stock article 5: subtract 10"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait utiliser 'set' par défaut si operation non spécifiée", async () => {
      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const result = await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 30 },
        mockStocksClient as Stocks,
      );

      expect(result.success).toBe(true);
      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 30);
    });

    it("devrait retourner success: false quand affectedRows = 0", async () => {
      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 0,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.mettreAJourStock(
        { article_id: 999, quantite: 10, operation: "set" },
        mockStocksClient as Stocks,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Stock non trouvé pour cet article");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun stock trouvé pour l'article 999"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait lancer une erreur pour une opération invalide", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        stocksService.mettreAJourStock(
          { article_id: 5, quantite: 10, operation: "invalid" as any },
          mockStocksClient as Stocks,
        ),
      ).rejects.toThrow("Opération invalide: invalid");

      consoleErrorSpy.mockRestore();
    });

    it("devrait logger l'erreur et lancer une exception en cas d'erreur DB", async () => {
      const error = new Error("Database error");

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        stocksService.mettreAJourStock(
          { article_id: 5, quantite: 30, operation: "set" },
          mockStocksClient as Stocks,
        ),
      ).rejects.toThrow("Database error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur mise à jour stock article 5"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== OBTENIR ALERTES STOCK - BRANCHES ====================
  describe("obtenirAlertesStock - Couverture des branches", () => {
    it("devrait logger et retourner les alertes quand succès", async () => {
      const mockAlertes = [
        {
          id: 1,
          article_id: 1,
          quantite: 2,
          article_nom: "Ceinture Noire",
          article_prix: 15.0,
        },
        {
          id: 2,
          article_id: 3,
          quantite: 4,
          article_nom: "Protections",
          article_prix: 25.5,
        },
      ];

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirAlertesStock(
        5,
        mockStocksClient as Stocks,
      );

      expect(result).toEqual(mockAlertes);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Récupération alertes stock (seuil: 5)"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("2 alerte(s) de stock récupérée(s)"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait utiliser le seuil par défaut de 5", async () => {
      const mockAlertes = [
        { id: 1, article_id: 1, quantite: 3, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes,
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await stocksService.obtenirAlertesStock(
        undefined,
        mockStocksClient as Stocks,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("seuil: 5"),
      );
      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);

      consoleSpy.mockRestore();
    });

    it("devrait retourner un tableau vide quand aucune alerte", async () => {
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.obtenirAlertesStock(
        10,
        mockStocksClient as Stocks,
      );

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("0 alerte(s) de stock récupérée(s)"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger l'erreur et lancer une exception", async () => {
      const error = new Error("Timeout error");

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        error,
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        stocksService.obtenirAlertesStock(5, mockStocksClient as Stocks),
      ).rejects.toThrow("Timeout error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur récupération alertes"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== VERIFIER SANTE SERVICE - BRANCHES ====================
  describe("verifierSanteService - Couverture des branches", () => {
    it("devrait logger la vérification de santé", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("healthy");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Vérification de santé"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait retourner healthy quand 2/2 services OK", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("healthy");
      expect(result.message).toBe("Tous les services sont opérationnels");
      expect(result.checks.stocks).toBe(true);
      expect(result.checks.alertes).toBe(true);
    });

    it("devrait retourner degraded quand 1/2 services OK (stocks KO)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("degraded");
      expect(result.message).toBe("1/2 services opérationnels");
      expect(result.checks.stocks).toBe(false);
      expect(result.checks.alertes).toBe(true);
    });

    it("devrait retourner degraded quand 1/2 services OK (alertes KO)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("degraded");
      expect(result.message).toBe("1/2 services opérationnels");
      expect(result.checks.stocks).toBe(true);
      expect(result.checks.alertes).toBe(false);
    });

    it("devrait retourner unhealthy quand 0/2 services OK", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("unhealthy");
      expect(result.message).toBe("Services non opérationnels");
      expect(result.checks.stocks).toBe(false);
      expect(result.checks.alertes).toBe(false);
    });

    it("devrait gérer les erreurs dans le catch et retourner unhealthy", async () => {
      // Mock qui lance une erreur avant même les checks
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () => {
          throw new Error("Unexpected sync error");
        },
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await stocksService.verifierSanteService(
        mockStocksClient as Stocks,
      );

      expect(result.status).toBe("unhealthy");
      expect(result.message).toBe("Erreur lors de la vérification de santé");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur vérification santé"),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== TESTS DES LOGS CONSOLE ====================
  describe("Logs console - Couverture complète", () => {
    it("devrait logger avec emojis appropriés pour chaque fonction", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      await stocksService.obtenirStocks(mockStocksClient as Stocks);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("📦"));

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 5, quantite: 10 },
      ]);
      await stocksService.obtenirStockParArticle(5, mockStocksClient as Stocks);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("📦"));

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });
      await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 30, operation: "set" },
        mockStocksClient as Stocks,
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("🔄"));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);
      await stocksService.obtenirAlertesStock(5, mockStocksClient as Stocks);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("⚠️"));

      consoleSpy.mockRestore();
    });
  });

  // ==================== TESTS DE COMPTAGE ====================
  describe("Comptage des éléments dans les logs", () => {
    it("devrait logger le nombre correct d'éléments récupérés", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const mockStocks = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: (i + 1) * 10,
        article_nom: `Article ${i + 1}`,
      }));

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks,
      );

      await stocksService.obtenirStocks(mockStocksClient as Stocks);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("15 stocks récupérés"),
      );

      consoleSpy.mockRestore();
    });

    it("devrait logger le nombre correct d'alertes", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const mockAlertes = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: i,
        article_nom: `Article ${i + 1}`,
      }));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes,
      );

      await stocksService.obtenirAlertesStock(5, mockStocksClient as Stocks);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("7 alerte(s) de stock récupérée(s)"),
      );

      consoleSpy.mockRestore();
    });
  });

  // ==================== TESTS DES DIFFÉRENTES OPÉRATIONS ====================
  describe("Opérations de mise à jour - Toutes les branches", () => {
    it("devrait appeler mettreAJourStock pour l'opération 'set'", async () => {
      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 30, operation: "set" },
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 30);
      expect(mockStocksClient.ajouterAuStock).not.toHaveBeenCalled();
      expect(mockStocksClient.soustraireStock).not.toHaveBeenCalled();
    });

    it("devrait appeler ajouterAuStock pour l'opération 'add'", async () => {
      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 15, operation: "add" },
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.ajouterAuStock).toHaveBeenCalledWith(5, 15);
      expect(mockStocksClient.mettreAJourStock).not.toHaveBeenCalled();
      expect(mockStocksClient.soustraireStock).not.toHaveBeenCalled();
    });

    it("devrait appeler soustraireStock pour l'opération 'subtract'", async () => {
      (mockStocksClient.soustraireStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await stocksService.mettreAJourStock(
        { article_id: 5, quantite: 10, operation: "subtract" },
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.soustraireStock).toHaveBeenCalledWith(5, 10);
      expect(mockStocksClient.mettreAJourStock).not.toHaveBeenCalled();
      expect(mockStocksClient.ajouterAuStock).not.toHaveBeenCalled();
    });
  });
});
