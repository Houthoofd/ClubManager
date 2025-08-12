import { jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response } from 'express';
import informationsRouter from '../../routes/informations.js';
import { Informations } from '../../db/clients/informations/informations.js';

// Mock the Informations class
jest.mock('../../db/clients/informations/informations.js');

const app = express();
app.use(express.json());
app.use('/', informationsRouter);

describe('Informations Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /grades', () => {
    it('should return all grades', async () => {
      const mockGrades = [
        { id: 1, nom: 'Ceinture blanche', ordre: 1 },
        { id: 2, nom: 'Ceinture jaune', ordre: 2 }
      ];

      (Informations.prototype.obtenirLesGrades as jest.Mock).mockResolvedValue(mockGrades);

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGrades);
      expect(Informations.prototype.obtenirLesGrades).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when no grades are found', async () => {
      (Informations.prototype.obtenirLesGrades as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun grade trouvé.' });
    });

    it('should handle errors', async () => {
      (Informations.prototype.obtenirLesGrades as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erreur serveur lors de la récupération des grades.' });
    });
  });

  describe('GET /genres', () => {
    it('should return all genres', async () => {
      const mockGenres = [
        { id: 1, nom: 'Homme' },
        { id: 2, nom: 'Femme' }
      ];

      (Informations.prototype.obtenirLesGenres as jest.Mock).mockResolvedValue(mockGenres);

      const response = await request(app).get('/genres');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGenres);
      expect(Informations.prototype.obtenirLesGenres).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when no genres are found', async () => {
      (Informations.prototype.obtenirLesGenres as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/genres');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun genres trouvé.' });
    });
  });

  describe('GET /status', () => {
    it('should return all statuses', async () => {
      const mockStatus = [
        { id: 1, nom: 'Utilisateur' },
        { id: 2, nom: 'Admin' }
      ];

      (Informations.prototype.obtenirLeStatus as jest.Mock).mockResolvedValue(mockStatus);

      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
    });
  });

  describe('GET /abonnements', () => {
    it('should return all pricing plans', async () => {
      const mockPlans = [
        { id: 1, nom_plan: 'Basic', prix: 50.00 },
        { id: 2, nom_plan: 'Premium', prix: 100.00 }
      ];

      (Informations.prototype.obtenirLesPlansTarifaires as jest.Mock).mockResolvedValue(mockPlans);

      const response = await request(app).get('/abonnements');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlans);
    });
  });
});
