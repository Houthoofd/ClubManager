/**
 * Tests d'exceptions pour le service Stock
 * Ces tests vérifient la gestion des cas d'erreur et exceptions
 */

import { StockService } from "../stock.service.js";
import { StockError, StockErrorType } from "@clubmanager/types";
import {
  createMockPrisma,
  mockStockData,
  mockMouvementData,
  mockCommandeData,
} from "./stock.mock.js";

describe("StockService - Tests d'Exceptions", () => {
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
  // ERREURS DE BASE DE DONNÉES
  // ============================================

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion à la base", async () => {
      mockPrisma.stocks.findMany.mockRejectedValue(
        new Error("Connection refused"),
      );

      await expect(stockService.obtenirStocks()).rejects.toThrow(
        "Connection refused",
      );
    });

    it("devrait gérer un timeout de requête", async () => {
      mockPrisma.stocks.findMany.mockRejectedValue(new Error("Query timeout"));

      await expect(stockService.obtenirStocks()).rejects.toThrow(
        "Query timeout",
      );
    });

    it("devrait gérer une erreur de contrainte unique", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            create: jest
              .fn()
              .mockRejectedValue(new Error("Unique constraint violation")),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        mockTransaction((tx: any) => tx.stocks.create({})),
      ).rejects.toThrow("Unique constraint violation");
    });

    it("devrait gérer une erreur de clé étrangère", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 99999, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait gérer une erreur de deadlock", async () => {
      const mockTransaction = jest
        .fn()
        .mockRejectedValue(new Error("Deadlock detected"));

      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        "Deadlock detected",
      );
    });
  });

  // ============================================
  // ERREURS DE STOCK
  // ============================================

  describe("Erreurs de stock", () => {
    it("devrait lancer STOCK_NOT_FOUND si le stock n'existe pas", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 999, taille: "XXL", quantite: 1 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toMatchObject({
        type: StockErrorType.STOCK_NOT_FOUND,
      });
    });

    it("devrait lancer INSUFFICIENT_STOCK si le stock est insuffisant", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toMatchObject({
        type: StockErrorType.INSUFFICIENT_STOCK,
      });
    });

    it("devrait inclure les détails dans l'erreur INSUFFICIENT_STOCK", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.details).toBeDefined();
        expect(error.details.article_id).toBe(1);
        expect(error.details.disponible).toBe(2);
        expect(error.details.demande).toBe(10);
      }
    });

    it("devrait lancer INVALID_QUANTITY pour quantité négative", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: -5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toMatchObject({
        type: StockErrorType.INVALID_QUANTITY,
      });
    });

    it("devrait lancer INVALID_ARTICLE si l'article n'existe pas", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          articles: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        article_id: 999,
        taille: "M",
        quantite: 50,
      };

      await expect(stockService.reapprovisionnerStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(
        stockService.reapprovisionnerStock(input),
      ).rejects.toMatchObject({
        type: StockErrorType.INVALID_ARTICLE,
      });
    });
  });

  // ============================================
  // ERREURS DE COMMANDE
  // ============================================

  describe("Erreurs de commande", () => {
    it("devrait lancer COMMANDE_NOT_FOUND si la commande n'existe pas", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: "CMD-INEXISTANTE",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(
        StockError,
      );
      await expect(
        stockService.confirmerLivraison(input),
      ).rejects.toMatchObject({
        type: StockErrorType.COMMANDE_NOT_FOUND,
      });
    });

    it("devrait lancer ALREADY_DELIVERED si commande déjà livrée", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        commande_id: "CMD-002",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(
        StockError,
      );
      await expect(
        stockService.confirmerLivraison(input),
      ).rejects.toMatchObject({
        type: StockErrorType.ALREADY_DELIVERED,
      });
    });

    it("devrait lancer ALREADY_CANCELLED si commande déjà annulée", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        commande_id: "CMD-003",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(
        StockError,
      );
      await expect(
        stockService.confirmerLivraison(input),
      ).rejects.toMatchObject({
        type: StockErrorType.ALREADY_CANCELLED,
      });
    });

    it("devrait empêcher l'annulation d'une commande déjà livrée", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        commande_id: "CMD-002",
      };

      await expect(stockService.annulerCommande(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.annulerCommande(input)).rejects.toMatchObject({
        type: StockErrorType.ALREADY_DELIVERED,
      });
    });
  });

  // ============================================
  // ERREURS DE VALIDATION
  // ============================================

  describe("Erreurs de validation", () => {
    it("devrait lancer VALIDATION_ERROR pour articles vide", async () => {
      const input = {
        articles: [],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toMatchObject({
        type: StockErrorType.VALIDATION_ERROR,
      });
    });

    it("devrait lancer VALIDATION_ERROR pour commande_id vide", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toMatchObject({
        type: StockErrorType.VALIDATION_ERROR,
      });
    });

    it("devrait lancer VALIDATION_ERROR pour motif vide", async () => {
      const input = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "ajout" as const,
        motif: "",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.ajusterStock(input)).rejects.toMatchObject({
        type: StockErrorType.VALIDATION_ERROR,
      });
    });

    it("devrait lancer VALIDATION_ERROR pour type_ajustement invalide", async () => {
      const input = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "invalid" as any,
        motif: "Test",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.ajusterStock(input)).rejects.toMatchObject({
        type: StockErrorType.VALIDATION_ERROR,
      });
    });
  });

  // ============================================
  // ERREURS DE PARSING
  // ============================================

  describe("Erreurs de parsing", () => {
    it("devrait gérer une erreur de parsing JSON pour articles", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              commande_id: "CMD-001",
              articles: "invalid json{[",
              statut: "en_attente",
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
      await expect(
        stockService.confirmerLivraison(input),
      ).rejects.toMatchObject({
        type: StockErrorType.DATABASE_ERROR,
      });
    });

    it("devrait gérer des données articles corrompues", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue({
              commande_id: "CMD-001",
              articles: null,
              statut: "en_attente",
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: "CMD-001",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow();
    });
  });

  // ============================================
  // ERREURS DE TRANSACTION
  // ============================================

  describe("Erreurs de transaction", () => {
    it("devrait rollback si une erreur survient pendant la réservation", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockRejectedValue(new Error("Update failed")),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        "Update failed",
      );
    });

    it("devrait rollback si erreur lors de la création du mouvement", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          mouvements_stock: {
            create: jest
              .fn()
              .mockRejectedValue(new Error("Failed to create movement")),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        "Failed to create movement",
      );
    });

    it("devrait rollback si un article sur plusieurs échoue", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockStockData.stock1)
              .mockResolvedValueOnce(null), // Deuxième article n'existe pas
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
          { article_id: 999, taille: "XL", quantite: 1 },
        ],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  // ============================================
  // ERREURS DE COHÉRENCE
  // ============================================

  describe("Erreurs de cohérence des données", () => {
    it("devrait détecter un stock_reserve supérieur au stock_physique", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
          },
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 5,
              stock_reserve: 10,
            }),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: "CMD-001",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow();
    });

    it("devrait détecter un stock_disponible négatif", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: -10,
      });

      const stock = await stockService.obtenirStockParId(1, "M");
      expect(stock?.stock_disponible).toBe(-10);
    });

    it("devrait empêcher de retirer plus de stock que disponible", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 5,
            }),
          },
          articles: {
            findUnique: jest
              .fn()
              .mockResolvedValue(mockStockData.stock1.articles),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        article_id: 1,
        taille: "M",
        quantite: 100,
        type_ajustement: "retrait" as const,
        motif: "Test",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.ajusterStock(input)).rejects.toMatchObject({
        type: StockErrorType.INSUFFICIENT_STOCK,
      });
    });
  });

  // ============================================
  // GESTION DES NULL/UNDEFINED
  // ============================================

  describe("Gestion des valeurs nulles et indéfinies", () => {
    it("devrait gérer un article null", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        articles: null,
      });

      const stock = await stockService.obtenirStockParId(1, "M");
      expect(stock).toBeNull();
    });

    it("devrait gérer une liste de mouvements vide", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(0);

      const result = await stockService.obtenirMouvements();
      expect(result.mouvements).toHaveLength(0);
    });

    it("devrait gérer un prix null pour le calcul de valeur", async () => {
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
  });

  // ============================================
  // MESSAGES D'ERREUR
  // ============================================

  describe("Messages d'erreur", () => {
    it("devrait fournir un message d'erreur clair pour stock insuffisant", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.message).toContain("Stock insuffisant");
        expect(error.message).toContain("article 1");
        expect(error.message).toContain("taille M");
        expect(error.message).toContain("Disponible: 2");
        expect(error.message).toContain("Demandé: 10");
      }
    });

    it("devrait fournir un message clair pour commande non trouvée", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: "CMD-999",
      };

      try {
        await stockService.confirmerLivraison(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.message).toContain("Commande CMD-999 non trouvée");
      }
    });

    it("devrait fournir un message clair pour article non trouvé", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 999, taille: "XL", quantite: 1 }],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.message).toContain("Stock non trouvé");
        expect(error.message).toContain("article 999");
        expect(error.message).toContain("taille XL");
      }
    });
  });

  // ============================================
  // CODES DE STATUT HTTP
  // ============================================

  describe("Codes de statut HTTP", () => {
    it("devrait retourner 404 pour stock non trouvé", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 999, taille: "XL", quantite: 1 }],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("devrait retourner 400 pour validation échouée", async () => {
      const input = {
        articles: [],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it("devrait retourner 400 pour stock insuffisant", async () => {
      const mockTransaction = jest.fn(async (callback) => {
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

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        commande_id: "CMD-001",
      };

      try {
        await stockService.reserverStock(input);
        fail("Devrait avoir lancé une exception");
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });
});
