/**
 * Tests unitaires pour les resolvers GraphQL du module Magasin
 */

import { resolvers } from '../graphql/magasin.graphql.js';
import { getMagasinRepository } from '../magasin.repository.js';
import type {
  ArticleAvecCategorie,
  StockDetail,
  Categorie,
  Taille,
  CommandeAvecClient,
  MagasinStats,
} from '../types.js';

// Mock du repository
jest.mock('../magasin.repository.js');

describe('Magasin GraphQL Resolvers', () => {
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Créer un mock du repository
    mockRepository = {
      getAllArticles: jest.fn(),
      getArticleById: jest.fn(),
      getArticlesParCategories: jest.fn(),
      getArticlesByCategorie: jest.fn(),
      searchArticlesByName: jest.fn(),
      searchArticlesByPriceRange: jest.fn(),
      getAllStocks: jest.fn(),
      getStocksByArticle: jest.fn(),
      getStockByArticleAndTaille: jest.fn(),
      getOutOfStockArticles: jest.fn(),
      getLowStockArticles: jest.fn(),
      getAllCategories: jest.fn(),
      getCategorieById: jest.fn(),
      getCategorieByName: jest.fn(),
      getAllTailles: jest.fn(),
      getTailleById: jest.fn(),
      getTailleByName: jest.fn(),
      getAllCommandes: jest.fn(),
      getCommandeById: jest.fn(),
      getCommandesByUser: jest.fn(),
      getCommandesByStatut: jest.fn(),
      createArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
      addStock: jest.fn(),
      updateStock: jest.fn(),
      createCommande: jest.fn(),
      updateCommandeStatut: jest.fn(),
      cancelCommande: jest.fn(),
      articleExists: jest.fn(),
      categorieExists: jest.fn(),
      checkStockSufficient: jest.fn(),
      getStats: jest.fn(),
    };

    (getMagasinRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // TESTS DES QUERIES - ARTICLES
  // ==========================================================================

  describe('Query: getAllArticles', () => {
    it('devrait récupérer tous les articles', async () => {
      const mockArticles: ArticleAvecCategorie[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: 'T-shirt confortable',
          categorie: { id: 1, nom: 'Vêtements' },
          images: ['http://example.com/image.jpg'],
          stocks: [{ taille: 'M', quantite: 10 }],
        },
      ];

      mockRepository.getAllArticles.mockResolvedValue(mockArticles);

      const result = await resolvers.Query.getAllArticles();

      expect(result).toEqual(mockArticles);
      expect(mockRepository.getAllArticles).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs', async () => {
      mockRepository.getAllArticles.mockRejectedValue(new Error('Database error'));

      await expect(resolvers.Query.getAllArticles()).rejects.toThrow(
        'Erreur lors de la récupération des articles'
      );
    });
  });

  describe('Query: getArticleById', () => {
    it('devrait récupérer un article par ID', async () => {
      const mockArticle: ArticleAvecCategorie = {
        id: 1,
        nom: 'T-Shirt',
        prix: 25.99,
        description: 'T-shirt confortable',
        categorie: { id: 1, nom: 'Vêtements' },
        images: [],
        stocks: [],
      };

      mockRepository.getArticleById.mockResolvedValue(mockArticle);

      const result = await resolvers.Query.getArticleById(null, { id: 1 });

      expect(result).toEqual(mockArticle);
      expect(mockRepository.getArticleById).toHaveBeenCalledWith(1);
    });

    it('devrait retourner null si article non trouvé', async () => {
      mockRepository.getArticleById.mockResolvedValue(null);

      const result = await resolvers.Query.getArticleById(null, { id: 999 });

      expect(result).toBeNull();
    });
  });

  describe('Query: getArticlesParCategories', () => {
    it('devrait organiser les articles par catégories', async () => {
      const mockArticlesParCategorie = {
        Vêtements: [
          {
            id: 1,
            nom: 'T-Shirt',
            prix: 25.99,
            description: null,
            categorie: { id: 1, nom: 'Vêtements' },
            images: [],
            stocks: [],
          },
        ],
        Accessoires: [
          {
            id: 2,
            nom: 'Casquette',
            prix: 15.99,
            description: null,
            categorie: { id: 2, nom: 'Accessoires' },
            images: [],
            stocks: [],
          },
        ],
      };

      mockRepository.getArticlesParCategories.mockResolvedValue(mockArticlesParCategorie);

      const result = await resolvers.Query.getArticlesParCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('categorie');
      expect(result[0]).toHaveProperty('articles');
    });
  });

  describe('Query: searchArticlesByName', () => {
    it('devrait rechercher des articles par nom', async () => {
      const mockArticles: ArticleAvecCategorie[] = [
        {
          id: 1,
          nom: 'T-Shirt Blanc',
          prix: 25.99,
          description: null,
          categorie: { id: 1, nom: 'Vêtements' },
          images: [],
          stocks: [],
        },
      ];

      mockRepository.searchArticlesByName.mockResolvedValue(mockArticles);

      const result = await resolvers.Query.searchArticlesByName(null, {
        searchTerm: 'Shirt',
      });

      expect(result).toEqual(mockArticles);
      expect(mockRepository.searchArticlesByName).toHaveBeenCalledWith('Shirt');
    });
  });

  describe('Query: searchArticlesByPriceRange', () => {
    it('devrait rechercher des articles par plage de prix', async () => {
      const mockArticles: ArticleAvecCategorie[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: null,
          categorie: { id: 1, nom: 'Vêtements' },
          images: [],
          stocks: [],
        },
      ];

      mockRepository.searchArticlesByPriceRange.mockResolvedValue(mockArticles);

      const result = await resolvers.Query.searchArticlesByPriceRange(null, {
        minPrice: 20,
        maxPrice: 30,
      });

      expect(result).toEqual(mockArticles);
      expect(mockRepository.searchArticlesByPriceRange).toHaveBeenCalledWith(20, 30);
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - STOCKS
  // ==========================================================================

  describe('Query: getAllStocks', () => {
    it('devrait récupérer tous les stocks', async () => {
      const mockStocks: StockDetail[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille: 'M',
          quantite: 10,
        },
      ];

      mockRepository.getAllStocks.mockResolvedValue(mockStocks);

      const result = await resolvers.Query.getAllStocks();

      expect(result).toEqual(mockStocks);
      expect(mockRepository.getAllStocks).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query: getStocksByArticle', () => {
    it('devrait récupérer les stocks d\'un article', async () => {
      const mockStocks: StockDetail[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille: 'M',
          quantite: 10,
        },
      ];

      mockRepository.getStocksByArticle.mockResolvedValue(mockStocks);

      const result = await resolvers.Query.getStocksByArticle(null, { articleId: 1 });

      expect(result).toEqual(mockStocks);
      expect(mockRepository.getStocksByArticle).toHaveBeenCalledWith(1);
    });
  });

  describe('Query: getLowStockArticles', () => {
    it('devrait récupérer les articles à faible stock avec threshold par défaut', async () => {
      const mockStocks: StockDetail[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille: 'M',
          quantite: 3,
        },
      ];

      mockRepository.getLowStockArticles.mockResolvedValue(mockStocks);

      const result = await resolvers.Query.getLowStockArticles(null, {});

      expect(result).toEqual(mockStocks);
      expect(mockRepository.getLowStockArticles).toHaveBeenCalledWith(5);
    });

    it('devrait utiliser un threshold personnalisé', async () => {
      const mockStocks: StockDetail[] = [];

      mockRepository.getLowStockArticles.mockResolvedValue(mockStocks);

      await resolvers.Query.getLowStockArticles(null, { threshold: 10 });

      expect(mockRepository.getLowStockArticles).toHaveBeenCalledWith(10);
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - CATÉGORIES
  // ==========================================================================

  describe('Query: getAllCategories', () => {
    it('devrait récupérer toutes les catégories', async () => {
      const mockCategories: Categorie[] = [
        { id: 1, nom: 'Vêtements' },
        { id: 2, nom: 'Accessoires' },
      ];

      mockRepository.getAllCategories.mockResolvedValue(mockCategories);

      const result = await resolvers.Query.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockRepository.getAllCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query: getCategorieById', () => {
    it('devrait récupérer une catégorie par ID', async () => {
      const mockCategorie: Categorie = { id: 1, nom: 'Vêtements' };

      mockRepository.getCategorieById.mockResolvedValue(mockCategorie);

      const result = await resolvers.Query.getCategorieById(null, { id: 1 });

      expect(result).toEqual(mockCategorie);
      expect(mockRepository.getCategorieById).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - TAILLES
  // ==========================================================================

  describe('Query: getAllTailles', () => {
    it('devrait récupérer toutes les tailles', async () => {
      const mockTailles: Taille[] = [
        { id: 1, nom: 'S' },
        { id: 2, nom: 'M' },
        { id: 3, nom: 'L' },
      ];

      mockRepository.getAllTailles.mockResolvedValue(mockTailles);

      const result = await resolvers.Query.getAllTailles();

      expect(result).toEqual(mockTailles);
      expect(mockRepository.getAllTailles).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query: getTailleByName', () => {
    it('devrait récupérer une taille par nom', async () => {
      const mockTaille: Taille = { id: 2, nom: 'M' };

      mockRepository.getTailleByName.mockResolvedValue(mockTaille);

      const result = await resolvers.Query.getTailleByName(null, { nom: 'M' });

      expect(result).toEqual(mockTaille);
      expect(mockRepository.getTailleByName).toHaveBeenCalledWith('M');
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - COMMANDES
  // ==========================================================================

  describe('Query: getAllCommandes', () => {
    it('devrait récupérer toutes les commandes', async () => {
      const mockCommandes: CommandeAvecClient[] = [
        {
          commande_id: 1,
          date_commande: '2024-01-01',
          statut: 'en_attente',
          total: 50.99,
          client: {
            id: 1,
            nom: 'John Doe',
            email: 'john@example.com',
          },
          articles: [],
        },
      ];

      mockRepository.getAllCommandes.mockResolvedValue(mockCommandes);

      const result = await resolvers.Query.getAllCommandes();

      expect(result).toEqual(mockCommandes);
      expect(mockRepository.getAllCommandes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query: getCommandesByUser', () => {
    it('devrait récupérer les commandes d\'un utilisateur', async () => {
      const mockCommandes: CommandeAvecClient[] = [
        {
          commande_id: 1,
          date_commande: '2024-01-01',
          statut: 'en_attente',
          total: 50.99,
          client: {
            id: 1,
            nom: 'John Doe',
            email: 'john@example.com',
          },
          articles: [],
        },
      ];

      mockRepository.getCommandesByUser.mockResolvedValue(mockCommandes);

      const result = await resolvers.Query.getCommandesByUser(null, {
        utilisateurId: 1,
      });

      expect(result).toEqual(mockCommandes);
      expect(mockRepository.getCommandesByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('Query: getCommandesByStatut', () => {
    it('devrait récupérer les commandes par statut', async () => {
      const mockCommandes: CommandeAvecClient[] = [
        {
          commande_id: 1,
          date_commande: '2024-01-01',
          statut: 'confirmee',
          total: 50.99,
          client: {
            id: 1,
            nom: 'John Doe',
            email: 'john@example.com',
          },
          articles: [],
        },
      ];

      mockRepository.getCommandesByStatut.mockResolvedValue(mockCommandes);

      const result = await resolvers.Query.getCommandesByStatut(null, {
        statut: 'confirmee',
      });

      expect(result).toEqual(mockCommandes);
      expect(mockRepository.getCommandesByStatut).toHaveBeenCalledWith('confirmee');
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - STATISTIQUES
  // ==========================================================================

  describe('Query: getMagasinStats', () => {
    it('devrait récupérer les statistiques du magasin', async () => {
      const mockStats: MagasinStats = {
        totalArticles: 50,
        totalCommandes: 100,
        totalRevenu: 5000,
        articlesEnRupture: 5,
        commandesEnAttente: 10,
      };

      mockRepository.getStats.mockResolvedValue(mockStats);

      const result = await resolvers.Query.getMagasinStats();

      expect(result).toEqual(mockStats);
      expect(mockRepository.getStats).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // TESTS DES QUERIES - VALIDATIONS
  // ==========================================================================

  describe('Query: articleExists', () => {
    it('devrait vérifier si un article existe', async () => {
      mockRepository.articleExists.mockResolvedValue(true);

      const result = await resolvers.Query.articleExists(null, { id: 1 });

      expect(result).toBe(true);
      expect(mockRepository.articleExists).toHaveBeenCalledWith(1);
    });

    it('devrait retourner false si article n\'existe pas', async () => {
      mockRepository.articleExists.mockResolvedValue(false);

      const result = await resolvers.Query.articleExists(null, { id: 999 });

      expect(result).toBe(false);
    });
  });

  describe('Query: checkStockSufficient', () => {
    it('devrait vérifier si le stock est suffisant', async () => {
      mockRepository.checkStockSufficient.mockResolvedValue(true);

      const result = await resolvers.Query.checkStockSufficient(null, {
        articleId: 1,
        tailleId: 1,
        quantite: 5,
      });

      expect(result).toBe(true);
      expect(mockRepository.checkStockSufficient).toHaveBeenCalledWith(1, 1, 5);
    });
  });

  // ==========================================================================
  // TESTS DES MUTATIONS - ARTICLES
  // ==========================================================================

  describe('Mutation: createArticle', () => {
    it('devrait créer un article avec succès', async () => {
      const mockInput = {
        nom: 'Nouveau T-Shirt',
        prix: 29.99,
        description: 'Description',
        categorie_id: 1,
        images: ['http://example.com/image.jpg'],
        stocks: [{ taille: 'M', quantite: 10 }],
      };

      const mockResponse = {
        isConfirm: true,
        message: 'Article créé avec succès',
        data: { id: 1 },
      };

      mockRepository.createArticle.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.createArticle(null, { input: mockInput });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('succès');
      expect(mockRepository.createArticle).toHaveBeenCalledWith(mockInput);
    });

    it('devrait gérer les erreurs de création', async () => {
      const mockInput = {
        nom: 'Nouveau T-Shirt',
        prix: 29.99,
        categorie_id: 1,
        images: [],
        stocks: [],
      };

      mockRepository.createArticle.mockRejectedValue(new Error('Database error'));

      const result = await resolvers.Mutation.createArticle(null, { input: mockInput });

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('Erreur');
    });
  });

  describe('Mutation: updateArticle', () => {
    it('devrait mettre à jour un article', async () => {
      const mockInput = {
        nom: 'T-Shirt Modifié',
        prix: 24.99,
      };

      const mockResponse = {
        isConfirm: true,
        message: 'Article mis à jour avec succès',
      };

      mockRepository.updateArticle.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.updateArticle(null, {
        id: 1,
        input: mockInput,
      });

      expect(result.isConfirm).toBe(true);
      expect(mockRepository.updateArticle).toHaveBeenCalledWith(1, mockInput);
    });
  });

  describe('Mutation: deleteArticle', () => {
    it('devrait supprimer un article', async () => {
      const mockResponse = {
        isConfirm: true,
        message: 'Article supprimé avec succès',
      };

      mockRepository.deleteArticle.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.deleteArticle(null, { id: 1 });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('supprimé');
      expect(mockRepository.deleteArticle).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // TESTS DES MUTATIONS - STOCKS
  // ==========================================================================

  describe('Mutation: addStock', () => {
    it('devrait ajouter du stock', async () => {
      const mockInput = {
        article_id: 1,
        taille_id: 1,
        quantite: 10,
      };

      const mockResponse = {
        isConfirm: true,
        message: 'Stock ajouté avec succès',
      };

      mockRepository.addStock.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.addStock(null, { input: mockInput });

      expect(result.isConfirm).toBe(true);
      expect(mockRepository.addStock).toHaveBeenCalledWith(mockInput);
    });
  });

  describe('Mutation: updateStock', () => {
    it('devrait mettre à jour un stock', async () => {
      const mockInput = {
        article_id: 1,
        taille_id: 1,
        quantite: 15,
      };

      const mockResponse = {
        isConfirm: true,
        message: 'Stock mis à jour avec succès',
      };

      mockRepository.updateStock.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.updateStock(null, { input: mockInput });

      expect(result.isConfirm).toBe(true);
      expect(mockRepository.updateStock).toHaveBeenCalledWith(mockInput);
    });
  });

  // ==========================================================================
  // TESTS DES MUTATIONS - COMMANDES
  // ==========================================================================

  describe('Mutation: createCommande', () => {
    it('devrait créer une commande', async () => {
      const mockInput = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            taille: 'M',
            quantite: 2,
            prix: 25.99,
          },
        ],
        total: 51.98,
      };

      const mockResponse = {
        isConfirm: true,
        message: 'Commande créée avec succès',
        data: { id: 1 },
      };

      mockRepository.createCommande.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.createCommande(null, { input: mockInput });

      expect(result.isConfirm).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(mockRepository.createCommande).toHaveBeenCalledWith(mockInput);
    });
  });

  describe('Mutation: updateCommandeStatut', () => {
    it('devrait mettre à jour le statut d\'une commande', async () => {
      const mockResponse = {
        isConfirm: true,
        message: 'Statut mis à jour avec succès',
      };

      mockRepository.updateCommandeStatut.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.updateCommandeStatut(null, {
        id: 1,
        statut: 'confirmee',
      });

      expect(result.isConfirm).toBe(true);
      expect(mockRepository.updateCommandeStatut).toHaveBeenCalledWith(1, 'confirmee');
    });
  });

  describe('Mutation: cancelCommande', () => {
    it('devrait annuler une commande', async () => {
      const mockResponse = {
        isConfirm: true,
        message: 'Commande annulée avec succès',
      };

      mockRepository.cancelCommande.mockResolvedValue(mockResponse);

      const result = await resolvers.Mutation.cancelCommande(null, { id: 1 });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('annulée');
      expect(mockRepository.cancelCommande).toHaveBeenCalledWith(1);
    });
  });
});
