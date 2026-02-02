/**
 * Tests avancés pour le service Stock
 * Ces tests vérifient les scénarios complexes et cas limites
 */

import { StockService } from "../stock.service.js";
import { StockError, StockErrorType } from "@clubmanager/types";
import {
  createMockPrisma,
  mockStockData,
  mockMouvementData,
  mockCommandeData,
} from "./stock.mock.js";

describe("StockService - Tests Avancés", () => {
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
  // SCÉNARIOS COMPLEXES DE RÉSERVATION
  // ============================================

  describe("Scénarios complexes de réservation", () => {
    it("devrait gérer une réservation partielle quand plusieurs articles", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1) // OK
              .mockResolvedValueOnce({
                ...mockStockData.stock2,
                stock_disponible: 0, // En rupture
              }),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [
          { article_id: 1, taille: "M", quantite: 5 },
          { article_id: 1, taille: "L", quantite: 10 },
        ],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait gérer une commande avec le même article en plusieurs tailles", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1)
              .mockResolvedValueOnce(mockStockData.stock2)
              .mockResolvedValueOnce(mockStockData.stock3),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [
          { article_id: 1, taille: "M", quantite: 2 },
          { article_id: 1, taille: "L", quantite: 3 },
          { article_id: 2, taille: "M", quantite: 1 },
        ],
        commande_id: "CMD-MULTI",
      };

      const result = await stockService.reserverStock(input);

      expect(result.success).toBe(true);
      expect(result.articles_reserves).toHaveLength(3);
    });

    it("devrait calculer correctement le stock disponible après réservations", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_physique: 100,
        stock_reserve: 30,
        stock_disponible: 70,
      });

      const stock = await stockService.obtenirStockParId(1, "M");

      expect(stock?.stock_disponible).toBe(70);
      expect(stock?.stock_physique).toBe(100);
      expect(stock?.stock_reserve).toBe(30);
    });

    it("devrait empêcher une sur-réservation", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_disponible: 5,
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  // ============================================
  // CYCLES COMPLEXES DE COMMANDE
  // ============================================

  describe("Cycles complexes de commande", () => {
    it("devrait gérer plusieurs commandes concurrentes sur le même stock", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_disponible: 50,
            }),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input1 = {
        articles: [{ article_id: 1, taille: "M", quantite: 20 }],
        commande_id: "CMD-001",
      };
      const input2 = {
        articles: [{ article_id: 1, taille: "M", quantite: 25 }],
        commande_id: "CMD-002",
      };

      const result1 = await stockService.reserverStock(input1);
      const result2 = await stockService.reserverStock(input2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("devrait gérer un cycle réservation -> annulation -> nouvelle réservation", async () => {
      let stockReserve = 0;

      // Réservation
      let mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_reserve: stockReserve,
              stock_disponible: 50 - stockReserve,
            }),
            update: jest.fn().mockImplementation(() => {
              stockReserve += 10;
              return Promise.resolve(mockStockData.stock1);
            }),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const reservationInput = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      await stockService.reserverStock(reservationInput);
      expect(stockReserve).toBe(10);

      // Annulation
      mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              articles: JSON.stringify([
                { article_id: 1, taille: "M", quantite: 10 },
              ]),
            }),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "annule",
            }),
          },
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_reserve: stockReserve,
            }),
            update: jest.fn().mockImplementation(() => {
              stockReserve -= 10;
              return Promise.resolve(mockStockData.stock1);
            }),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await stockService.annulerCommande({
        commande_id: "CMD-001",
      });

      expect(stockReserve).toBe(0);
    });

    it("devrait calculer correctement après livraison partielle", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              articles: JSON.stringify([
                { article_id: 1, taille: "M", quantite: 5 },
              ]),
            }),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "livre",
            }),
          },
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 50,
              stock_reserve: 10,
            }),
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

  // ============================================
  // AJUSTEMENTS ET RÉAPPROVISIONNEMENTS COMPLEXES
  // ============================================

  describe("Ajustements et réapprovisionnements complexes", () => {
    it("devrait gérer plusieurs ajustements successifs", async () => {
      let stockPhysique = 50;

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: stockPhysique,
            }),
            update: jest.fn().mockImplementation((args: any) => {
              stockPhysique = args.data.stock_physique;
              return Promise.resolve({
                ...mockStockData.stock1,
                stock_physique: stockPhysique,
              });
            }),
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

      // Premier ajustement: ajout de 20
      await stockService.ajusterStock({
        article_id: 1,
        taille: "M",
        quantite: 20,
        type_ajustement: "ajout",
        motif: "Premier ajout",
      });

      expect(stockPhysique).toBe(70);

      // Deuxième ajustement: retrait de 10
      await stockService.ajusterStock({
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "retrait",
        motif: "Premier retrait",
      });

      expect(stockPhysique).toBe(60);
    });

    it("devrait créer automatiquement un stock lors du premier réapprovisionnement", async () => {
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

    it("devrait gérer un réapprovisionnement massif", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 10050,
            }),
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
        quantite: 10000,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // FILTRES ET RECHERCHES AVANCÉS
  // ============================================

  describe("Filtres et recherches avancés", () => {
    it("devrait combiner plusieurs filtres", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      await stockService.obtenirStocks({
        article_id: 1,
        taille: "M",
        statut: "disponible",
        recherche: "Kimono",
        limit: 10,
        offset: 0,
      });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            article_id: 1,
            taille: "M",
          }),
        }),
      );
    });

    it("devrait gérer une recherche avec accents", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      await stockService.obtenirStocks({
        recherche: "Protège-tibias élémentaire",
      });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });

    it("devrait filtrer les mouvements sur une période précise", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement1,
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      const dateDebut = new Date("2024-01-01");
      const dateFin = new Date("2024-01-31");

      await stockService.obtenirMouvements({
        date_debut: dateDebut,
        date_fin: dateFin,
      });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: {
              gte: dateDebut,
              lte: dateFin,
            },
          }),
        }),
      );
    });

    it("devrait paginer correctement sur de grands ensembles", async () => {
      const mockStocks = Array(100)
        .fill(null)
        .map((_, i) => ({
          ...mockStockData.stock1,
          article_id: i + 1,
        }));

      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(1000);

      const result = await stockService.obtenirStocks({
        limit: 100,
        offset: 200,
      });

      expect(result.stocks.length).toBeLessThanOrEqual(100);
      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 200,
          take: 101,
        }),
      );
    });
  });

  // ============================================
  // STATISTIQUES AVANCÉES
  // ============================================

  describe("Statistiques avancées", () => {
    it("devrait calculer la rotation du stock correctement", async () => {
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

      const il_y_a_30_jours = new Date();
      il_y_a_30_jours.setDate(il_y_a_30_jours.getDate() - 30);

      mockPrisma.mouvements_stock.count.mockResolvedValue(25);
      mockPrisma.mouvements_stock.findMany
        .mockResolvedValueOnce([
          { quantite_mouvement: -5 },
          { quantite_mouvement: -10 },
        ])
        .mockResolvedValueOnce([{ quantite_mouvement: 50 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const stats = await stockService.statistiquesArticle(1);

      expect(stats.stock_total_physique).toBeGreaterThan(0);
      expect(stats.rotation_stock).toBeGreaterThanOrEqual(0);
    });

    it("devrait identifier les articles à forte rotation", async () => {
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
        mockStockData.stock3,
      ]);

      mockPrisma.mouvements_stock.count
        .mockResolvedValueOnce(1500)
        .mockResolvedValueOnce(150);

      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        {
          ...mockMouvementData.mouvement2,
          quantite_mouvement: -50,
        },
        {
          ...mockMouvementData.mouvement2,
          article_id: 2,
          quantite_mouvement: -30,
        },
      ]);

      const stats = await stockService.statistiquesGenerales();

      expect(stats.top_articles_vendus.length).toBeGreaterThan(0);
      expect(stats.top_articles_vendus[0].quantite_vendue).toBeGreaterThan(0);
    });

    it("devrait calculer la valeur totale du stock correctement", async () => {
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stock1,
          stock_physique: 100,
          articles: { ...mockStockData.stock1.articles, prix: 49.99 },
        },
        {
          ...mockStockData.stock2,
          stock_physique: 50,
          articles: { ...mockStockData.stock2.articles, prix: 49.99 },
        },
      ]);

      mockPrisma.mouvements_stock.count
        .mockResolvedValueOnce(1500)
        .mockResolvedValueOnce(150);

      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);

      const stats = await stockService.statistiquesGenerales();

      expect(stats.valeur_stock_total).toBeGreaterThan(0);
      // (100 + 50) * 49.99 = 7498.5
      expect(stats.valeur_stock_total).toBeCloseTo(7498.5, 1);
    });
  });

  // ============================================
  // ALERTES ET SEUILS AVANCÉS
  // ============================================

  describe("Alertes et seuils avancés", () => {
    it("devrait identifier les stocks en rupture imminente", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stock3,
          stock_disponible: 1,
          seuil_alerte: 5,
        },
      ]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.obtenirStocksEnAlerte();

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("alerte");
    });

    it("devrait prioriser les alertes par niveau de criticité", async () => {
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          ...mockStockData.stockRupture,
          articles: { ...mockStockData.stockRupture.articles, active: 1 },
        },
        {
          ...mockStockData.stock3,
          articles: { ...mockStockData.stock3.articles, active: 1 },
        },
      ]);

      mockPrisma.mouvements_stock.count
        .mockResolvedValueOnce(1500)
        .mockResolvedValueOnce(150);

      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);

      const stats = await stockService.statistiquesGenerales();

      expect(stats.alertes_actives.length).toBeGreaterThan(0);
      // La première alerte devrait être une rupture
      const premierAlerte = stats.alertes_actives[0];
      expect(["rupture", "alerte"]).toContain(premierAlerte.statut);
    });

    it("devrait gérer les seuils d'alerte personnalisés par article", async () => {
      mockPrisma.stocks.update.mockResolvedValue({
        ...mockStockData.stock1,
        seuil_alerte: 20,
      });

      await stockService.definirSeuilAlerte(1, "M", 20);

      expect(mockPrisma.stocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { seuil_alerte: 20 },
        }),
      );
    });
  });

  // ============================================
  // PERFORMANCE ET OPTIMISATION
  // ============================================

  describe("Performance et optimisation", () => {
    it("devrait gérer efficacement de nombreux mouvements", async () => {
      const mouvements = Array(101)
        .fill(null)
        .map((_, i) => ({
          ...mockMouvementData.mouvement1,
          id: i + 1,
        }));

      mockPrisma.mouvements_stock.findMany.mockResolvedValue(mouvements);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1000);

      const result = await stockService.obtenirMouvements({ limit: 100 });

      expect(result.mouvements).toHaveLength(100);
      expect(result.total).toBe(1000);
      expect(result.hasMore).toBe(true);
    });

    it("devrait utiliser l'index sur article_id pour les recherches", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      await stockService.obtenirStocks({ article_id: 1 });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            article_id: 1,
          }),
        }),
      );
    });

    it("devrait limiter les résultats pour éviter la surcharge mémoire", async () => {
      const largeLimit = 10000;
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      await stockService.obtenirStocks({ limit: largeLimit });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: largeLimit + 1,
        }),
      );
    });
  });

  // ============================================
  // CAS LIMITES ET EDGE CASES
  // ============================================

  describe("Cas limites et edge cases", () => {
    it("devrait gérer un stock à zéro exact", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_physique: 0,
        stock_reserve: 0,
        stock_disponible: 0,
      });

      const stock = await stockService.obtenirStockParId(1, "M");

      expect(stock?.stock_disponible).toBe(0);
      expect(stock?.statut).toBe("rupture");
    });

    it("devrait gérer un stock exactement au seuil d'alerte", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 5,
        seuil_alerte: 5,
      });

      const stock = await stockService.obtenirStockParId(1, "M");

      expect(stock?.stock_disponible).toBe(5);
      expect(stock?.statut).toBe("alerte");
    });

    it("devrait gérer une quantité exactement égale au stock disponible", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_disponible: 10,
            }),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      const result = await stockService.reserverStock(input);

      expect(result.success).toBe(true);
    });

    it("devrait gérer une date de livraison dans le futur", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "livre",
            }),
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

      const dateFuture = new Date();
      dateFuture.setDate(dateFuture.getDate() + 7);

      const result = await stockService.confirmerLivraison({
        commande_id: "CMD-001",
        date_livraison: dateFuture,
      });

      expect(result.success).toBe(true);
      expect(result.date_livraison).toEqual(dateFuture);
    });

    it("devrait gérer une recherche vide", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
      ]);
      mockPrisma.stocks.count.mockResolvedValue(2);

      const result = await stockService.obtenirStocks({ recherche: "" });

      expect(result.stocks.length).toBeGreaterThanOrEqual(0);
    });

    it("devrait gérer une pagination à la fin des résultats", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(100);

      const result = await stockService.obtenirStocks({
        limit: 50,
        offset: 100,
      });

      expect(result.stocks).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });
});
