/**
 * Tests pour les resolvers GraphQL du service Stock
 * Teste les queries et mutations GraphQL
 */

import { jest } from "@jest/globals";
import { stockResolvers } from "../stock.resolvers.js";
import { StockError } from "@clubmanager/types";
import {
  createMockPrisma,
  mockStockData,
  mockMouvementData,
  mockCommandeData,
  createMockStockAvecDetails,
  createMockMouvementAvecDetails,
  createMockResumeStock,
  createMockStatistiquesStocks,
  createMockStatistiquesArticle,
} from "./stock.mock.js";

describe("Stock Resolvers - Tests GraphQL", () => {
  let resolvers: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    resolvers = stockResolvers(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // QUERIES
  // ============================================

  describe("Query: obtenirStocks", () => {
    it("devrait retourner tous les stocks", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
      ]);
      mockPrisma.stocks.count.mockResolvedValue(2);

      const result = await resolvers.Query.obtenirStocks(null, {});

      expect(result.stocks).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it("devrait gérer les erreurs et les transformer en GraphQLError", async () => {
      mockPrisma.stocks.findMany.mockRejectedValue(new Error("Database error"));

      await expect(resolvers.Query.obtenirStocks(null, {})).rejects.toThrow(
        "Database error",
      );
    });

    it("devrait accepter des filtres", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirStocks(null, {
        article_id: 1,
        taille: "M",
        statut: "disponible",
        recherche: "Kimono",
        limit: 10,
        offset: 0,
      });

      expect(result.stocks).toHaveLength(1);
    });

    it("devrait gérer la pagination", async () => {
      // Retourner 11 résultats pour simuler hasMore = true (limit + 1)
      mockPrisma.stocks.findMany.mockResolvedValue(
        Array(11).fill(mockStockData.stock1),
      );
      mockPrisma.stocks.count.mockResolvedValue(100);

      const result = await resolvers.Query.obtenirStocks(null, {
        limit: 10,
        offset: 20,
      });

      expect(result.hasMore).toBe(true);
    });
  });

  describe("Query: obtenirStockParId", () => {
    it("devrait retourner un stock par article_id et taille", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock1);

      const result = await resolvers.Query.obtenirStockParId(null, {
        article_id: 1,
        taille: "M",
      });

      expect(result.article_id).toBe(1);
      expect(result.taille).toBe("M");
      expect(result.article_nom).toBe("Kimono Blanc");
    });

    it("devrait rejeter si le stock n'existe pas", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      await expect(
        resolvers.Query.obtenirStockParId(null, {
          article_id: 999,
          taille: "XL",
        }),
      ).rejects.toThrow("Stock non trouvé");
    });

    it("devrait gérer les erreurs StockError", async () => {
      mockPrisma.stocks.findUnique.mockRejectedValue(
        new StockError("Erreur base de données", "DATABASE_ERROR" as any),
      );

      await expect(
        resolvers.Query.obtenirStockParId(null, { article_id: 1, taille: "M" }),
      ).rejects.toThrow();
    });
  });

  describe("Query: obtenirMouvements", () => {
    it("devrait retourner les mouvements de stock", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement1,
        mockMouvementData.mouvement2,
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(2);

      const result = await resolvers.Query.obtenirMouvements(null, {});

      expect(result.mouvements).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("devrait accepter des filtres", async () => {
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([
        mockMouvementData.mouvement1,
      ]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirMouvements(null, {
        article_id: 1,
        type_mouvement: "commande",
        commande_id: "CMD-001",
        limit: 50,
      });

      expect(result.mouvements).toHaveLength(1);
    });
  });

  describe("Query: obtenirResumesStocks", () => {
    it("devrait retourner les résumés consolidés", async () => {
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

      const result = await resolvers.Query.obtenirResumesStocks(null, {});

      expect(result.resumes).toHaveLength(1);
      expect(result.resumes[0].tailles).toHaveLength(2);
    });

    it("devrait accepter des filtres", async () => {
      mockPrisma.articles.findMany.mockResolvedValue([]);
      mockPrisma.articles.count.mockResolvedValue(0);

      const result = await resolvers.Query.obtenirResumesStocks(null, {
        article_id: 1,
        recherche: "Kimono",
        statut_filtre: "disponible",
      });

      expect(result.resumes).toHaveLength(0);
    });
  });

  describe("Query: verifierDisponibilite", () => {
    it("devrait vérifier la disponibilité des articles", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock1);

      const result = await resolvers.Query.verifierDisponibilite(null, {
        input: {
          articles: [{ article_id: 1, taille: "M", quantite: 5 }],
        },
      });

      expect(result.disponible).toBe(true);
      expect(result.details).toHaveLength(1);
    });

    it("devrait détecter l'indisponibilité", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        stock_disponible: 2,
      });

      const result = await resolvers.Query.verifierDisponibilite(null, {
        input: {
          articles: [{ article_id: 1, taille: "M", quantite: 10 }],
        },
      });

      expect(result.disponible).toBe(false);
    });
  });

  describe("Query: stockExiste", () => {
    it("devrait retourner true si le stock existe", async () => {
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await resolvers.Query.stockExiste(null, {
        article_id: 1,
        taille: "M",
      });

      expect(result).toBe(true);
    });

    it("devrait retourner false si le stock n'existe pas", async () => {
      mockPrisma.stocks.count.mockResolvedValue(0);

      const result = await resolvers.Query.stockExiste(null, {
        article_id: 999,
        taille: "XL",
      });

      expect(result).toBe(false);
    });
  });

  describe("Query: obtenirStockDisponible", () => {
    it("devrait retourner le stock disponible", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        stock_disponible: 40,
      });

      const result = await resolvers.Query.obtenirStockDisponible(null, {
        article_id: 1,
        taille: "M",
      });

      expect(result).toBe(40);
    });

    it("devrait retourner 0 si stock non trouvé", async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      const result = await resolvers.Query.obtenirStockDisponible(null, {
        article_id: 999,
        taille: "XL",
      });

      expect(result).toBe(0);
    });
  });

  describe("Query: obtenirStocksEnRupture", () => {
    it("devrait retourner les stocks en rupture", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stockRupture,
      ]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirStocksEnRupture(null);

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("rupture");
    });
  });

  describe("Query: obtenirStocksEnAlerte", () => {
    it("devrait retourner les stocks en alerte", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock3]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirStocksEnAlerte(null);

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("alerte");
    });
  });

  describe("Query: compterMouvementsArticle", () => {
    it("devrait compter les mouvements d'un article", async () => {
      mockPrisma.mouvements_stock.count.mockResolvedValue(25);

      const result = await resolvers.Query.compterMouvementsArticle(null, {
        article_id: 1,
      });

      expect(result).toBe(25);
    });
  });

  describe("Query: statistiquesStocks", () => {
    it("devrait retourner les statistiques générales", async () => {
      mockPrisma.articles.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);
      mockPrisma.stocks.findMany.mockResolvedValue([
        mockStockData.stock1,
        mockStockData.stock2,
      ]);
      mockPrisma.mouvements_stock.count
        .mockResolvedValueOnce(1500)
        .mockResolvedValueOnce(150);
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);

      const result = await resolvers.Query.statistiquesStocks(null);

      expect(result.nombre_articles_total).toBe(50);
      expect(result.nombre_articles_actifs).toBe(45);
      expect(result.nombre_mouvements_total).toBe(1500);
    });

    it("devrait gérer les erreurs", async () => {
      mockPrisma.articles.count.mockRejectedValue(new Error("Database error"));

      await expect(resolvers.Query.statistiquesStocks(null)).rejects.toThrow();
    });
  });

  describe("Query: statistiquesArticle", () => {
    it("devrait retourner les statistiques d'un article", async () => {
      mockPrisma.articles.findUnique.mockResolvedValue({
        id: 1,
        nom: "Kimono Blanc",
        prix: 49.99,
        active: 1,
      });
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(25);
      mockPrisma.mouvements_stock.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await resolvers.Query.statistiquesArticle(null, {
        article_id: 1,
      });

      expect(result.article_id).toBe(1);
      expect(result.article_nom).toBe("Kimono Blanc");
    });

    it("devrait rejeter si l'article n'existe pas", async () => {
      mockPrisma.articles.findUnique.mockResolvedValue(null);

      await expect(
        resolvers.Query.statistiquesArticle(null, { article_id: 999 }),
      ).rejects.toThrow();
    });
  });

  describe("Query: rechercherStocks", () => {
    it("devrait rechercher des stocks", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([mockStockData.stock1]);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await resolvers.Query.rechercherStocks(null, {
        recherche: "Kimono",
      });

      expect(result).toHaveLength(1);
    });

    it("devrait retourner un tableau vide si aucun résultat", async () => {
      mockPrisma.stocks.findMany.mockResolvedValue([]);
      mockPrisma.stocks.count.mockResolvedValue(0);

      const result = await resolvers.Query.rechercherStocks(null, {
        recherche: "Inexistant",
      });

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // MUTATIONS
  // ============================================

  describe("Mutation: reserverStock", () => {
    it("devrait réserver du stock", async () => {
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

      const result = await resolvers.Mutation.reserverStock(null, {
        input: {
          articles: [{ article_id: 1, taille: "M", quantite: 5 }],
          commande_id: "CMD-001",
          utilisateur_id: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe("CMD-001");
    });

    it("devrait gérer les erreurs StockError", async () => {
      await expect(
        resolvers.Mutation.reserverStock(null, {
          input: {
            articles: [],
            commande_id: "CMD-001",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Mutation: confirmerLivraison", () => {
    it("devrait confirmer une livraison", async () => {
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

      const result = await resolvers.Mutation.confirmerLivraison(null, {
        input: {
          commande_id: "CMD-001",
          utilisateur_id: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe("CMD-001");
    });

    it("devrait rejeter si la commande n'existe pas", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      await expect(
        resolvers.Mutation.confirmerLivraison(null, {
          input: { commande_id: "CMD-999" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Mutation: annulerCommande", () => {
    it("devrait annuler une commande", async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: "annule",
            }),
          },
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

      const result = await resolvers.Mutation.annulerCommande(null, {
        input: {
          commande_id: "CMD-001",
          motif: "Client a annulé",
        },
      });

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe("CMD-001");
    });

    it("devrait rejeter si la commande est déjà livrée", async () => {
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

      await expect(
        resolvers.Mutation.annulerCommande(null, {
          input: { commande_id: "CMD-002" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Mutation: ajusterStock", () => {
    it("devrait ajuster le stock en ajout", async () => {
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

      const result = await resolvers.Mutation.ajusterStock(null, {
        input: {
          article_id: 1,
          taille: "M",
          quantite: 10,
          type_ajustement: "ajout",
          motif: "Correction inventaire",
        },
      });

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(10);
    });

    it("devrait ajuster le stock en retrait", async () => {
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

      const result = await resolvers.Mutation.ajusterStock(null, {
        input: {
          article_id: 1,
          taille: "M",
          quantite: 5,
          type_ajustement: "retrait",
          motif: "Stock abîmé",
        },
      });

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(-5);
    });

    it("devrait rejeter si le motif est vide", async () => {
      await expect(
        resolvers.Mutation.ajusterStock(null, {
          input: {
            article_id: 1,
            taille: "M",
            quantite: 10,
            type_ajustement: "ajout",
            motif: "",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Mutation: reapprovisionnerStock", () => {
    it("devrait réapprovisionner un stock existant", async () => {
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

      const result = await resolvers.Mutation.reapprovisionnerStock(null, {
        input: {
          article_id: 1,
          taille: "M",
          quantite: 50,
          motif: "Réception fournisseur",
        },
      });

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(50);
    });

    it("devrait créer un stock s'il n'existe pas", async () => {
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

      const result = await resolvers.Mutation.reapprovisionnerStock(null, {
        input: {
          article_id: 1,
          taille: "XL",
          quantite: 100,
        },
      });

      expect(result.success).toBe(true);
      expect(result.stock_avant).toBe(0);
      expect(result.stock_apres).toBe(100);
    });
  });

  describe("Mutation: definirSeuilAlerte", () => {
    it("devrait définir un seuil d'alerte", async () => {
      mockPrisma.stocks.update.mockResolvedValue(mockStockData.stock1);

      const result = await resolvers.Mutation.definirSeuilAlerte(null, {
        article_id: 1,
        taille: "M",
        seuil_alerte: 10,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Seuil d'alerte défini");
    });

    it("devrait gérer les erreurs", async () => {
      mockPrisma.stocks.update.mockRejectedValue(new Error("Stock not found"));

      await expect(
        resolvers.Mutation.definirSeuilAlerte(null, {
          article_id: 999,
          taille: "XL",
          seuil_alerte: 5,
        }),
      ).rejects.toThrow();
    });
  });

  // ============================================
  // INTÉGRATION DES RESOLVERS
  // ============================================

  describe("Intégration des resolvers", () => {
    it("devrait avoir toutes les queries définies", () => {
      expect(resolvers.Query).toBeDefined();
      expect(resolvers.Query.obtenirStocks).toBeDefined();
      expect(resolvers.Query.obtenirStockParId).toBeDefined();
      expect(resolvers.Query.obtenirMouvements).toBeDefined();
      expect(resolvers.Query.obtenirResumesStocks).toBeDefined();
      expect(resolvers.Query.verifierDisponibilite).toBeDefined();
      expect(resolvers.Query.stockExiste).toBeDefined();
      expect(resolvers.Query.obtenirStockDisponible).toBeDefined();
      expect(resolvers.Query.obtenirStocksEnRupture).toBeDefined();
      expect(resolvers.Query.obtenirStocksEnAlerte).toBeDefined();
      expect(resolvers.Query.compterMouvementsArticle).toBeDefined();
      expect(resolvers.Query.statistiquesStocks).toBeDefined();
      expect(resolvers.Query.statistiquesArticle).toBeDefined();
      expect(resolvers.Query.rechercherStocks).toBeDefined();
    });

    it("devrait avoir toutes les mutations définies", () => {
      expect(resolvers.Mutation).toBeDefined();
      expect(resolvers.Mutation.reserverStock).toBeDefined();
      expect(resolvers.Mutation.confirmerLivraison).toBeDefined();
      expect(resolvers.Mutation.annulerCommande).toBeDefined();
      expect(resolvers.Mutation.ajusterStock).toBeDefined();
      expect(resolvers.Mutation.reapprovisionnerStock).toBeDefined();
      expect(resolvers.Mutation.definirSeuilAlerte).toBeDefined();
    });

    it("devrait gérer les erreurs non-StockError", async () => {
      mockPrisma.stocks.findMany.mockRejectedValue(
        new Error("Unexpected error"),
      );

      await expect(resolvers.Query.obtenirStocks(null, {})).rejects.toThrow(
        "Unexpected error",
      );
    });
  });
});
