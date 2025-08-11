import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Professeurs Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/professeurs', () => {
    it('should return all professors', async () => {
      // Setup mock for Professeurs client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT * FROM utilisateurs WHERE status_id = 5')) {
          callback(null, [
            {
              id: 10,
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean.dupont@example.com',
              status_id: 3,
              grade_id: 3
            },
            {
              id: 11,
              first_name: 'Marie',
              last_name: 'Martin',
              email: 'marie.martin@example.com',
              status_id: 3,
              grade_id: 2
            }
          ]);
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.get('/api/professeurs');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFind', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should handle database errors', async () => {
      // Force MySQL connector to throw an error for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await testRequest.get('/api/professeurs');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/professeurs/:id', () => {
    it('should return a specific professor', async () => {
      // Setup mock for Professeurs client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT * FROM utilisateurs WHERE id = ? AND status_id = 5')) {
          callback(null, [
            {
              id: 10,
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean.dupont@example.com',
              status_id: 3,
              grade_id: 3
            }
          ]);
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.get('/api/professeurs/10');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 10);
      expect(response.body).toHaveProperty('first_name', 'Jean');
      expect(response.body).toHaveProperty('last_name', 'Dupont');
    });

    it('should handle professor not found', async () => {
      // Setup mock for Professeurs client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(null, []);
      });

      const response = await testRequest.get('/api/professeurs/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/professeurs', () => {
    it('should add a new professor', async () => {
      // Setup mock for Professeurs client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT * FROM utilisateurs WHERE')) {
          // User doesn't exist yet
          callback(null, []);
        } else if (sql.includes('INSERT INTO utilisateurs')) {
          callback(null, { affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .post('/api/professeurs')
        .send({
          first_name: 'Nouveau',
          last_name: 'Professeur',
          nom_utilisateur: 'nouveauprof',
          email: 'nouveau.prof@example.com',
          genre_id: 1,
          date_of_birth: '1980-05-15',
          grade_id: 3,
          abonnement_id: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('isConfirm', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should update an existing user to professor', async () => {
      // Setup mock for Professeurs client
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('SELECT * FROM utilisateurs WHERE')) {
          // User exists but not as professor
          callback(null, [{ id: 5, status_id: 1 }]);
        } else if (sql.includes('UPDATE utilisateurs')) {
          callback(null, { affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .post('/api/professeurs')
        .send({
          first_name: 'Existing',
          last_name: 'User',
          email: 'existing.user@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isConfirm', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('mis à jour en professeur');
    });
  });
});
