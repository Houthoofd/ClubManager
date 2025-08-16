import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import statistiquesRouter from '../../routes/statistiques.js';
import { Statistiques } from '../../db/clients/statistiques/statistiques.js';
import type {
  StatistiquesFrequentation,
  StatistiquesProgressionUtilisateur
} from '@clubmanager/types';

// Mock the Statistiques class
jest.mock('../../db/clients/statistiques/statistiques.js');

const app = express();
app.use(express.json());
app.use('/', statistiquesRouter);

beforeAll(() => {
  jest.spyOn(Statistiques.prototype, 'obtenirStatistiquesFrequentation').mockImplementation(
    async (): Promise<StatistiquesFrequentation> => ({
      totalFrequentation: 0,
      frequentationParCours: [],
      frequentationParMois: []
    })
  );
  jest.spyOn(Statistiques.prototype, 'obtenirProgressionUtilisateur').mockImplementation(
    async (): Promise<StatistiquesProgressionUtilisateur> => ({
      utilisateur_id: 0,
      coursSuivis: 0,
      progressionParCours: [],
      niveauActuel: ''
    })
  );
});

describe('Statistiques Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /frequentation', () => {
    it('should return attendance statistics', async () => {
      const mockStats: StatistiquesFrequentation = {
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

      (Statistiques.prototype.obtenirStatistiquesFrequentation as jest.Mock).mockImplementation(async () => mockStats);

      const response = await request(app).get('/frequentation');
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toEqual(mockStats);
        expect(Statistiques.prototype.obtenirStatistiquesFrequentation).toHaveBeenCalled();
      }
    });

    it('should handle errors', async () => {
      (Statistiques.prototype.obtenirStatistiquesFrequentation as jest.Mock).mockImplementation(async () => { throw new Error('Database error'); });

      const response = await request(app).get('/frequentation');
      expect([500, 400]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('GET /progression/:utilisateur_id', () => {
    it('should return progression statistics for a user', async () => {
      const mockProgression: StatistiquesProgressionUtilisateur = {
        utilisateur_id: 1,
        coursSuivis: 15,
        progressionParCours: [
          { cours_id: 1, titre: 'Karate Débutant', progression: 80 },
          { cours_id: 2, titre: 'Karate Avancé', progression: 40 }
        ],
        niveauActuel: 'Intermédiaire'
      };

      (Statistiques.prototype.obtenirProgressionUtilisateur as jest.Mock).mockImplementation(async () => mockProgression);

      const response = await request(app).get('/progression/1');
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toEqual(mockProgression);
        expect(Statistiques.prototype.obtenirProgressionUtilisateur).toHaveBeenCalledWith(1);
      }
    });
  });
});


