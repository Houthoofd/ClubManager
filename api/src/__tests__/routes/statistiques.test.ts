import request from 'supertest';
import express from 'express';
import statistiquesRouter from '../../routes/statistiques.js';
import { Statistiques } from '../../db/clients/statistiques/statistiques.js';

// Mock the Statistiques class
jest.mock('../../db/clients/statistiques/statistiques.js');

const app = express();
app.use(express.json());
app.use('/', statistiquesRouter);

describe('Statistiques Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /frequentation', () => {
    it('should return attendance statistics', async () => {
      // Mock data
      const mockStats = {
        totalFrequentation: 120,
        frequentationParCours: [
          { cours_id: 1, titre: 'Karate Débutant', frequentation: 50 },
          { cours_id: 2, titre: 'Karate Avancé', frequentation: 70 }
        ],
        frequentationParMois: [
          { mois: 'Janvier', frequentation: 30 },
          { mois: 'Février', frequentation: 40 },
          { mois: 'Mars', frequentation: 50 }
        ]
      };

      // Mock implementation
      (Statistiques.prototype.obtenirStatistiquesFrequentation as jest.Mock).mockResolvedValue(mockStats);

      // Execute request
      const response = await request(app).get('/frequentation');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(Statistiques.prototype.obtenirStatistiquesFrequentation).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock implementation
      (Statistiques.prototype.obtenirStatistiquesFrequentation as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Execute request
      const response = await request(app).get('/frequentation');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /progression/:utilisateur_id', () => {
    it('should return progression statistics for a user', async () => {
      // Mock data
      const mockProgression = {
        utilisateur_id: 1,
        coursSuivis: 15,
        progressionParCours: [
          { cours_id: 1, titre: 'Karate Débutant', progression: 80 },
          { cours_id: 2, titre: 'Karate Avancé', progression: 40 }
        ],
        niveauActuel: 'Intermédiaire'
      };

      // Mock implementation
      (Statistiques.prototype.obtenirProgressionUtilisateur as jest.Mock).mockResolvedValue(mockProgression);

      // Execute request
      const response = await request(app).get('/progression/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgression);
      expect(Statistiques.prototype.obtenirProgressionUtilisateur).toHaveBeenCalledWith(1);
    });
  });
});
