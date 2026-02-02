/**
 * Tests de couverture pour le service Stock
 * Ces tests maximisent la couverture de code
 */

import { jest } from "@jest/globals";
import { StockService } from "../stock.service.js";
import { StockError, StockErrorType } from "@clubmanager/types";
import {
  createMockPrisma,
  mockStockData,
  mockMouvementData,
  mockCommandeData,
} from "./stock.mock.js";

describe("StockService - Tests de Couverture", () => {
  let stockService: StockService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    stockService = new StockService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // COUVERTURE DES QUERIES
  // ============================================

  describe("Couverture obtenirStocks", () => {
    it("devrait gérer tous les cas de filtrage", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      // Cas 1: Sans filtres
      await stockService.obtenirStocks();
      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();

      // Cas 2: Avec article_id
      await stockService.obtenirStocks({ article_id: 1 });

      // Cas 3: Avec taille
      await stockService.obtenirStocks({ taille: "M" });

      // Cas 4: Avec recherche
      await stockService.obtenirStocks({ recherche: "Kimono" });

      // Cas 5: Avec statut
      await stockService.obtenirStocks({ statut: "disponible" });

      // Cas 6: Avec pagination
      await stockService.obtenirStocks({ limit: 10, offset: 5 });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledTimes(6);
    });

    it("devrait calculer hasMore correctement", async () => {
      // Cas 1: Pas plus de résultats
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);
      let result = await stockService.obtenirStocks({ limit: 10 });
      expect(result.hasMore).toBe(false);

      // Cas 2: Plus de résultats disponibles
      mockPrisma.stocks.findMany.mockResolvedValue(
        Array(11).fill(mockStockData.stock1),
      );
      mockPrisma.stocks.count.mockResolvedValue(20);
      result = await stockService.obtenirStocks({ limit: 10 });
      expect(result.hasMore).toBe(true);
    });

    it("devrait gérer le filtrage par statut", async () => {
      // Stock disponible
      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stock1,
          stock_disponible: 50,
          seuil_alerte: 5,
        },
      ]);
      mockPrisma.stocks.count.mockResolvedValue(1);
      let result = await stockService.obtenirStocks({ statut: "disponible" });
      expect(result.stocks[0].statut).toBe("disponible");

      // Stock en alerte
      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stock3,
          stock_disponible: 3,
          seuil_alerte: 5,
        },
      ]);
      result = await stockService.obtenirStocks({ statut: "alerte" });
      expect(result.stocks[0].statut).toBe("alerte");

      // Stock en rupture
      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stockRupture,
          stock_disponible: 0,
          seuil_alerte: 5,
        },
      ]);
      result = await stockService.obtenirStocks({ statut: "rupture" });
      expect(result.stocks[0].statut).toBe("rupture");
    });
  });

  describe("Couverture obtenirStockParId", () => {
    it("devrait couvrir tous les cas de retour", async () => {
      // Cas 1: Stock trouvé
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock1);
      let result = await stockService.obtenirStockParId(1, "M");
      expect(result).not.toBeNull();

      // Cas 2: Stock non trouvé
      mockPrisma.stocks.findUnique.mockResolvedValue(null);
      result = await stockService.obtenirStockParId(999, "XL");
      expect(result).toBeNull();

      // Cas 3: Stock sans article
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        articles: null,
      });
      result = await stockService.obtenirStockParId(1, "M");
      expect(result).toBeNull();
    });

    it("devrait calculer correctement tous les statuts", async () => {
      // Statut: disponible
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 50,
        seuil_alerte: 5,
      });
      let stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.statut).toBe("disponible");

      // Statut: alerte
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 3,
        seuil_alerte: 5,
      });
      stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.statut).toBe("alerte");

      // Statut: rupture
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 0,
        seuil_alerte: 5,
      });
      stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.statut).toBe("rupture");
    });
  });

  describe("Couverture obtenirMouvements", () => {
    it("devrait gérer tous les filtres de mouvements", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement1,
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      // Sans filtre
      await stockService.obtenirMouvements();

      // Avec article_id
      await stockService.obtenirMouvements({ article_id: 1 });

      // Avec taille
      await stockService.obtenirMouvements({ taille: "M" });

      // Avec type_mouvement
      await stockService.obtenirMouvements({ type_mouvement: "livraison" });

      // Avec commande_id
      await stockService.obtenirMouvements({ commande_id: "CMD-001" });

      // Avec dates
      await stockService.obtenirMouvements({
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
      });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledTimes(6);
    });

    it("devrait gérer les périodes de dates", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(0);

      // Seulement date_debut
      await stockService.obtenirMouvements({
        date_debut: new Date("2024-01-01"),
      });

      // Seulement date_fin
      await stockService.obtenirMouvements({
        date_fin: new Date("2024-01-31"),
      });

      // Les deux dates
      await stockService.obtenirMouvements({
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
      });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledTimes(3);
    });
  });

  describe("Couverture obtenirResumesStocks", () => {
    it("devrait gérer tous les scénarios de résumés", async () => {
      mockPrisma.articles.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Kimono Blanc",
          code: "KIM-001",
          prix: 49.99,
          active: 1,
          stocks: [mockStockData.stock1, mockStockData.stock2],
        },
      ]);
      mockPrisma.articles.count.mockResolvedValue(1);

      // Sans filtre
      await stockService.obtenirResumesStocks();

      // Avec article_id
      await stockService.obtenirResumesStocks({ article_id: 1 });

      // Avec recherche
      await stockService.obtenirResumesStocks({ recherche: "Kimono" });

      // Avec statut_filtre
      await stockService.obtenirResumesStocks({ statut_filtre: "disponible" });

      expect(mockPrisma.articles.findMany).toHaveBeenCalledTimes(4);
    });

    it("devrait calculer correctement les totaux", async () => {
      mockPrisma.articles.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Kimono Blanc",
          code: "KIM-001",
          prix: 50.0,
          active: 1,
          stocks: [
            {
              ...mockStockData.stock1,
              stock_physique: 100,
              stock_disponible: 80,
            },
            {
              ...mockStockData.stock2,
              stock_physique: 50,
              stock_disponible: 40,
            },
          ],
        },
      ]);
      mockPrisma.articles.count.mockResolvedValue(1);

      const result = await stockService.obtenirResumesStocks();

      expect(result.resumes[0].stock_total_physique).toBe(150);
      expect(result.resumes[0].stock_total_disponible).toBe(120);
      expect(result.resumes[0].valeur_totale).toBe(7500);
    });
  });

  // ============================================
  // COUVERTURE DES MUTATIONS
  // ============================================

  describe("Couverture reserverStock", () => {
    it("devrait couvrir toutes les validations", async () => {
      // Validation: articles vide
      await expect(
        stockService.reserverStock({
          articles: [],
          commande_id: "CMD-001",
        }),
      ).rejects.toThrow(StockError);

      // Validation: commande_id vide
      await expect(
        stockService.reserverStock({
          articles: [{ article_id: 1, taille: "M", quantite: 5 }],
          commande_id: "",
        }),
      ).rejects.toThrow(StockError);

      // Validation: quantité négative
      await expect(
        stockService.reserverStock({
          articles: [{ article_id: 1, taille: "M", quantite: -5 }],
          commande_id: "CMD-001",
        }),
      ).rejects.toThrow(StockError);

      // Validation: quantité zéro
      await expect(
        stockService.reserverStock({
          articles: [{ article_id: 1, taille: "M", quantite: 0 }],
          commande_id: "CMD-001",
        }),
      ).rejects.toThrow(StockError);
    });

    it("devrait couvrir tous les cas d'erreur de stock", async () => {
      // Stock non trouvé
      let mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        stockService.reserverStock({
          articles: [{ article_id: 999, taille: "XL", quantite: 5 }],
          commande_id: "CMD-001",
        }),
      ).rejects.toThrow(StockError);

      // Stock insuffisant
      mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_disponible: 2,
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        stockService.reserverStock({
          articles: [{ article_id: 1, taille: "M", quantite: 10 }],
          commande_id: "CMD-001",
        }),
      ).rejects.toThrow(StockError);
    });

    it("devrait couvrir le cas de succès complet", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const result = await stockService.reserverStock({
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
        utilisateur_id: 1,
      });

      expect(result.success).toBe(true);
      expect(result.mouvements).toBeDefined();
    });
  });

  describe("Couverture confirmerLivraison", () => {
    it("devrait couvrir toutes les validations", async () => {
      // Validation: commande_id vide
      await expect(
        stockService.confirmerLivraison({ commande_id: "" }),
      ).rejects.toThrow(StockError);
    });

    it("devrait couvrir tous les états de commande", async () => {
      // Commande non trouvée
      let mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        stockService.confirmerLivraison({ commande_id: "CMD-999" }),
      ).rejects.toThrow(StockError);

      // Commande déjà livrée
      mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande2,
              statut: "livre",
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        stockService.confirmerLivraison({ commande_id: "CMD-002" }),
      ).rejects.toThrow(StockError);

      // Commande annulée
      mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande3,
              statut: "annule",
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        stockService.confirmerLivraison({ commande_id: "CMD-003" }),
      ).rejects.toThrow(StockError);
    });

    it("devrait couvrir le parsing JSON", async () => {
      // JSON valide
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              articles: JSON.stringify([
                { article_id: 1, taille: "M", quantite: 2 },
              ]),
            }),
            update: jest.fn().mockResolvedValue(mockCommandeData.commande1),
          },
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement2),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const result = await stockService.confirmerLivraison({
        commande_id: "CMD-001",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Couverture ajusterStock", () => {
    it("devrait couvrir toutes les validations", async () => {
      // Validation: article_id ou taille manquant
      await expect(
        stockService.ajusterStock({
          article_id: 0,
          taille: "M",
          quantite: 10,
          type_ajustement: "ajout",
          motif: "Test",
        }),
      ).rejects.toThrow(StockError);

      // Validation: quantité négative
      await expect(
        stockService.ajusterStock({
          article_id: 1,
          taille: "M",
          quantite: -10,
          type_ajustement: "ajout",
          motif: "Test",
        }),
      ).rejects.toThrow(StockError);

      // Validation: quantité zéro
      await expect(
        stockService.ajusterStock({
          article_id: 1,
          taille: "M",
          quantite: 0,
          type_ajustement: "ajout",
          motif: "Test",
        }),
      ).rejects.toThrow(StockError);

      // Validation: motif vide
      await expect(
        stockService.ajusterStock({
          article_id: 1,
          taille: "M",
          quantite: 10,
          type_ajustement: "ajout",
          motif: "",
        }),
      ).rejects.toThrow(StockError);

      // Validation: type_ajustement invalide
      await expect(
        stockService.ajusterStock({
          article_id: 1,
          taille: "M",
          quantite: 10,
          type_ajustement: "invalid" as any,
          motif: "Test",
        }),
      ).rejects.toThrow(StockError);
    });

    it("devrait couvrir les deux types d'ajustement", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          articles: {
            findUnique: jest
              .fn()
              .mockResolvedValue(mockStockData.stock1.articles),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      // Type: ajout
      let result = await stockService.ajusterStock({
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "ajout",
        motif: "Ajout stock",
      });
      expect(result.quantite_mouvement).toBe(10);

      // Type: retrait
      result = await stockService.ajusterStock({
        article_id: 1,
        taille: "M",
        quantite: 5,
        type_ajustement: "retrait",
        motif: "Retrait stock",
      });
      expect(result.quantite_mouvement).toBe(-5);
    });
  });

  describe("Couverture reapprovisionnerStock", () => {
    it("devrait couvrir le cas de création de stock", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              article_id: 1,
              taille: "XL",
              stock_physique: 100,
              stock_reserve: 0,
              stock_disponible: 100,
              seuil_alerte: 5,
            }),
          },
          articles: {
            findUnique: jest
              .fn()
              .mockResolvedValue(mockStockData.stock1.articles),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const result = await stockService.reapprovisionnerStock({
        article_id: 1,
        taille: "XL",
        quantite: 100,
      });

      expect(result.success).toBe(true);
      expect(result.stock_avant).toBe(0);
      expect(result.stock_apres).toBe(100);
    });

    it("devrait couvrir le cas de mise à jour de stock", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const result = await stockService.reapprovisionnerStock({
        article_id: 1,
        taille: "M",
        quantite: 50,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // COUVERTURE DES VÉRIFICATIONS
  // ============================================

  describe("Couverture verifierDisponibilite", () => {
    it("devrait couvrir tous les cas de disponibilité", async () => {
      // Cas 1: Liste vide
      let result = await stockService.verifierDisponibilite({ articles: [] });
      expect(result.disponible).toBe(true);
      expect(result.details).toHaveLength(0);

      // Cas 2: Stock disponible
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock1);
      result = await stockService.verifierDisponibilite({
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
      });
      expect(result.disponible).toBe(true);

      // Cas 3: Stock insuffisant
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 2,
      });
      result = await stockService.verifierDisponibilite({
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
      });
      expect(result.disponible).toBe(false);

      // Cas 4: Stock inexistant
      mockPrisma.stocks.findUnique.mockResolvedValue(null);
      result = await stockService.verifierDisponibilite({
        articles: [{ article_id: 999, taille: "XL", quantite: 1 }],
      });
      expect(result.disponible).toBe(false);
    });
  });

  describe("Couverture stockExiste", () => {
    it("devrait couvrir les deux cas", async () => {
      // Stock existe
      mockPrisma.stocks.count.mockResolvedValue(1);
      let result = await stockService.stockExiste(1, "M");
      expect(result).toBe(true);

      // Stock n'existe pas
      mockPrisma.stocks.count.mockResolvedValue(0);
      result = await stockService.stockExiste(999, "XL");
      expect(result).toBe(false);
    });
  });

  // ============================================
  // COUVERTURE DES MÉTHODES UTILITAIRES
  // ============================================

  describe("Couverture des méthodes utilitaires", () => {
    it("devrait couvrir obtenirStockDisponible", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        stock_disponible: 40,
      });
      let result = await stockService.obtenirStockDisponible(1, "M");
      expect(result).toBe(40);

      mockPrisma.stocks.findUnique.mockResolvedValue(null);
      result = await stockService.obtenirStockDisponible(999, "XL");
      expect(result).toBe(0);
    });

    it("devrait couvrir obtenirStocksEnRupture", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stockRupture,
      ]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.obtenirStocksEnRupture();
      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("rupture");
    });

    it("devrait couvrir obtenirStocksEnAlerte", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock3]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.obtenirStocksEnAlerte();
      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("alerte");
    });

    it("devrait couvrir compterMouvementsArticle", async () => {
      mockPrisma.mouvements_stock.count.mockResolvedValue(25);
      const result = await stockService.compterMouvementsArticle(1);
      expect(result).toBe(25);
    });

    it("devrait couvrir definirSeuilAlerte", async () => {
      mockPrisma.stocks.update.mockResolvedValue(mockStockData.stock1);
      await stockService.definirSeuilAlerte(1, "M", 10);
      expect(mockPrisma.stocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { seuil_alerte: 10 },
        }),
      );
    });

    it("devrait couvrir rechercherStocks", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.rechercherStocks("Kimono");
      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // COUVERTURE DES STATISTIQUES
  // ============================================

  describe("Couverture statistiquesGenerales", () => {
    it("devrait couvrir tous les calculs", async () => {
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock3,
        mockStockData.stockRupture,
      ]);

      mockPrisma.mouvements_stock.count
        .mockResolvedValueOnce(1500)
        .mockResolvedValueOnce(150);

      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement2,
      ]);

      const stats = await stockService.statistiquesGenerales();

      expect(stats.nombre_articles_total).toBe(50);
      expect(stats.nombre_articles_actifs).toBe(45);
      expect(stats.nombre_mouvements_total).toBe(1500);
      expect(stats.nombre_mouvements_mois).toBe(150);
      expect(stats.alertes_actives).toBeDefined();
      expect(stats.top_articles_vendus).toBeDefined();
    });
  });

  describe("Couverture statistiquesArticle", () => {
    it("devrait couvrir tous les calculs", async () => {
      mockPrisma.articles.findUnique.mockResolvedValue({
        id: 1,
        nom: "Kimono Blanc",
        prix: 49.99,
        active: 1,
      });

      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
      ]);

      mockPrisma.mouvements_stock.count.mockResolvedValue(25);
      mockPrisma.mouvements_stock.findMany
        .mockResolvedValueOnce([
          { quantite_mouvement: -5 },
          { quantite_mouvement: -10 },
        ])
        .mockResolvedValueOnce([{ quantite_mouvement: 50 }])
        .mockResolvedValueOnce([{ created_at: new Date("2024-01-20") }])
        .mockResolvedValueOnce([{ created_at: new Date("2024-01-10") }]);

      const stats = await stockService.statistiquesArticle(1);

      expect(stats.article_id).toBe(1);
      expect(stats.stock_total_physique).toBeDefined();
      expect(stats.quantite_vendue_30_jours).toBeDefined();
      expect(stats.rotation_stock).toBeDefined();
    });

    it("devrait gérer l'article non trouvé", async () => {
      mockPrisma.articles.findUnique.mockResolvedValue(null);

      await expect(stockService.statistiquesArticle(999)).rejects.toThrow(
        StockError,
      );
    });
  });

  // ============================================
  // COUVERTURE DES CAS LIMITES
  // ============================================

  describe("Couverture des cas limites", () => {
    it("devrait gérer les valeurs undefined optionnelles", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        seuil_alerte: null,
        created_at: null,
        updated_at: null,
      });

      const stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.seuil_alerte).toBe(0);
    });

    it("devrait gérer les articles avec prix null", async () => {
      mockPrisma.articles.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Article sans prix",
          code: "ART-001",
          prix: null,
          active: 1,
          stocks: [mockStockData.stock1],
        },
      ]);
      mockPrisma.articles.count.mockResolvedValue(1);

      const result = await stockService.obtenirResumesStocks();
      expect(result.resumes[0].valeur_totale).toBe(0);
    });

    it("devrait gérer les mouvements sans utilisateur", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        {
          ...mockMouvementData.mouvement1,
          utilisateurs: null,
        },
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      const result = await stockService.obtenirMouvements();
      expect(result.mouvements[0].utilisateur_nom).toBeUndefined();
    });

    it("devrait gérer stock_disponible = stock_physique - stock_reserve", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_physique: 100,
        stock_reserve: 30,
        stock_disponible: 70,
      });

      const stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.stock_disponible).toBe(70);
      expect(
        stock!.stock_physique - stock!.stock_reserve,
      ).toBeGreaterThanOrEqual(stock!.stock_disponible);
    });
  });
});
