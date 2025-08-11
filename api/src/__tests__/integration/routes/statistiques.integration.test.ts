import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Statistiques Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/statistiques/frequentation', () => {
    it('should return attendance statistics', async () => {
      // Setup mock for Statistiques client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      let queryCount = 0;
      
      mockInstance.query.mockImplementation((sql, values, callback) => {
        queryCount++;
        
        if (queryCount === 1) {
          // First query: total attendance
          callback(null, [{ total: 120 }]);
        } else if (queryCount === 2) {
          // Second query: attendance by course
          callback(null, [
            { cours_id: 1, titre: 'Karate débutant', frequentation: 50 },
            { cours_id: 2, titre: 'Karate avancé', frequentation: 70 }
          ]);
        } else {
          // Third query: attendance by month
          callback(null, [
            { mois: 'Janvier', frequentation: 30 },
            { mois: 'Février', frequentation: 40 },
            { mois: 'Mars', frequentation: 50 }
          ]);
        }
      });

      const response = await testRequest.get('/api/statistiques/frequentation');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalFrequentation');
      expect(response.body).toHaveProperty('frequentationParCours');
      expect(response.body).toHaveProperty('frequentationParMois');
      expect(response.body.totalFrequentation).toBe(120);
      expect(Array.isArray(response.body.frequentationParCours)).toBe(true);
      expect(Array.isArray(response.body.frequentationParMois)).toBe(true);
    });

    it('should handle database errors', async () => {
      // Force MySQL connector to throw an error for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await testRequest.get('/api/statistiques/frequentation');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/statistiques/progression/:userId', () => {
    it('should return user progression data', async () => {
      // Setup mock for Statistiques client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      let queryCount = 0;
      
      mockInstance.query.mockImplementation((sql, values, callback) => {
        queryCount++;
        
        if (queryCount === 1) {
          // First query: courses completed
          callback(null, [{ total: 15 }]);
        } else {
          // Second query: progression by course
          callback(null, [
            { cours_id: 1, titre: 'Karate débutant', cours_suivis: 10, progression: 80 },
            { cours_id: 2, titre: 'Karate avancé', cours_suivis: 5, progression: 40 }
          ]);
        }
      });

      const response = await testRequest.get('/api/statistiques/progression/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('utilisateur_id', '1'); // Note: path params are strings
      expect(response.body).toHaveProperty('coursSuivis');
      expect(response.body).toHaveProperty('progressionParCours');
      expect(response.body).toHaveProperty('niveauActuel');
      expect(Array.isArray(response.body.progressionParCours)).toBe(true);
    });
  });

  describe('GET /api/statistiques/presence/:userId', () => {
    it('should return attendance by month for a user', async () => {
      // Setup mock for Statistiques client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(null, [
          { mois: 1, annee: 2023, nombre_presences: 8 },
          { mois: 2, annee: 2023, nombre_presences: 10 }
        ]);
      });

      const response = await testRequest.get('/api/statistiques/presence/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('mois');
      expect(response.body[0]).toHaveProperty('annee');
      expect(response.body[0]).toHaveProperty('label');
      expect(response.body[0]).toHaveProperty('nombre_presences');
    });
  });
});
