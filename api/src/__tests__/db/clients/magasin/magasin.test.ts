import { jest } from '@jest/globals';
import { Magasin } from '../../../../db/clients/magasin/magasin.js';
import { Pool } from 'pg';

// Mock the PostgreSQL Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      release: jest.fn()
    })),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Magasin Client', () => {
  let magasinClient: Magasin;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    magasinClient = new Magasin();
    mockPool = (Pool as unknown as jest.Mock).mock.results[0].value;
  });

  describe('obtenirArticlesParCategories', () => {
    it('should return articles grouped by categories', async () => {
      const mockCategories = [{ id: 1, nom: 'Vêtements' }];
      const mockArticles = [{
        id: 1,
        nom: 'T-shirt',
        prix: 25.99,
        description: 'T-shirt du club',
        categorie_id: 1,
        images: ['image1.jpg']
      }];
      const mockStocks = [{ article_id: 1, taille: 'M', quantite: 10 }];

      mockPool.query.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM categories')) {
          return Promise.resolve({ rows: mockCategories });
        } else if (query.includes('SELECT * FROM articles')) {
          return Promise.resolve({ rows: mockArticles });
        } else if (query.includes('SELECT * FROM stocks')) {
          return Promise.resolve({ rows: mockStocks });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await magasinClient.obtenirArticlesParCategories();

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(result).toEqual([
        {
          categorie_id: 1,
          nom_categorie: 'Vêtements',
          articles: [
            {
              id: 1,
              nom: 'T-shirt',
              prix: 25.99,
              description: 'T-shirt du club',
              categorie_id: 1,
              images: ['image1.jpg'],
              stocks: [{ taille: 'M', quantite: 10 }]
            }
          ]
        }
      ]);
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(magasinClient.obtenirArticlesParCategories()).rejects.toThrow('Database error');
    });
  });

  describe('obtenirLesCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        { id: 1, nom: 'Vêtements' },
        { id: 2, nom: 'Accessoires' }
      ];

      mockPool.query.mockResolvedValue({ rows: mockCategories });

      const result = await magasinClient.obtenirLesCategories();

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM categories');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('ajouterArticle', () => {
    it('should add a new article with stocks', async () => {
      const articleData = {
        nom: 'T-shirt',
        prix: 25.99,
        description: 'T-shirt du club',
        categorie_id: 1,
        images: ['image1.jpg'],
        stocks: [{ taille: 'M', quantite: 10 }]
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO articles')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      mockPool.connect.mockResolvedValue(mockClient);

      const result = await magasinClient.ajouterArticle(articleData);

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO articles'),
        expect.any(Array)
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isConfirm: true,
        message: expect.any(String)
      });
    });
  });

  describe('supprimerArticle', () => {
    it('should delete an article by ID', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const result = await magasinClient.supprimerArticle(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM articles'),
        [1]
      );
      expect(result).toEqual({
        message: expect.stringContaining('supprimé')
      });
    });

    it('should return not found message when article does not exist', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      const result = await magasinClient.supprimerArticle(999);

      expect(result).toEqual({
        message: 'Article non trouvé'
      });
    });
  });

  describe('modifierArticle', () => {
    it('should update an article', async () => {
      const updateData = {
        id: 1,
        nom: 'T-shirt Updated',
        prix: 29.99,
        description: 'T-shirt du club mis à jour',
        categorie_id: 1,
        images: ['image1.jpg'],
        stocks: [{ taille: 'M', quantite: 10 }]
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('UPDATE articles')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      mockPool.connect.mockResolvedValue(mockClient);

      const result = await magasinClient.modifierArticle(1, updateData);

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isConfirm: true,
        message: expect.any(String)
      });
    });
  });

  describe('creerCommande', () => {
    it('should create a new order', async () => {
      const utilisateur_id = 1;
      const articles = [
        { article_id: 1, quantite: 2, prix: 25.99, taille: 'M' }
      ];
      const total = 51.98;
      const date = new Date().toISOString();

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO commandes')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      mockPool.connect.mockResolvedValue(mockClient);

      const result = await magasinClient.creerCommande(utilisateur_id, articles, total, date);

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: expect.stringContaining('Commande créée avec succès'),
        commande_id: 1
      });
    });
  });


  describe('obtenirLesCommandes', () => {
    it('should fetch all orders with their details', async () => {
      const mockCommandes = [
        {
          id: 1,
          utilisateur_id: 1,
          statut: 'en_attente',
          date: '2023-05-01T12:00:00Z',
          total: 51.98
        }
      ];

      const mockArticlesCommande = [
        {
          commande_id: 1,
          article_id: 1,
          quantite: 2,
          prix: 25.99,
          taille: 'M'
        }
      ];

      mockPool.query.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM commandes')) {
          return Promise.resolve({ rows: mockCommandes });
        } else if (query.includes('SELECT * FROM articles_commande')) {
          return Promise.resolve({ rows: mockArticlesCommande });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await magasinClient.obtenirLesCommandes();

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          utilisateur_id: 1,
          articles: expect.arrayContaining([
            expect.objectContaining({
              article_id: 1,
              quantite: 2
            })
          ])
        })
      ]));
    });
  });
});
