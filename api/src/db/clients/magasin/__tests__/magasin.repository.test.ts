/**
 * Tests unitaires pour MagasinRepository
 */

import { MagasinRepository, getMagasinRepository } from '../magasin.repository.js';
import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  ArticleAvecRelationsRow,
  StockDetailRow,
  CategorieRow,
  TailleRow,
  CommandeAvecClientRow,
} from '../types.js';

// Mock du MysqlConnector
jest.mock('../../../connector/mysqlconnector.js');

describe('MagasinRepository', () => {
  let repository: MagasinRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();

    // Mock de la méthode query
    mockQuery = jest.fn();

    // Mock de getInstance pour retourner un objet avec query mocké
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue({
      query: mockQuery,
    });

    // Créer une nouvelle instance du repository
    repository = new MagasinRepository();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // TESTS DE LECTURE D'ARTICLES
  // ==========================================================================

  describe('getAllArticles', () => {
    it('devrait récupérer tous les articles avec succès', async () => {
      const mockRows: ArticleAvecRelationsRow[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: 'T-shirt confortable',
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: 'http://example.com/image1.jpg',
          stock_taille: 'M',
          stock_quantite: 10,
        },
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: 'T-shirt confortable',
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: 'http://example.com/image1.jpg',
          stock_taille: 'L',
          stock_quantite: 5,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getAllArticles();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].nom).toBe('T-Shirt');
      expect(result[0].stocks).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockError = new Error('Database error');

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(mockError, null);
      });

      await expect(repository.getAllArticles()).rejects.toThrow('Database error');
    });

    it('devrait retourner un tableau vide si aucun article', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      const result = await repository.getAllArticles();

      expect(result).toEqual([]);
    });
  });

  describe('getArticleById', () => {
    it('devrait récupérer un article par ID', async () => {
      const mockRows: ArticleAvecRelationsRow[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: 'T-shirt confortable',
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: 'http://example.com/image1.jpg',
          stock_taille: 'M',
          stock_quantite: 10,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getArticleById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.nom).toBe('T-Shirt');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function));
    });

    it('devrait retourner null si article non trouvé', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      const result = await repository.getArticleById(999);

      expect(result).toBeNull();
    });
  });

  describe('getArticlesParCategories', () => {
    it('devrait organiser les articles par catégories', async () => {
      const mockRows: ArticleAvecRelationsRow[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: null,
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: null,
          stock_taille: 'M',
          stock_quantite: 10,
        },
        {
          id: 2,
          nom: 'Casquette',
          prix: 15.99,
          description: null,
          categorie_id: 2,
          categorie_nom: 'Accessoires',
          image_url: null,
          stock_taille: 'Unique',
          stock_quantite: 20,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getArticlesParCategories();

      expect(result).toHaveProperty('Vêtements');
      expect(result).toHaveProperty('Accessoires');
      expect(result['Vêtements']).toHaveLength(1);
      expect(result['Accessoires']).toHaveLength(1);
    });
  });

  describe('searchArticlesByName', () => {
    it('devrait rechercher des articles par nom', async () => {
      const mockRows: ArticleAvecRelationsRow[] = [
        {
          id: 1,
          nom: 'T-Shirt Blanc',
          prix: 25.99,
          description: null,
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: null,
          stock_taille: null,
          stock_quantite: null,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.searchArticlesByName('Shirt');

      expect(result).toHaveLength(1);
      expect(result[0].nom).toContain('Shirt');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['%Shirt%'],
        expect.any(Function)
      );
    });
  });

  describe('searchArticlesByPriceRange', () => {
    it('devrait rechercher des articles par plage de prix', async () => {
      const mockRows: ArticleAvecRelationsRow[] = [
        {
          id: 1,
          nom: 'T-Shirt',
          prix: 25.99,
          description: null,
          categorie_id: 1,
          categorie_nom: 'Vêtements',
          image_url: null,
          stock_taille: null,
          stock_quantite: null,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.searchArticlesByPriceRange(20, 30);

      expect(result).toHaveLength(1);
      expect(result[0].prix).toBeGreaterThanOrEqual(20);
      expect(result[0].prix).toBeLessThanOrEqual(30);
    });
  });

  // ==========================================================================
  // TESTS DE LECTURE DE STOCKS
  // ==========================================================================

  describe('getAllStocks', () => {
    it('devrait récupérer tous les stocks', async () => {
      const mockRows: StockDetailRow[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille_nom: 'M',
          quantite: 10,
        },
        {
          id: 2,
          article_id: 1,
          taille_id: 2,
          taille_nom: 'L',
          quantite: 5,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getAllStocks();

      expect(result).toHaveLength(2);
      expect(result[0].quantite).toBe(10);
    });
  });

  describe('getStocksByArticle', () => {
    it('devrait récupérer les stocks d\'un article', async () => {
      const mockRows: StockDetailRow[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille_nom: 'M',
          quantite: 10,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getStocksByArticle(1);

      expect(result).toHaveLength(1);
      expect(result[0].article_id).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function));
    });
  });

  describe('getStockByArticleAndTaille', () => {
    it('devrait récupérer un stock spécifique', async () => {
      const mockRows: StockDetailRow[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille_nom: 'M',
          quantite: 10,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getStockByArticleAndTaille(1, 1);

      expect(result).not.toBeNull();
      expect(result?.quantite).toBe(10);
    });

    it('devrait retourner null si stock non trouvé', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      const result = await repository.getStockByArticleAndTaille(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('getLowStockArticles', () => {
    it('devrait récupérer les articles avec stock faible', async () => {
      const mockRows: StockDetailRow[] = [
        {
          id: 1,
          article_id: 1,
          taille_id: 1,
          taille_nom: 'M',
          quantite: 3,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getLowStockArticles(5);

      expect(result).toHaveLength(1);
      expect(result[0].quantite).toBeLessThanOrEqual(5);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [5], expect.any(Function));
    });
  });

  // ==========================================================================
  // TESTS DE LECTURE DE CATÉGORIES
  // ==========================================================================

  describe('getAllCategories', () => {
    it('devrait récupérer toutes les catégories', async () => {
      const mockRows: CategorieRow[] = [
        { id: 1, nom: 'Vêtements' },
        { id: 2, nom: 'Accessoires' },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getAllCategories();

      expect(result).toHaveLength(2);
      expect(result[0].nom).toBe('Vêtements');
    });
  });

  describe('getCategorieById', () => {
    it('devrait récupérer une catégorie par ID', async () => {
      const mockRows: CategorieRow[] = [{ id: 1, nom: 'Vêtements' }];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getCategorieById(1);

      expect(result).not.toBeNull();
      expect(result?.nom).toBe('Vêtements');
    });
  });

  describe('getCategorieByName', () => {
    it('devrait récupérer une catégorie par nom', async () => {
      const mockRows: CategorieRow[] = [{ id: 1, nom: 'Vêtements' }];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getCategorieByName('Vêtements');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });
  });

  // ==========================================================================
  // TESTS DE LECTURE DE TAILLES
  // ==========================================================================

  describe('getAllTailles', () => {
    it('devrait récupérer toutes les tailles', async () => {
      const mockRows: TailleRow[] = [
        { id: 1, nom: 'S' },
        { id: 2, nom: 'M' },
        { id: 3, nom: 'L' },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getAllTailles();

      expect(result).toHaveLength(3);
      expect(result[1].nom).toBe('M');
    });
  });

  describe('getTailleMap', () => {
    it('devrait créer une map des tailles', async () => {
      const mockRows: TailleRow[] = [
        { id: 1, nom: 'S' },
        { id: 2, nom: 'M' },
        { id: 3, nom: 'L' },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getTailleMap();

      expect(result).toHaveProperty('S', 1);
      expect(result).toHaveProperty('M', 2);
      expect(result).toHaveProperty('L', 3);
    });
  });

  // ==========================================================================
  // TESTS DE LECTURE DE COMMANDES
  // ==========================================================================

  describe('getAllCommandes', () => {
    it('devrait récupérer toutes les commandes', async () => {
      const mockRows: CommandeAvecClientRow[] = [
        {
          commande_id: 1,
          date_commande: new Date('2024-01-01'),
          statut: 'en_attente',
          total: 50.99,
          utilisateur_id: 1,
          client_nom: 'John Doe',
          client_email: 'john@example.com',
          article_id: 1,
          article_nom: 'T-Shirt',
          taille: 'M',
          quantite: 2,
          prix: 25.99,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getAllCommandes();

      expect(result).toHaveLength(1);
      expect(result[0].commande_id).toBe(1);
      expect(result[0].client.nom).toBe('John Doe');
    });
  });

  describe('getCommandeById', () => {
    it('devrait récupérer une commande par ID', async () => {
      const mockRows: CommandeAvecClientRow[] = [
        {
          commande_id: 1,
          date_commande: new Date('2024-01-01'),
          statut: 'en_attente',
          total: 50.99,
          utilisateur_id: 1,
          client_nom: 'John Doe',
          client_email: 'john@example.com',
          article_id: 1,
          article_nom: 'T-Shirt',
          taille: 'M',
          quantite: 2,
          prix: 25.99,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getCommandeById(1);

      expect(result).not.toBeNull();
      expect(result?.commande_id).toBe(1);
    });
  });

  describe('getCommandesByUser', () => {
    it('devrait récupérer les commandes d\'un utilisateur', async () => {
      const mockRows: CommandeAvecClientRow[] = [
        {
          commande_id: 1,
          date_commande: new Date('2024-01-01'),
          statut: 'en_attente',
          total: 50.99,
          utilisateur_id: 1,
          client_nom: 'John Doe',
          client_email: 'john@example.com',
          article_id: 1,
          article_nom: 'T-Shirt',
          taille: 'M',
          quantite: 2,
          prix: 25.99,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getCommandesByUser(1);

      expect(result).toHaveLength(1);
      expect(result[0].client.id).toBe(1);
    });
  });

  describe('getCommandesByStatut', () => {
    it('devrait récupérer les commandes par statut', async () => {
      const mockRows: CommandeAvecClientRow[] = [
        {
          commande_id: 1,
          date_commande: new Date('2024-01-01'),
          statut: 'en_attente',
          total: 50.99,
          utilisateur_id: 1,
          client_nom: 'John Doe',
          client_email: 'john@example.com',
          article_id: 1,
          article_nom: 'T-Shirt',
          taille: 'M',
          quantite: 2,
          prix: 25.99,
        },
      ];

      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, mockRows);
      });

      const result = await repository.getCommandesByStatut('en_attente');

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe('en_attente');
    });
  });

  // ==========================================================================
  // TESTS DE CRÉATION
  // ==========================================================================

  describe('createArticle', () => {
    it('devrait créer un article avec succès', async () => {
      const mockTailleRows: TailleRow[] = [
        { id: 1, nom: 'M' },
        { id: 2, nom: 'L' },
      ];

      let callCount = 0;
      mockQuery.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          // INSERT article
          callback(null, { insertId: 1 });
        } else if (callCount === 2) {
          // INSERT images
          callback(null, { insertId: 1 });
        } else if (callCount === 3) {
          // SELECT tailles
          callback(null, mockTailleRows);
        } else if (callCount === 4) {
          // INSERT stocks
          callback(null, { insertId: 1 });
        }
      });

      const result = await repository.createArticle({
        nom: 'Nouveau T-Shirt',
        prix: 29.99,
        description: 'Description',
        categorie_id: 1,
        images: ['http://example.com/image.jpg'],
        stocks: [
          { taille: 'M', quantite: 10 },
          { taille: 'L', quantite: 5 },
        ],
      });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('succès');
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const result = await repository.createArticle({
        nom: 'Nouveau T-Shirt',
        prix: 29.99,
        categorie_id: 1,
        images: [],
        stocks: [],
      });

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('Erreur');
    });
  });

  describe('updateArticle', () => {
    it('devrait mettre à jour un article', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.updateArticle(1, {
        nom: 'T-Shirt Modifié',
        prix: 24.99,
      });

      expect(result.isConfirm).toBe(true);
    });
  });

  describe('deleteArticle', () => {
    it('devrait supprimer un article avec succès', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.deleteArticle(1);

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('supprimé');
    });
  });

  // ==========================================================================
  // TESTS DE GESTION DES STOCKS
  // ==========================================================================

  describe('addStock', () => {
    it('devrait ajouter du stock si n\'existe pas', async () => {
      let callCount = 0;
      mockQuery.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          // CHECK_STOCK_EXISTS
          callback(null, [{ count: 0 }]);
        } else if (callCount === 2) {
          // INSERT_STOCK
          callback(null, { insertId: 1 });
        }
      });

      const result = await repository.addStock({
        article_id: 1,
        taille_id: 1,
        quantite: 10,
      });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('ajouté');
    });

    it('devrait mettre à jour le stock si existe déjà', async () => {
      let callCount = 0;
      mockQuery.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          // CHECK_STOCK_EXISTS
          callback(null, [{ count: 1 }]);
        } else if (callCount === 2) {
          // INCREMENT_STOCK_QUANTITY
          callback(null, { affectedRows: 1 });
        }
      });

      const result = await repository.addStock({
        article_id: 1,
        taille_id: 1,
        quantite: 10,
      });

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('mis à jour');
    });
  });

  describe('updateStock', () => {
    it('devrait mettre à jour la quantité d\'un stock', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.updateStock({
        article_id: 1,
        taille_id: 1,
        quantite: 15,
      });

      expect(result.isConfirm).toBe(true);
    });
  });

  // ==========================================================================
  // TESTS DE CRÉATION DE COMMANDES
  // ==========================================================================

  describe('createCommande', () => {
    it('devrait créer une commande avec succès', async () => {
      const mockTailleRows: TailleRow[] = [{ id: 1, nom: 'M' }];

      let callCount = 0;
      mockQuery.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          // SELECT tailles
          callback(null, mockTailleRows);
        } else if (callCount === 2) {
          // INSERT commande
          callback(null, { insertId: 1 });
        } else if (callCount === 3) {
          // INSERT articles_commandes
          callback(null, { insertId: 1 });
        } else if (callCount === 4) {
          // DECREMENT stock
          callback(null, { affectedRows: 1 });
        }
      });

      const result = await repository.createCommande({
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
      });

      expect(result.isConfirm).toBe(true);
    });
  });

  describe('updateCommandeStatut', () => {
    it('devrait mettre à jour le statut d\'une commande', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.updateCommandeStatut(1, 'confirmee');

      expect(result.isConfirm).toBe(true);
    });
  });

  describe('cancelCommande', () => {
    it('devrait annuler une commande', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.cancelCommande(1);

      expect(result.isConfirm).toBe(true);
      expect(result.message).toContain('annulée');
    });
  });

  // ==========================================================================
  // TESTS DE VALIDATION
  // ==========================================================================

  describe('articleExists', () => {
    it('devrait retourner true si l\'article existe', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, [{ count: 1 }]);
      });

      const result = await repository.articleExists(1);

      expect(result).toBe(true);
    });

    it('devrait retourner false si l\'article n\'existe pas', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, [{ count: 0 }]);
      });

      const result = await repository.articleExists(999);

      expect(result).toBe(false);
    });
  });

  describe('categorieExists', () => {
    it('devrait vérifier l\'existence d\'une catégorie', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, [{ count: 1 }]);
      });

      const result = await repository.categorieExists(1);

      expect(result).toBe(true);
    });
  });

  describe('checkStockSufficient', () => {
    it('devrait retourner true si le stock est suffisant', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, [{ quantite: 10 }]);
      });

      const result = await repository.checkStockSufficient(1, 1, 5);

      expect(result).toBe(true);
    });

    it('devrait retourner false si le stock est insuffisant', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, [{ quantite: 3 }]);
      });

      const result = await repository.checkStockSufficient(1, 1, 5);

      expect(result).toBe(false);
    });

    it('devrait retourner false si le stock n\'existe pas', async () => {
      mockQuery.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      const result = await repository.checkStockSufficient(1, 1, 5);

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // TESTS STATISTIQUES
  // ==========================================================================

  describe('getStats', () => {
    it('devrait récupérer les statistiques du magasin', async () => {
      let callCount = 0;
      mockQuery.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, [{ total: 50 }]);
        } else if (callCount === 2) {
          callback(null, [{ total: 100 }]);
        } else if (callCount === 3) {
          callback(null, [{ total_revenue: 5000 }]);
        } else if (callCount === 4) {
          callback(null, [{ total: 5 }]);
        } else if (callCount === 5) {
          callback(null, [{ total: 10 }]);
        }
      });

      const result = await repository.getStats();

      expect(result.totalArticles).toBe(50);
      expect(result.totalCommandes).toBe(100);
      expect(result.totalRevenu).toBe(5000);
      expect(result.articlesEnRupture).toBe(5);
      expect(result.commandesEnAttente).toBe(10);
    });
  });

  // ==========================================================================
  // TESTS SINGLETON
  // ==========================================================================

  describe('getMagasinRepository (Singleton)', () => {
    it('devrait retourner la même instance', () => {
      const instance1 = getMagasinRepository();
      const instance2 = getMagasinRepository();

      expect(instance1).toBe(instance2);
    });
  });
});
