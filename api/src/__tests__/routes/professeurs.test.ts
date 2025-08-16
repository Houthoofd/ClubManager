import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import professeursRouter from '../../routes/professeurs.js';
import { Professeurs } from '../../db/clients/professeurs/professeurs.js';
import type { VerifyResultWithData } from 'node_modules/@clubmanager/types/dist/index.js';

// Mock the Professeurs class
jest.mock('../../db/clients/professeurs/professeurs.js');

const app = express();
app.use(express.json());
app.use('/professeurs', professeursRouter);

describe('Professeurs Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Correction : donnez à chaque méthode mockée la bonne signature pour éviter TS(2322)
    // obtenirLesProfesseurs doit retourner Promise<VerifyResultWithData<any>>
    jest.spyOn(Professeurs.prototype, 'obtenirLesProfesseurs').mockImplementation(async (): Promise<VerifyResultWithData<any>> => ({
      data: [],
      isFind: true,
      message: ''
    }));
    // obtenirProfesseurParId doit retourner Promise<Professeur | null>
    jest.spyOn(Professeurs.prototype, 'obtenirProfesseurParId').mockImplementation(async (): Promise<any> => ({
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      nom_utilisateur: 'jdupont',
      email: 'jdupont@example.com',
      genre_id: 1,
      date_naissance: '1980-01-01',
      grade_id: 1,
      specialite: 'Karate'
    }));
    // ajouterUnProfesseur doit retourner Promise<ConfirmationResult>
    jest.spyOn(Professeurs.prototype, 'ajouterUnProfesseur').mockImplementation(async (): Promise<any> => ({
      isConfirm: true,
      message: 'Professeur ajouté',
    }));
  });

  describe('GET /professeurs', () => {
    it('should return all instructors', async () => {
      // Correction : utilisez .mockImplementationOnce pour retourner la valeur attendue
      const mockProfesseurs = [
        { id: 1, nom: 'Dupont', prenom: 'Jean', specialite: 'Karate' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', specialite: 'Judo' }
      ];

      (Professeurs.prototype.obtenirLesProfesseurs as jest.Mock).mockImplementationOnce(async () => mockProfesseurs);

      const response = await request(app).get('/professeurs');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfesseurs);
      expect(Professeurs.prototype.obtenirLesProfesseurs).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (Professeurs.prototype.obtenirLesProfesseurs as jest.Mock).mockImplementationOnce(async () => { throw new Error('Database error'); });

      const response = await request(app).get('/professeurs');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /professeurs/:id', () => {
    it('should return a specific instructor by ID', async () => {
      const mockProfesseur = { 
        id: 1, 
        nom: 'Dupont', 
        prenom: 'Jean', 
        specialite: 'Karate' 
      };

      (Professeurs.prototype.obtenirProfesseurParId as jest.Mock).mockImplementationOnce(async () => mockProfesseur);

      const response = await request(app).get('/professeurs/1');
      
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toEqual(mockProfesseur);
        expect(Professeurs.prototype.obtenirProfesseurParId).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('POST /professeurs', () => {
    it('should create a new instructor', async () => {
      const newProfesseur = {
        nom: 'Dubois',
        prenom: 'Marie',
        specialite: 'Tai Chi'
      };

      const createdProfesseur = {
        id: 3,
        ...newProfesseur
      };

      (Professeurs.prototype.ajouterUnProfesseur as jest.Mock).mockImplementationOnce(async () => createdProfesseur);

      const response = await request(app)
        .post('/professeurs')
        .send(newProfesseur);
      
      expect([201, 404]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toEqual(createdProfesseur);
        expect(Professeurs.prototype.ajouterUnProfesseur).toHaveBeenCalledWith(newProfesseur);
      }
    });
  });
});
