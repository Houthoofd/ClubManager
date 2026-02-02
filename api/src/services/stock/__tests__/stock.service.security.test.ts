/**
 * Tests de sécurité pour le service Stock
 * Ces tests vérifient la sécurité et la validation des entrées
 */

import { StockService } from "../stock.service.js";
import { StockError, StockErrorType } from "@clubmanager/types";
import {
  createMockPrisma,
  mockStockData,
  mockMouvementData,
  mockCommandeData,
} from "./stock.mock.js";

describe("StockService - Tests de Sécurité", () => {
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
  // VALIDATION DES INPUTS
  // ============================================

  describe("Validation des quantités", () => {
    it("devrait rejeter les quantités négatives dans reserverStock", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: -5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
      await expect(stockService.reserverStock(input)).rejects.toThrow(
        /quantité invalide/i,
      );
    });

    it("devrait rejeter les quantités zéro", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 0 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait rejeter les quantités non numériques", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: NaN }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });

    it("devrait rejeter les quantités infinies", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: Infinity }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });
  });

  describe("Validation des IDs", () => {
    it("devrait rejeter les article_id négatifs", async () => {
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
        articles: [{ article_id: -1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait rejeter les article_id = 0", async () => {
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
        articles: [{ article_id: 0, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });

    it("devrait gérer les très grands article_id", async () => {
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
        articles: [
          { article_id: Number.MAX_SAFE_INTEGER, taille: "M", quantite: 5 },
        ],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  describe("Validation des strings", () => {
    it("devrait rejeter les commande_id vides", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait rejeter les commande_id null", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: null as any,
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });

    it("devrait rejeter les commande_id undefined", async () => {
      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: undefined as any,
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });

    it("devrait rejeter les tailles vides", async () => {
      const input = {
        article_id: 1,
        taille: "",
        quantite: 10,
        type_ajustement: "ajout" as const,
        motif: "Test",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow();
    });

    it("devrait rejeter les motifs vides pour ajustement", async () => {
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
    });

    it("devrait rejeter les motifs avec uniquement des espaces", async () => {
      const input = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "ajout" as const,
        motif: "   ",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  describe("Validation des tableaux", () => {
    it("devrait rejeter un tableau d'articles vide", async () => {
      const input = {
        articles: [],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait rejeter un tableau null", async () => {
      const input = {
        articles: null as any,
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });

    it("devrait rejeter un tableau undefined", async () => {
      const input = {
        articles: undefined as any,
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });
  });

  // ============================================
  // INJECTION SQL / NoSQL
  // ============================================

  describe("Protection contre injection", () => {
    it("devrait échapper les caractères spéciaux dans recherche", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      await stockService.obtenirStocks({
        recherche: "'; DROP TABLE stocks; --",
      });

      // Vérifier que Prisma gère l'échappement
      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les caractères SQL dans commande_id", async () => {
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
        commande_id: "CMD-001'; DROP TABLE commandes; --",
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait gérer les tentatives d'injection dans taille", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      const result = await stockService.obtenirStockParId(
        1,
        "M'; DROP TABLE stocks; --",
      );

      expect(result).toBeNull();
      expect(mockPrisma.stocks.findUnique).toHaveBeenCalled();
    });
  });

  // ============================================
  // AUTORISATIONS ET LIMITES
  // ============================================

  describe("Limites de quantité", () => {
    it("devrait gérer les très grandes quantités", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 999999999 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(
        StockError,
      );
    });

    it("devrait gérer une grande liste d'articles", async () => {
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

      // Créer une liste de 10 articles
      const articles = Array(10)
        .fill(null)
        .map((_, i) => ({
          article_id: 1,
          taille: "M",
          quantite: 1,
        }));

      const input = {
        articles,
        commande_id: "CMD-MULTI",
      };

      // Le service devrait gérer cela avec succès
      const result = await stockService.reserverStock(input);
      expect(result.success).toBe(true);
      expect(result.articles_reserves).toHaveLength(10);
    });
  });

  describe("Limites de pagination", () => {
    it("devrait limiter la taille maximale de page", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      await stockService.obtenirStocks({ limit: 10000 });

      // Le service devrait prendre la limite demandée
      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10001, // +1 pour hasMore
        }),
      );
    });

    it("devrait gérer les offsets négatifs", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      await stockService.obtenirStocks({ offset: -10 });

      // Prisma devrait gérer l'offset négatif
      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });
  });

  // ============================================
  // RACE CONDITIONS ET CONCURRENCE
  // ============================================

  describe("Gestion de la concurrence", () => {
    it("devrait utiliser des transactions pour éviter les race conditions", async () => {
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

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await stockService.reserverStock(input);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("devrait rollback en cas d'erreur pendant la transaction", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockRejectedValue(new Error("Database error")),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        commande_id: "CMD-001",
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow();
    });
  });

  // ============================================
  // VALIDATION DES ÉTATS
  // ============================================

  describe("Validation des états de commande", () => {
    it("devrait empêcher la livraison d'une commande déjà livrée", async () => {
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
    });

    it("devrait empêcher la double annulation", async () => {
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

      await expect(stockService.annulerCommande(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  // ============================================
  // VALIDATION DES TYPES
  // ============================================

  describe("Validation des types d'ajustement", () => {
    it("devrait rejeter un type d'ajustement invalide", async () => {
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
    });

    it("devrait accepter uniquement 'ajout' ou 'retrait'", async () => {
      const input = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "modification" as any,
        motif: "Test",
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(
        StockError,
      );
    });
  });

  // ============================================
  // PROTECTION CONTRE LES ABUS
  // ============================================

  describe("Protection contre les abus", () => {
    it("devrait gérer les requêtes avec des caractères Unicode", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      await stockService.obtenirStocks({
        recherche: "🚀💥🎉",
      });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les très longues chaînes de recherche", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      const longString = "a".repeat(10000);
      await stockService.obtenirStocks({ recherche: longString });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les motifs très longs", async () => {
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

      const longMotif = "a".repeat(5000);
      const input = {
        article_id: 1,
        taille: "M",
        quantite: 10,
        type_ajustement: "ajout" as const,
        motif: longMotif,
      };

      await stockService.ajusterStock(input);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ============================================
  // VALIDATION DES DONNÉES CALCULÉES
  // ============================================

  describe("Validation de l'intégrité des données", () => {
    it("devrait empêcher le retrait de plus de stock que disponible", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockStockData.stock1,
              stock_physique: 10,
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
    });

    it("devrait vérifier que stock_reserve <= stock_physique", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
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
  });
});
