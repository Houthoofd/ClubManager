import request from 'supertest';
import express from 'express';
import compteRouter from '../../routes/compte.js';
import { Compte } from '../../db/clients/compte/compte.js';

// Mock de la classe Compte
jest.mock('../../db/clients/compte/compte.js');

const app = express();
app.use(express.json());
app.use('/', compteRouter);

describe('Compte Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /informations', () => {
    it('should return user data when user is found', async () => {
      const mockUser = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com'
      };

      (Compte.prototype.obtenirUnUtilisateurParSonNomEtPrenom as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockUser
      });

      const response = await request(app)
        .post('/informations')
        .send({ prenom: 'John', nom: 'Doe' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(Compte.prototype.obtenirUnUtilisateurParSonNomEtPrenom).toHaveBeenCalledWith('John', 'Doe');
    });

    it('should return 404 when user is not found', async () => {
      (Compte.prototype.obtenirUnUtilisateurParSonNomEtPrenom as jest.Mock).mockResolvedValue({
        isFind: false,
        data: []
      });

      const response = await request(app)
        .post('/informations')
        .send({ prenom: 'Unknown', nom: 'User' });
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun utilisateur trouvé.', data: [] });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/informations')
        .send({ prenom: 'John' }); // nom manquant
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Les champs 'prenom' et 'nom' sont requis." });
    });

    it('should handle server errors', async () => {
      (Compte.prototype.obtenirUnUtilisateurParSonNomEtPrenom as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/informations')
        .send({ prenom: 'John', nom: 'Doe' });
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erreur serveur');
    });
  });
});
