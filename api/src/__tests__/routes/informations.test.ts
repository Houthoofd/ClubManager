import { jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response } from 'express';
import informationsRouter from '../../routes/informations.js';
import { Informations } from '../../db/clients/informations/informations.js';
// Importez les types directement depuis le package types
import type { Grade, Abonnement, Genres, Status } from '@clubmanager/types/dist/index.js';

// Mock the Informations class
jest.mock('../../db/clients/informations/informations.js');

const app = express();
app.use(express.json());
app.use('/', informationsRouter);


describe('Informations Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Correction : supprimez le mock sur le prototype et mockez directement la classe
    jest.spyOn(Informations.prototype, 'obtenirLesGrades').mockImplementation(async () => []);
    jest.spyOn(Informations.prototype, 'obtenirLesGenres').mockImplementation(async () => []);
    jest.spyOn(Informations.prototype, 'obtenirLeStatus').mockImplementation(async () => []);
    jest.spyOn(Informations.prototype, 'obtenirLesPlansTarifaires').mockImplementation(async () => []);
  });

  describe('GET /grades', () => {
    it('should return all grades', async () => {
      // Correction : utilisez .mockImplementationOnce pour retourner la valeur attendue
      (Informations.prototype.obtenirLesGrades as jest.Mock).mockImplementationOnce(async () => [
        { id: 1, nom: 'Ceinture blanche' },
        { id: 2, nom: 'Ceinture jaune' }
      ]);

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, nom: 'Ceinture blanche' },
        { id: 2, nom: 'Ceinture jaune' }
      ]);
      expect(Informations.prototype.obtenirLesGrades).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when no grades are found', async () => {
      (Informations.prototype.obtenirLesGrades as jest.Mock).mockImplementationOnce(async () => []);

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun grade trouvé.' });
    });

    it('should handle errors', async () => {
      (Informations.prototype.obtenirLesGrades as jest.Mock).mockImplementationOnce(async () => { throw new Error('Database error'); });

      const response = await request(app).get('/grades');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erreur serveur lors de la récupération des grades.' });
    });
  });

  describe('GET /genres', () => {
    it('should return all genres', async () => {
      // Correction : utilisez .mockImplementationOnce pour retourner la valeur attendue
      (Informations.prototype.obtenirLesGenres as jest.Mock).mockImplementationOnce(async () => [
        { id: 1, nom: 'Homme' },
        { id: 2, nom: 'Femme' }
      ]);

      const response = await request(app).get('/genres');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, nom: 'Homme' },
        { id: 2, nom: 'Femme' }
      ]);
      expect(Informations.prototype.obtenirLesGenres).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when no genres are found', async () => {
      (Informations.prototype.obtenirLesGenres as jest.Mock).mockImplementationOnce(async () => []);

      const response = await request(app).get('/genres');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun genres trouvé.' });
    });
  });

  describe('GET /status', () => {
    it('should return all statuses', async () => {
      (Informations.prototype.obtenirLeStatus as jest.Mock).mockImplementationOnce(async () => [
        { id: 1, nom: 'Utilisateur' },
        { id: 2, nom: 'Admin' }
      ]);

      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, nom: 'Utilisateur' },
        { id: 2, nom: 'Admin' }
      ]);
    });
  });

  describe('GET /abonnements', () => {
    it('should return all pricing plans', async () => {
      (Informations.prototype.obtenirLesPlansTarifaires as jest.Mock).mockImplementationOnce(async () => [
        { id: 1, nom: 'Basic' },
        { id: 2, nom: 'Premium' }
      ]);

      const response = await request(app).get('/abonnements');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, nom: 'Basic' },
        { id: 2, nom: 'Premium' }
      ]);
    });
  });
});
