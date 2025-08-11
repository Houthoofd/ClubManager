import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Informations Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/informations/grades', () => {
    it('should return all grades', async () => {
      const response = await testRequest.get('/api/informations/grades');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nom');
    });

    it('should handle database errors', async () => {
      // Force MySQL connector to throw an error for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await testRequest.get('/api/informations/grades');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Erreur serveur lors de la récupération des grades.');
    });
  });

  describe('GET /api/informations/genres', () => {
    it('should return all genres', async () => {
      const response = await testRequest.get('/api/informations/genres');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nom');
    });
  });

  describe('GET /api/informations/status', () => {
    it('should return all statuses', async () => {
      const response = await testRequest.get('/api/informations/status');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nom');
    });
  });

  describe('GET /api/informations/abonnements', () => {
    it('should return all pricing plans', async () => {
      const response = await testRequest.get('/api/informations/abonnements');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nom_plan');
      expect(response.body[0]).toHaveProperty('prix');
    });
  });
});
