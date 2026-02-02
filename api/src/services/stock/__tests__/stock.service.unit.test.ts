/**
 * Tests unitaires pour le service Stock
 * Ces tests vérifient le comportement des méthodes du service avec des mocks Prisma
 */

import { StockService } from '../stock.service.js';
import { StockError, StockErrorType } from '@clubmanager/types';
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
} from './stock.mock.js';

describe('StockService - Tests Unitaires', () => {
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
  // TESTS DES QUERIES
  // ============================================

  describe('obtenirStocks', () => {
    it('devrait retourner tous les stocks avec pagination', async () => {
      const mockStocks = [mockStockData.stock1, mockStockData.stock2];
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(2);

      const result = await stockService.obtenirStocks({ limit: 50, offset: 0 });

      expect(result.stocks).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 51,
        })
      );
    });

    it('devrait filtrer les stocks par article_id', async () => {
      const mockStocks = [mockStockData.stock1, mockStockData.stock2];
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(2);

      await stockService.obtenirStocks({ article_id: 1 });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            article_id: 1,
          }),
        })
      );
    });

    it('devrait filtrer les stocks par taille', async () => {
      const mockStocks = [mockStockData.stock1];
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(1);

      await stockService.obtenirStocks({ taille: 'M' });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            taille: 'M',
          }),
        })
      );
    });

    it('devrait rechercher les stocks par nom d\'article', async () => {
      const mockStocks = [mockStockData.stock1];
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(1);

      await stockService.obtenirStocks({ recherche: 'Kimono' });

      expect(mockPrisma.stocks.findMany).toHaveBeenCalled();
    });

    it('devrait indiquer hasMore = true quand il y a plus de résultats', async () => {
      const mockStocks = Array(51).fill(mockStockData.stock1);
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(100);

      const result = await stockService.obtenirStocks({ limit: 50 });

      expect(result.hasMore).toBe(true);
      expect(result.stocks).toHaveLength(50);
    });
  });

  describe('obtenirStockParId', () => {
    it('devrait retourner un stock existant', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock1);

      const result = await stockService.obtenirStockParId(1, 'M');

      expect(result).toBeDefined();
      expect(result?.article_id).toBe(1);
      expect(result?.taille).toBe('M');
      expect(mockPrisma.stocks.findUnique).toHaveBeenCalledWith({
        where: {
          article_id_taille: {
            article_id: 1,
            taille: 'M',
          },
        },
        include: {
          articles: true,
        },
      });
    });

    it('devrait retourner null si le stock n\'existe pas', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      const result = await stockService.obtenirStockParId(999, 'XL');

      expect(result).toBeNull();
    });

    it('devrait retourner null si l\'article n\'existe pas', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        ...mockStockData.stock1,
        articles: null,
      });

      const result = await stockService.obtenirStockParId(1, 'M');

      expect(result).toBeNull();
    });
  });

  describe('obtenirMouvements', () => {
    it('devrait retourner tous les mouvements avec pagination', async () => {
      const mockMouvements = [mockMouvementData.mouvement1, mockMouvementData.mouvement2];
      mockPrisma.mouvements_stock.findMany.mockResolvedValue(mockMouvements);
      mockPrisma.mouvements_stock.count.mockResolvedValue(2);

      const result = await stockService.obtenirMouvements({ limit: 100, offset: 0 });

      expect(result.mouvements).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('devrait filtrer les mouvements par article_id', async () => {
      const mockMouvements = [mockMouvementData.mouvement1];
      mockPrisma.mouvements_stock.findMany.mockResolvedValue(mockMouvements);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      await stockService.obtenirMouvements({ article_id: 1 });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            article_id: 1,
          }),
        })
      );
    });

    it('devrait filtrer les mouvements par type', async () => {
      const mockMouvements = [mockMouvementData.mouvement2];
      mockPrisma.mouvements_stock.findMany.mockResolvedValue(mockMouvements);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      await stockService.obtenirMouvements({ type_mouvement: 'livraison' });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type_mouvement: 'livraison',
          }),
        })
      );
    });

    it('devrait filtrer les mouvements par commande_id', async () => {
      const mockMouvements = [mockMouvementData.mouvement1];
      mockPrisma.mouvements_stock.findMany.mockResolvedValue(mockMouvements);
      mockPrisma.mouvements_stock.count.mockResolvedValue(1);

      await stockService.obtenirMouvements({ commande_id: 'CMD-001' });

      expect(mockPrisma.mouvements_stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            commande_id: 'CMD-001',
          }),
        })
      );
    });

    it('devrait filtrer les mouvements par période', async () => {
      const dateDebut = new Date('2024-01-01');
      const dateFin = new Date('2024-01-31');
      mockPrisma.mouvements_stock.findMany.mockResolvedValue([]);
      mockPrisma.mouvements_stock.count.mockResolvedValue(0);

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
        })
      );
    });
  });

  describe('obtenirResumesStocks', () => {
    it('devrait retourner les résumés consolidés des stocks', async () => {
      const mockArticles = [
        {
          id: 1,
          nom: 'Kimono Blanc',
          code: 'KIM-BLANC-001',
          prix: 49.99,
          active: 1,
          stocks: [mockStockData.stock1, mockStockData.stock2],
        },
      ];
      mockPrisma.articles.findMany.mockResolvedValue(mockArticles);
      mockPrisma.articles.count.mockResolvedValue(1);

      const result = await stockService.obtenirResumesStocks();

      expect(result.resumes).toHaveLength(1);
      expect(result.resumes[0].article_id).toBe(1);
      expect(result.resumes[0].tailles).toHaveLength(2);
    });

    it('devrait calculer correctement les totaux', async () => {
      const mockArticles = [
        {
          id: 1,
          nom: 'Kimono Blanc',
          code: 'KIM-BLANC-001',
          prix: 49.99,
          active: 1,
          stocks: [mockStockData.stock1, mockStockData.stock2],
        },
      ];
      mockPrisma.articles.findMany.mockResolvedValue(mockArticles);
      mockPrisma.articles.count.mockResolvedValue(1);

      const result = await stockService.obtenirResumesStocks();

      expect(result.resumes[0].stock_total_physique).toBe(80); // 50 + 30
      expect(result.resumes[0].stock_total_disponible).toBe(65); // 40 + 25
    });
  });

  // ============================================
  // TESTS DES MUTATIONS
  // ============================================

  describe('reserverStock', () => {
    it('devrait réserver du stock avec succès', async () => {
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
        articles: [{ article_id: 1, taille: 'M', quantite: 5 }],
        commande_id: 'CMD-001',
        utilisateur_id: 1,
      };

      const result = await stockService.reserverStock(input);

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe('CMD-001');
      expect(result.articles_reserves).toHaveLength(1);
    });

    it('devrait échouer si aucun article fourni', async () => {
      const input = {
        articles: [],
        commande_id: 'CMD-001',
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si commande_id manquant', async () => {
      const input = {
        articles: [{ article_id: 1, taille: 'M', quantite: 5 }],
        commande_id: '',
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si quantité invalide', async () => {
      const input = {
        articles: [{ article_id: 1, taille: 'M', quantite: -5 }],
        commande_id: 'CMD-001',
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si stock insuffisant', async () => {
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
        articles: [{ article_id: 1, taille: 'M', quantite: 1000 }],
        commande_id: 'CMD-001',
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si stock non trouvé', async () => {
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
        articles: [{ article_id: 999, taille: 'XL', quantite: 5 }],
        commande_id: 'CMD-001',
      };

      await expect(stockService.reserverStock(input)).rejects.toThrow(StockError);
    });
  });

  describe('confirmerLivraison', () => {
    it('devrait confirmer une livraison avec succès', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: 'livre',
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

      const input = {
        commande_id: 'CMD-001',
        utilisateur_id: 1,
      };

      const result = await stockService.confirmerLivraison(input);

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe('CMD-001');
    });

    it('devrait échouer si commande_id manquant', async () => {
      const input = {
        commande_id: '',
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si commande non trouvée', async () => {
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
        commande_id: 'CMD-999',
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si commande déjà livrée', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande2),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: 'CMD-002',
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si commande annulée', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: 'CMD-003',
      };

      await expect(stockService.confirmerLivraison(input)).rejects.toThrow(StockError);
    });
  });

  describe('annulerCommande', () => {
    it('devrait annuler une commande avec succès', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande1),
            update: jest.fn().mockResolvedValue({
              ...mockCommandeData.commande1,
              statut: 'annule',
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

      const input = {
        commande_id: 'CMD-001',
        motif: 'Client a annulé',
      };

      const result = await stockService.annulerCommande(input);

      expect(result.success).toBe(true);
      expect(result.commande_id).toBe('CMD-001');
    });

    it('devrait échouer si commande déjà annulée', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: 'CMD-003',
      };

      await expect(stockService.annulerCommande(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si commande déjà livrée', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          commandes: {
            findUnique: jest.fn().mockResolvedValue(mockCommandeData.commande2),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        commande_id: 'CMD-002',
      };

      await expect(stockService.annulerCommande(input)).rejects.toThrow(StockError);
    });
  });

  describe('ajusterStock', () => {
    it('devrait ajuster le stock en ajout avec succès', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          articles: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1.articles),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        article_id: 1,
        taille: 'M',
        quantite: 10,
        type_ajustement: 'ajout' as const,
        motif: 'Correction inventaire',
      };

      const result = await stockService.ajusterStock(input);

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(10);
    });

    it('devrait ajuster le stock en retrait avec succès', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1),
            update: jest.fn().mockResolvedValue(mockStockData.stock1),
          },
          articles: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1.articles),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement1),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        article_id: 1,
        taille: 'M',
        quantite: 5,
        type_ajustement: 'retrait' as const,
        motif: 'Stock abîmé',
      };

      const result = await stockService.ajusterStock(input);

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(-5);
    });

    it('devrait échouer si motif manquant', async () => {
      const input = {
        article_id: 1,
        taille: 'M',
        quantite: 10,
        type_ajustement: 'ajout' as const,
        motif: '',
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(StockError);
    });

    it('devrait échouer si quantité négative', async () => {
      const input = {
        article_id: 1,
        taille: 'M',
        quantite: -10,
        type_ajustement: 'ajout' as const,
        motif: 'Test',
      };

      await expect(stockService.ajusterStock(input)).rejects.toThrow(StockError);
    });
  });

  describe('reapprovisionnerStock', () => {
    it('devrait réapprovisionner un stock existant', async () => {
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

      const input = {
        article_id: 1,
        taille: 'M',
        quantite: 50,
        motif: 'Réception fournisseur',
      };

      const result = await stockService.reapprovisionnerStock(input);

      expect(result.success).toBe(true);
      expect(result.quantite_mouvement).toBe(50);
    });

    it('devrait créer un stock s\'il n\'existe pas', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          stocks: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              article_id: 1,
              taille: 'XL',
              stock_physique: 50,
              stock_reserve: 0,
              stock_disponible: 50,
              seuil_alerte: 5,
            }),
          },
          articles: {
            findUnique: jest.fn().mockResolvedValue(mockStockData.stock1.articles),
          },
          mouvements_stock: {
            create: jest.fn().mockResolvedValue(mockMouvementData.mouvement3),
          },
        };
        return callback(tx);
      });
      mockPrisma.$transaction = mockTransaction;

      const input = {
        article_id: 1,
        taille: 'XL',
        quantite: 50,
      };

      const result = await stockService.reapprovisionnerStock(input);

      expect(result.success).toBe(true);
      expect(result.stock_avant).toBe(0);
      expect(result.stock_apres).toBe(50);
    });

    it('devrait échouer si article non trouvé', async () => {
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
        taille: 'M',
        quantite: 50,
      };

      await expect(stockService.reapprovisionnerStock(input)).rejects.toThrow(StockError);
    });
  });

  // ============================================
  // TESTS DES VÉRIFICATIONS
  // ============================================

  describe('verifierDisponibilite', () => {
    it('devrait vérifier la disponibilité de plusieurs articles', async () => {
      mockPrisma.stocks.findUnique
        .mockResolvedValueOnce(mockStockData.stock1)
        .mockResolvedValueOnce(mockStockData.stock2);

      const input = {
        articles: [
          { article_id: 1, taille: 'M', quantite: 5 },
          { article_id: 1, taille: 'L', quantite: 10 },
        ],
      };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.disponible).toBe(true);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].disponible).toBe(true);
      expect(result.details[1].disponible).toBe(true);
    });

    it('devrait retourner false si stock insuffisant', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(mockStockData.stock3);

      const input = {
        articles: [{ article_id: 2, taille: 'M', quantite: 10 }],
      };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.disponible).toBe(false);
      expect(result.details[0].disponible).toBe(false);
    });

    it('devrait gérer les articles sans stock', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      const input = {
        articles: [{ article_id: 999, taille: 'XL', quantite: 1 }],
      };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.disponible).toBe(false);
      expect(result.details[0].stock_disponible).toBe(0);
    });

    it('devrait retourner true pour une liste vide', async () => {
      const input = { articles: [] };

      const result = await stockService.verifierDisponibilite(input);

      expect(result.disponible).toBe(true);
      expect(result.details).toHaveLength(0);
    });
  });

  describe('stockExiste', () => {
    it('devrait retourner true si le stock existe', async () => {
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.stockExiste(1, 'M');

      expect(result).toBe(true);
    });

    it('devrait retourner false si le stock n\'existe pas', async () => {
      mockPrisma.stocks.count.mockResolvedValue(0);

      const result = await stockService.stockExiste(999, 'XL');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  describe('obtenirStockDisponible', () => {
    it('devrait retourner le stock disponible', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue({
        stock_disponible: 40,
      });

      const result = await stockService.obtenirStockDisponible(1, 'M');

      expect(result).toBe(40);
    });

    it('devrait retourner 0 si stock non trouvé', async () => {
      mockPrisma.stocks.findUnique.mockResolvedValue(null);

      const result = await stockService.obtenirStockDisponible(999, 'XL');

      expect(result).toBe(0);
    });
  });

  describe('compterMouvementsArticle', () => {
    it('devrait compter le nombre de mouvements', async () => {
      mockPrisma.mouvements_stock.count.mockResolvedValue(25);

      const result = await stockService.compterMouvementsArticle(1);

      expect(result).toBe(25);
      expect(mockPrisma.mouvements_stock.count).toHaveBeenCalledWith({
        where: { article_id: 1 },
      });
    });
  });

  describe('definirSeuilAlerte', () => {
    it('devrait définir un seuil d\'alerte', async () => {
      mockPrisma.stocks.update.mockResolvedValue(mockStockData.stock1);

      await stockService.definirSeuilAlerte(1, 'M', 10);

      expect(mockPrisma.stocks.update).toHaveBeenCalledWith({
        where: {
          article_id_taille: {
            article_id: 1,
            taille: 'M',
          },
        },
        data: {
          seuil_alerte: 10,
        },
      });
    });
  });

  describe('rechercherStocks', () => {
    it('devrait rechercher des stocks', async () => {
      const mockStocks = [mockStockData.stock1];
      mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
      mockPrisma.stocks.count.mockResolvedValue(1);

      const result = await stockService.rechercherStocks('Kimono');

      expect(result).toHaveLength(1);
      expect(result[0].article_nom).toContain('Kimono');
    });
  });
});
