import { testRequest, setupIntegrationTest } from '../setup.js';
import { resetMocks } from '../mockDatabase.js';

// Setup for all tests in this file
setupIntegrationTest();

describe('Cours Routes Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/cours', () => {
    it('should return all upcoming courses', async () => {
      const response = await testRequest.get('/api/cours');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('date_cours');
      expect(response.body[0]).toHaveProperty('type_cours');
      expect(response.body[0]).toHaveProperty('heure_debut');
      expect(response.body[0]).toHaveProperty('heure_fin');
    });

    it('should handle database errors', async () => {
      // Force MySQL connector to throw an error for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockMysqlConnector = require('../../../db/connector/mysqlconnector.js');
      const mockInstance = mockMysqlConnector.mock.instances[0];
      mockInstance.query.mockImplementation((sql, values, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await testRequest.get('/api/cours');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Erreur');
    });
  });

  describe('GET /api/cours/jours', () => {
    it('should return all course days', async () => {
      const response = await testRequest.get('/api/cours/jours');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/cours/participant', () => {
    it('should return courses for a participant', async () => {
      const response = await testRequest
        .post('/api/cours/participant')
        .send({
          nom: 'Doe',
          prenom: 'John'
        });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('date_cours');
        expect(response.body[0]).toHaveProperty('type_cours');
      }
    });

    it('should handle participant not found', async () => {
      const response = await testRequest
        .post('/api/cours/participant')
        .send({
          nom: 'Unknown',
          prenom: 'User'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/cours/recurrent', () => {
    it('should add a recurring course', async () => {
      const response = await testRequest
        .post('/api/cours/recurrent')
        .send({
          jour_semaine: 'lundi',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
          professeurs: [1, 2]
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isConfirm', true);
    });

    it('should validate request body', async () => {
      const response = await testRequest
        .post('/api/cours/recurrent')
        .send({
          // Missing required fields
          jour_semaine: 'lundi'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/cours/jour/:jourSemaine', () => {
    it('should delete courses for a specific day', async () => {
      const response = await testRequest.delete('/api/cours/jour/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isConfirm', true);
    });
  });

  describe('GET /api/cours/:id/participants', () => {
    it('should return participants for a specific course', async () => {
      const response = await testRequest.get('/api/cours/1/participants');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('utilisateurs');
      expect(Array.isArray(response.body.utilisateurs)).toBe(true);
    });
  });
});
