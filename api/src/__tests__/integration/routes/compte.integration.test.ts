import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Compte Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/compte/informations', () => {
    it('should return user information', async () => {
      // Setup mock for Compte client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT * FROM utilisateurs WHERE')) {
          callback(null, [
            {
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              nom_utilisateur: 'johndoe'
            }
          ]);
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .post('/api/compte/informations')
        .send({
          prenom: 'John',
          nom: 'Doe'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('first_name', 'John');
      expect(response.body).toHaveProperty('last_name', 'Doe');
    });

    it('should handle missing parameters', async () => {
      const response = await testRequest
        .post('/api/compte/informations')
        .send({
          // Missing required fields
          prenom: 'John'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle user not found', async () => {
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(null, []);
      });

      const response = await testRequest
        .post('/api/compte/informations')
        .send({
          prenom: 'Unknown',
          nom: 'User'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Aucun utilisateur trouvé');
    });
  });

  // Add more tests for other compte endpoints as needed
});
