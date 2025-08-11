import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Utilisateurs Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/utilisateurs', () => {
    it('should return all users', async () => {
      const response = await testRequest.get('/api/utilisateurs');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFind');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/utilisateurs/:id', () => {
    it('should return a specific user', async () => {
      const response = await testRequest.get('/api/utilisateurs/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFind');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data[0]).toHaveProperty('id', 1);
      expect(response.body.data[0]).toHaveProperty('first_name');
      expect(response.body.data[0]).toHaveProperty('last_name');
    });

    it('should handle user not found', async () => {
      const response = await testRequest.get('/api/utilisateurs/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/utilisateurs', () => {
    it('should create a new user', async () => {
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('INSERT INTO')) {
          callback(null, { insertId: 4, affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .post('/api/utilisateurs')
        .send({
          first_name: 'New',
          last_name: 'User',
          nom_utilisateur: 'newuser',
          email: 'new.user@example.com',
          genre_id: 1,
          date_of_birth: '1995-08-20',
          password: 'password123',
          status_id: 1,
          grade_id: 1,
          abonnement_id: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('insertId');
    });

    it('should validate request body', async () => {
      const response = await testRequest
        .post('/api/utilisateurs')
        .send({
          // Missing required fields
          first_name: 'New'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/utilisateurs/:id', () => {
    it('should update a user', async () => {
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('UPDATE utilisateurs')) {
          callback(null, { affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest
        .put('/api/utilisateurs/1')
        .send({
          id: 1,
          first_name: 'Updated',
          last_name: 'User',
          nom_utilisateur: 'updateduser',
          email: 'updated.user@example.com',
          genre_id: 1,
          date_of_birth: '1995-08-20',
          status_id: 1,
          grade_id: 1,
          abonnement_id: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isConfirm', true);
    });
  });

  describe('DELETE /api/utilisateurs/:id', () => {
    it('should delete a user', async () => {
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('DELETE FROM utilisateurs')) {
          callback(null, { affectedRows: 1 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.delete('/api/utilisateurs/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isConfirm', true);
    });

    it('should handle non-existent user', async () => {
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        if (sql.includes('DELETE FROM utilisateurs')) {
          callback(null, { affectedRows: 0 });
        } else {
          callback(null, []);
        }
      });

      const response = await testRequest.delete('/api/utilisateurs/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
});
