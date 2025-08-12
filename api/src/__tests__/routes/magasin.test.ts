import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import magasinRouter from '../../routes/magasin.js';
import { Magasin } from '../../db/clients/magasin/magasin.js';

// Mock la classe Magasin entière
jest.mock('../../db/clients/magasin/magasin.js');

const app = express();
app.use(express.json());
app.use('/magasin', magasinRouter);

describe('Magasin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /magasin/articles', () => {
    it('should return articles grouped by categories', async () => {
      const mockArticles = [
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
      ];

      // Cast explicite pour éviter erreurs TS sur la méthode mockée
      (Magasin.prototype.obtenirArticlesParCategories as jest.Mock).mockResolvedValue(mockArticles);

      const response = await request(app).get('/magasin/articles');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockArticles);
      expect(Magasin.prototype.obtenirArticlesParCategories).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      (Magasin.prototype.obtenirArticlesParCategories as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/magasin/articles');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erreur lors de la récupération des articles.' });
    });
  });

  describe('GET /magasin/articles/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, nom: 'Vêtements' },
        { id: 2, nom: 'Accessoires' }
      ];

      (Magasin.prototype.obtenirLesCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app).get('/magasin/articles/categories');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
    });
  });

  describe('POST /magasin/articles/ajouter', () => {
    it('should add a new article successfully', async () => {
      const mockArticleData = {
        nom: 'T-shirt',
        prix: 25.99,
        description: 'T-shirt du club',
        categorie_id: 1,
        images: ['image1.jpg'],
        stocks: [{ taille: 'M', quantite: 10 }]
      };

      (Magasin.prototype.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: 'Article ajouté avec succès'
      });

      const response = await request(app)
        .post('/magasin/articles/ajouter')
        .send(mockArticleData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Article ajouté avec succès'
      });
    });

    it('should handle validation errors', async () => {
      const invalidArticleData = {
        nom: 'T-shirt'
        // champs obligatoires manquants
      };

      const response = await request(app)
        .post('/magasin/articles/ajouter')
        .send(invalidArticleData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Erreur de validation des données.');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /magasin/articles/:id', () => {
    it('should delete an article by ID', async () => {
      (Magasin.prototype.supprimerArticle as jest.Mock).mockResolvedValue({
        message: 'Article supprimé avec succès'
      });

      const response = await request(app).delete('/magasin/articles/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Article supprimé avec succès' });
      expect(Magasin.prototype.supprimerArticle).toHaveBeenCalledWith(1);
    });
  });

  describe('PUT /magasin/articles/:id', () => {
    it('should update an article', async () => {
      const updateData = {
        nom: 'T-shirt Updated',
        prix: 29.99,
        description: 'T-shirt du club mis à jour',
        categorie_id: 1,
        images: ['image1.jpg'],
        stocks: [{ taille: 'M', quantite: 10 }]
      };

      (Magasin.prototype.modifierArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: 'Article modifié avec succès'
      });

      const response = await request(app)
        .put('/magasin/articles/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Article modifié avec succès' });
    });
  });

  describe('POST /magasin/commandes/ajouter', () => {
    it('should create a new order', async () => {
      const mockOrderData = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 2, prix: 25.99, taille: 'M' }
        ],
        total: 51.98,
        statut: 'en_attente'
      };

      (Magasin.prototype.creerCommande as jest.Mock).mockResolvedValue({
        message: 'Commande créée avec succès'
      });

      const response = await request(app)
        .post('/magasin/commandes/ajouter')
        .send(mockOrderData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Commande créée avec succès' });
    });
  });

  describe('GET /magasin/commandes', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        {
          id: 1,
          utilisateur_id: 1,
          statut: 'en_attente',
          date: '2023-05-01T12:00:00Z',
          total: 51.98
        }
      ];

      (Magasin.prototype.obtenirLesCommandes as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app).get('/magasin/commandes');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ commandes: mockOrders });
    });
  });
});
