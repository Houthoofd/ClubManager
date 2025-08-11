import request from 'supertest';
import express from 'express';
import paiementRouter from '../../routes/paiements.js';
import { Paiements } from '../../db/clients/paiements/paiements.js';

// Mock de la classe Paiements
jest.mock('../../db/clients/paiements/paiements.js');

const app = express();
app.use(express.json());
app.use('/paiements', paiementRouter);

describe('Paiements Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /paiements', () => {
    it('should return all payments', async () => {
      // Données fictives qui seraient renvoyées par le client de base de données
      const mockPayments = [
        {
          id: 1,
          utilisateur_id: 1,
          date: '2023-05-01',
          montant: 100,
          statut: 'complété',
          abonnement_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          nom_plan: 'Abonnement Standard'
        },
        {
          id: 2,
          utilisateur_id: 2,
          date: '2023-05-15',
          montant: 150,
          statut: 'en attente',
          abonnement_id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          nom_plan: 'Abonnement Premium'
        }
      ];

      // Configuration de l'implémentation fictive pour la méthode du client de base de données
      (Paiements.prototype.obtenirLesTousLesPaiements as jest.Mock).mockResolvedValue(mockPayments);

      // Effectuer la requête
      const response = await request(app).get('/');
      
      // Vérifier la réponse
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPayments);
      expect(Paiements.prototype.obtenirLesTousLesPaiements).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      // Simuler une erreur du client de base de données
      (Paiements.prototype.obtenirLesTousLesPaiements as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Effectuer la requête
      const response = await request(app).get('/');

      // Vérifier la gestion des erreurs
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Erreur lors de la récupération des paiements');
    });
  });

  describe('POST /paiements', () => {
    it('should create a new payment', async () => {
      const newPaiement = {
        utilisateur_id: 3,
        montant: 100.0,
        description: 'Cotisation annuelle'
      };

      const createdPaiement = {
        id: 3,
        ...newPaiement,
        date: expect.any(String),
        statut: 'en attente'
      };

      (Paiements.prototype.creerPaiement as jest.Mock).mockResolvedValue(createdPaiement);

      const response = await request(app)
        .post('/paiements')
        .send(newPaiement);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdPaiement);
      expect(Paiements.prototype.creerPaiement).toHaveBeenCalledWith(expect.objectContaining(newPaiement));
    });
  });

  describe('GET /paiements/utilisateur/:id', () => {
    it('should return payments for a specific user', async () => {
      const mockUserPaiements = [
        { id: 1, utilisateur_id: 1, montant: 50.0, date: '2023-01-15', statut: 'complété' }
      ];

      (Paiements.prototype.obtenirPaiementsParUtilisateur as jest.Mock).mockResolvedValue(mockUserPaiements);

      const response = await request(app).get('/paiements/utilisateur/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserPaiements);
      expect(Paiements.prototype.obtenirPaiementsParUtilisateur).toHaveBeenCalledWith(1);
    });
  });
});
