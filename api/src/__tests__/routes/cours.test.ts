import { jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response } from 'express';
import coursRouter from '../../routes/cours.js';
import { Cours } from '../../db/clients/cours/cours.js';
import { z } from 'zod';

// Mock zod schemas and validation
jest.mock('@clubmanager/types', () => ({
  datareservationSchema: {
    parse: jest.fn((data) => data)
  },
  datannulationSchema: {
    parse: jest.fn((data) => data)
  },
  datavalidationSchema: {
    parse: jest.fn((data) => data)
  }
}));

// Mock the Cours class
jest.mock('../../db/clients/cours/cours.js');

const app = express();
app.use(express.json());
app.use('/', coursRouter);

describe('Cours Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all courses', async () => {
      const mockCourses = [
        { id: 1, titre: 'Karate débutant', description: 'Cours pour débutants', professeur_id: 1 },
        { id: 2, titre: 'Karate avancé', description: 'Cours avancé', professeur_id: 2 }
      ];

      (Cours.prototype.obtenirTousLesCours as jest.Mock).mockResolvedValue(mockCourses);

      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCourses);
    });

    it('should return 404 when no courses are found', async () => {
      (Cours.prototype.obtenirTousLesCours as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun cours à venir trouvé.' });
    });
  });

  describe('POST /participant', () => {
    it('should return courses for a participant', async () => {
      const mockParticipantId = 1;
      const mockCourses = [
        { id: 1, titre: 'Karate débutant', jour: 'Lundi' }
      ];

      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockResolvedValue(mockParticipantId);
      (Cours.prototype.obtenirLesCoursPourParticipant as jest.Mock).mockResolvedValue(mockCourses);

      const response = await request(app)
        .post('/participant')
        .send({ nom: 'Doe', prenom: 'John' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCourses);
      expect(Cours.prototype.obtenirIdParticipantParNomPrenom).toHaveBeenCalledWith('Doe', 'John');
      expect(Cours.prototype.obtenirLesCoursPourParticipant).toHaveBeenCalledWith(mockParticipantId);
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/participant')
        .send({ nom: 'Doe' }); // Missing prenom
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Nom et prénom requis.' });
    });
  });

  describe('GET /:coursId', () => {
    it('should return users for a specific course', async () => {
      const mockUsersForCourse = {
        cours_id: 1,
        titre: 'Karate débutant',
        utilisateurs: [{ id: 1, nom: 'Doe', prenom: 'John' }]
      };

      (Cours.prototype.obtenirUtilisateursParticipantsParCours as jest.Mock).mockResolvedValue(mockUsersForCourse);

      const response = await request(app).get('/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { Cours: mockUsersForCourse },
        message: 'Cours récupéré avec succès'
      });
    });
  });

  describe('POST /inscription', () => {
    it('should enroll a user in a course when not already enrolled', async () => {
      const mockData = { cours_id: 1, nom: 'Doe', prenom: 'John' };

      (Cours.prototype.verifierInscriptionUtilisateur as jest.Mock).mockResolvedValue({
        isBooked: false,
        data: { userId: 1 }
      });

      (Cours.prototype.inscrireUtilisateurAuCours as jest.Mock).mockResolvedValue({
        isConfirm: true
      });

      const response = await request(app)
        .post('/inscription')
        .send(mockData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Utilisateur inscrit avec succès.',
        userId: { userId: 1 },
        coursId: 1
      });
    });

    it('should return 409 when user is already enrolled', async () => {
      const mockData = { cours_id: 1, nom: 'Doe', prenom: 'John' };

      (Cours.prototype.verifierInscriptionUtilisateur as jest.Mock).mockResolvedValue({
        isBooked: true
      });

      const response = await request(app)
        .post('/inscription')
        .send(mockData);
      
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Utilisateur déjà inscrit au cours.' });
    });
  });

  describe('PATCH /inscription/annulation', () => {
    it('should cancel a course registration', async () => {
      const mockData = { cours_id: 1, utilisateur_id: 1 };

      (Cours.prototype.annulerUtilisateurAuCours as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .patch('/inscription/annulation')
        .send(mockData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Présence annulée avec succès.' });
    });

    it('should return 404 if registration not found', async () => {
      const mockData = { cours_id: 1, utilisateur_id: 1 };

      (Cours.prototype.annulerUtilisateurAuCours as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .patch('/inscription/annulation')
        .send(mockData);
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Présence non trouvée ou déjà annulée.' });
    });
  });

  describe('DELETE /annulation', () => {
    it('should unenroll a user from a course', async () => {
      const mockData = { cours_id: 1, utilisateur_id: 1 };

      (Cours.prototype.desinscrireUtilisateurDuCours as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/annulation')
        .send(mockData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Réservation annulée avec succès.' });
    });
  });

  describe('GET /informations/planning', () => {
    it('should return course schedule days', async () => {
      const mockJours = [
        { id: 1, jour: 'Lundi' },
        { id: 2, jour: 'Mercredi' }
      ];

      (Cours.prototype.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(mockJours);

      const response = await request(app).get('/informations/planning');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJours);
    });
  });
});
