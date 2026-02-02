/**
 * Tests d'intégration pour le service Stock
 * Ces tests vérifient les interactions entre les différentes méthodes du service
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

describe("StockService - Tests d'Intégration", () => {
  let stockService: StockService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    stockService = new StockService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Cycle complet de commande", () => {
    it("devrait gérer un cycle complet: réservation -> livraison", async () => {
      // Setup
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1)
              .mockResolvedValueOnce(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest
              .fn()
              .mockResolvedValueOnce(mockMouvementData.mouvement1)
              .mockResolvedValueOnce(mockMouvementData.mouvement2),
          },
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "livre",
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      // 1. Réserver le stock
      const reservationInput = {
        articles: [{ article_id: 1, taille: "M", quantite: 2 }],
        commande_id: "CMD-001",
        utilisateur_id: 1,
      };

      const reservationResult =
        await stockService.reserverStock(reservationInput);
      expect(reservationResult.success).toBe(true);
      expect(reservationResult.commande_id).toBe("CMD-001");

      // 2. Confirmer la livraison
      const livraisonInput = {
        commande_id: "CMD-001",
        utilisateur_id: 1,
      };

      const livraisonResult =
        await stockService.confirmerLivraison(livraisonInput);
      expect(livraisonResult.success).toBe(true);
      expect(livraisonResult.commande_id).toBe("CMD-001");
    });

    it("devrait gérer un cycle: réservation -> annulation", async () => {
      // Setup
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1)
              .mockResolvedValueOnce(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest
              .fn()
              .mockResolvedValueOnce(mockMouvementData.mouvement1)
              .mockResolvedValueOnce({
                ...mockMouvementData.mouvement1,
                type_mouvement: "annulation",
              }),
          },
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "annule",
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      // 1. Réserver le stock
      const reservationInput = {
        articles: [{ article_id: 1, taille: "M", quantite: 2 }],
        commande_id: "CMD-001",
        utilisateur_id: 1,
      };

      const reservationResult =
        await stockService.reserverStock(reservationInput);
      expect(reservationResult.success).toBe(true);

      // 2. Annuler la commande
      const annulationInput = {
        commande_id: "CMD-001",
        motif: "Client a changé d'avis",
        utilisateur_id: 1,
      };

      const annulationResult =
        await stockService.annulerCommande(annulationInput);
      expect(annulationResult.success).toBe(true);
    });
  });

  describe("Gestion des stocks multiples", () => {
    it("devrait réserver plusieurs articles en une seule transaction", async () => {
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
          { article_id: 1, taille: "L", quantite: 1 },
          { article_id: 2, taille: "M", quantite: 1 },
        ],
        commande_id: "CMD-MULTI",
        utilisateur_id: 1,
      };

      const result = await stockService.reserverStock(input);

      expect(result.success).toBe(true);
      expect(result.articles_reserves).toHaveLength(3);
    });

    it("devrait vérifier la disponibilité de plusieurs articles", async () => {
      mockPrisma.stocks.findUnique
        .mockResolvedValueOnce(mockStockData.stock1)
        .mockResolvedValueOnce(mockStockData.stock2)
        .mockResolvedValueOnce(mockStockData.stock3);

      const input = {
        articles: [
          { article_id: 1, taille: "M", quantite: 5 },
          { article_id: 1, taille: "L", quantite: 10 },
          { article_id: 2, taille: "M", quantite: 1 },
        ],
      };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.details).toHaveLength(3);
      expect(result.disponible).toBe(true);
    });

    it("devrait détecter l'indisponibilité d'un seul article parmi plusieurs", async () => {
      mockPrisma.stocks.findUnique
        .mockResolvedValueOnce(mockStockData.stock1)
        .mockResolvedValueOnce(mockStockData.stockRupture);

      const input = {
        articles: [
          { article_id: 1, taille: "M", quantite: 5 },
          { article_id: 3, taille: "S", quantite: 1 },
        ],
      };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.disponible).toBe(false);
      expect(result.details[0].disponible).toBe(true);
      expect(result.details[1].disponible).toBe(false);
    });
  });

  describe("Gestion des ajustements de stock", () => {
    it("devrait ajuster le stock puis vérifier la disponibilité", async () => {
      // Setup ajustement
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 60,
              stock_disponible: 50,
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

      // 1. Ajuster le stock
      const ajustementInput = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "ajout" as const,
        motif: "Réception marchandises",
      };

      const ajustementResult = await stockService.ajusterStock(ajustementInput);
      expect(ajustementResult.success).toBe(true);

      // 2. Vérifier la nouvelle disponibilité
      mockPrisma.stocks.findUnique.mockResolvedValue({
        stock_disponible: 50,
      });

      const disponibilite = await stockService.obtenirStockDisponible(1, "M");
      expect(disponibilite).toBe(50);
    });

    it("devrait réapprovisionner puis réserver du stock", async () => {
      // Setup réapprovisionnement
      let mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock3),
            update: jest.fn().mockResolvedValue({
              ...mockStockData.stock3,
              stock_physique: 103,
              stock_disponible: 102,
            }),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      // 1. Réapprovisionner
      const reapproInput = {
        article_id: 2,
        taille: "M",
        quantite: 100,
        motif: "Réception fournisseur",
      };

      const reapproResult =
        await stockService.reapprovisionnerStock(reapproInput);
      expect(reapproResult.success).toBe(true);

      // 2. Réserver du stock maintenant disponible
      mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock3,
              stock_physique: 103,
              stock_disponible: 102,
            }),
            update: jest.fn().mockResolvedValue(mockStockData.stock3),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const reservationInput = {
        articles: [{ article_id: 2, taille: "M", quantite: 10 }],
        commande_id: "CMD-AFTER-REAPPRO",
      };

      const reservationResult =
        await stockService.reserverStock(reservationInput);
      expect(reservationResult.success).toBe(true);
    });
  });

  describe("Traçabilité des mouvements", () => {
    it("devrait enregistrer les mouvements après chaque opération", async () => {
      const mouvementsCreated: any[] = [];

      const mockTransaction = jest.fn(async (callback) => {
        const createFn = jest.fn((data) => {
          mouvementsCreated.push(data.data);
          return Promise.resolve({
            id: mouvementsCreated.length,
            ...data.data,
          });
        });

        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: createFn,
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      // Réserver du stock
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-TRACE",
        utilisateur_id: 1,
      };

      await stockService.reserverStock(input);

      expect(mouvementsCreated).toHaveLength(1);
      expect(mouvementsCreated[0].type_mouvement).toBe("commande");
      expect(mouvementsCreated[0].commande_id).toBe("CMD-TRACE");
    });

    it("devrait obtenir l'historique après plusieurs opérations", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement1,
        mockMouvementData.mouvement2,
        mockMouvementData.mouvement3,
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(3);

      const result = await stockService.obtenirMouvements({ article_id: 1 });

      expect(result.mouvements).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  describe("Gestion des erreurs en chaîne", () => {
    it("devrait échouer la livraison si la réservation n'a pas été faite", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
          },
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_reserve: 0, // Pas de réservation
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: "CMD-001",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait rollback en cas d'erreur sur un article parmi plusieurs", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1)
              .mockResolvedValueOnce(null), // Deuxième article introuvable
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
          { article_id: 999, taille: "XL", quantite: 1 },
        ],
        commande_id: "CMD-ERROR",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  describe("Statistiques et résumés", () => {
    it("devrait obtenir les statistiques après des mouvements", async () => {
      // Setup stocks
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);

      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
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
    });

    it("devrait obtenir les résumés consolidés", async () => {
      mockPrisma.articles.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Kimono Blanc",
          code: "KIM-BLANC-001",
          prix: 49.99,
          active: 1,
          stocks: [mockStockData.stock1, mockStockData.stock2],
        },
      ]);
      mockPrisma.articles.count.mockResolvedValue(1);

      const result = await stockService.obtenirResumesStocks();

      expect(result.resumes).toHaveLength(1);
      expect(result.resumes[0].tailles).toHaveLength(2);
      expect(result.resumes[0].stock_total_physique).toBe(80);
    });
  });

  describe("Alertes et seuils", () => {
    it("devrait identifier les stocks en rupture", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stockRupture,
      ]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.obtenirStocksEnRupture();

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("rupture");
    });

    it("devrait identifier les stocks en alerte", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock3]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.obtenirStocksEnAlerte();

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("alerte");
    });

    it("devrait définir un seuil d'alerte et le respecter", async () => {
      // Définir le seuil
      mockPrisma.stocks.update.mockResolvedValue({
        ...mockStockData.stock1,
        seuil_alerte: 15,
      });

      await stockService.definirSeuilAlerte(1, "M", 15);

      expect(mockPrisma.stocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { seuil_alerte: 15 },
        }),
      );

      // Vérifier que le stock passe en alerte
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 10,
        seuil_alerte: 15,
      });

      const stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.statut).toBe("alerte");
    });
  });
});
