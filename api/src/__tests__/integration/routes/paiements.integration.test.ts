import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Paiements Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/paiements', () => {
    it('should return all payments', async () => {
      // Setup mock for Paiements client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT paiements.*')) {
          callback(null, [
            {
              id: 1,
              utilisateur_id: 1,
              montant: 100,
              date: '2023-01-15',
              statut: 'complété',
              abonnement_id: 1,
              first_name: 'John',
              last_name: 'Doe',
              nom_plan: 'Standard'
            },
            {
              id: 2,
              utilisateur_id: 2,
              montant: 150,
              date: '2023-02-20',
              statut: 'en attente',
              abonnement_id: 2,
              first_name: 'Jane',
              last_name: 'Smith',
              nom_plan: 'Premium'
            }
          ]);
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.get('/api/paiements');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('utilisateur_id');
      expect(response.body[0]).toHaveProperty('montant');
      expect(response.body[0]).toHaveProperty('date');
      expect(response.body[0]).toHaveProperty('first_name');
      expect(response.body[0]).toHaveProperty('last_name');
    });

    it('should handle database errors', async () => {
      // Force MySQL connector to throw an error for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await testRequest.get('/api/paiements');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/paiements/utilisateur/:id', () => {
    it('should return payments for a specific user', async () => {
      // Setup mock for Paiements client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('WHERE paiements.utilisateur_id = ?')) {
          callback(null, [
            {
              id: 1,
              utilisateur_id: 1,
              montant: 100,
              date: '2023-01-15',
              statut: 'complété',
              abonnement_id: 1,
              first_name: 'John',
              last_name: 'Doe',
              nom_plan: 'Standard'
            }
          ]);
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.get('/api/paiements/utilisateur/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('utilisateur_id', 1);
    });
  });

  describe('POST /api/paiements', () => {
    it('should create a new payment', async () => {
      // Setup mock for Paiements client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('INSERT INTO paiements')) {
          callback(null, { insertId: 3, affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .post('/api/paiements')
        .send({
          utilisateur_id: 1,
          montant: 100,
          description: 'Cotisation annuelle',
          abonnement_id: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('utilisateur_id', 1);
      expect(response.body).toHaveProperty('montant', 100);
      expect(response.body).toHaveProperty('description', 'Cotisation annuelle');
      expect(response.body).toHaveProperty('statut', 'en attente');
    });

    it('should validate request body', async () => {
      const response = await testRequest
        .post('/api/paiements')
        .send({
          // Missing required fields
          utilisateur_id: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
