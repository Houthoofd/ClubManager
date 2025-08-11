import request from 'supertest';
import express from 'express';
import professeursRouter from '../../routes/professeurs.js';
import { Professeurs } from '../../db/clients/professeurs/professeurs.js';

// Mock the Professeurs class
jest.mock('../../db/clients/professeurs/professeurs.js');

const app = express();
app.use(express.json());
app.use('/professeurs', professeursRouter);

describe('Professeurs Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /professeurs', () => {
    it('should return all instructors', async () => {
      // Mock data
      const mockProfesseurs = [
        { id: 1, nom: 'Dupont', prenom: 'Jean', specialite: 'Karate' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', specialite: 'Judo' }
      ];

      // Mock implementation
      (Professeurs.prototype.obtenirLesProfesseurs as jest.Mock).mockResolvedValue(mockProfesseurs);

      // Execute request
      const response = await request(app).get('/professeurs');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfesseurs);
      expect(Professeurs.prototype.obtenirLesProfesseurs).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock implementation
      (Professeurs.prototype.obtenirLesProfesseurs as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Execute request
      const response = await request(app).get('/professeurs');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /professeurs/:id', () => {
    it('should return a specific instructor by ID', async () => {
      // Mock data
      const mockProfesseur = { 
        id: 1, 
        nom: 'Dupont', 
        prenom: 'Jean', 
        specialite: 'Karate' 
      };

      // Mock implementation
      (Professeurs.prototype.obtenirProfesseurParId as jest.Mock).mockResolvedValue(mockProfesseur);

      // Execute request
      const response = await request(app).get('/professeurs/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfesseur);
      expect(Professeurs.prototype.obtenirProfesseurParId).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /professeurs', () => {
    it('should create a new instructor', async () => {
      // Mock data
      const newProfesseur = {
        nom: 'Dubois',
        prenom: 'Marie',
        specialite: 'Tai Chi'
      };

      const createdProfesseur = {
        id: 3,
        ...newProfesseur
      };

      // Mock implementation
      (Professeurs.prototype.ajouterUnProfesseur as jest.Mock).mockResolvedValue(createdProfesseur);

      // Execute request
      const response = await request(app)
        .post('/professeurs')
        .send(newProfesseur);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdProfesseur);
      expect(Professeurs.prototype.ajouterUnProfesseur).toHaveBeenCalledWith(newProfesseur);
    });
  });
});
