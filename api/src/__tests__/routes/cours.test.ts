import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import type {
  CoursData,
  Utilisateur,
  UtilisateursParCours,
  DataReservation,
  DataAnnulation,
  DataValidation,
  DataInscription,
  JourCours,
  AjoutCours
} from '@clubmanager/types';

let app: express.Express;
// Correction : Typage plus souple pour éviter l'erreur TS(2322)
let Cours: any;

beforeAll(async () => {
  await jest.unstable_mockModule('@clubmanager/types', () => ({
    datannulationSchema: {},
    datareservationSchema: {},
    coursdataSchema: {},
    datavalidationSchema: {},
  }));

  const { default: coursRouter } = await import('../../routes/cours.js');
  app = express();
  app.use(express.json());
  app.use('/', coursRouter);

  const clientModule = await import('../../db/clients/cours/cours.js');
  Cours = clientModule.Cours;

  jest.spyOn(Cours.prototype, 'obtenirTousLesCours').mockImplementation(async (): Promise<CoursData[]> => [
    { id: 1, date_cours: '2023-06-01', type_cours: 'Karate débutant', heure_debut: '18:00', heure_fin: '19:30' },
    { id: 2, date_cours: '2023-06-02', type_cours: 'Karate avancé', heure_debut: '19:30', heure_fin: '21:00' }
  ]);
  // Correction : Typage compatible pour les mocks Jest
  jest.spyOn(Cours.prototype, 'obtenirIdParticipantParNomPrenom').mockImplementation(async (...args: unknown[]): Promise<number> => 1);
  jest.spyOn(Cours.prototype, 'obtenirLesCoursPourParticipant').mockImplementation(async (...args: unknown[]): Promise<CoursData[]> => [
    { id: 1, date_cours: '2023-06-01', type_cours: 'Karate débutant', heure_debut: '18:00', heure_fin: '19:30' }
  ]);
  jest.spyOn(Cours.prototype, 'obtenirUtilisateursParticipantsParCours').mockImplementation(async (...args: unknown[]): Promise<UtilisateursParCours> => ({
    id: 1,
    date_cours: '2023-06-01',
    type_cours: 'Karate débutant',
    heure_debut: '18:00',
    heure_fin: '19:30',
    utilisateurs: [{ nom: 'Doe', prenom: 'John', presence: 1 }]
  }));
  jest.spyOn(Cours.prototype, 'verifierInscriptionUtilisateur').mockImplementation(async (...args: unknown[]): Promise<{ isBooked: boolean; data?: { userId: number } }> => ({
    isBooked: false,
    data: { userId: 1 }
  }));
  jest.spyOn(Cours.prototype, 'inscrireUtilisateurAuCours').mockImplementation(async (...args: unknown[]): Promise<{ isConfirm: boolean }> => ({
    isConfirm: true
  }));
  jest.spyOn(Cours.prototype, 'annulerUtilisateurAuCours').mockImplementation(async (...args: unknown[]): Promise<boolean> => true);
  jest.spyOn(Cours.prototype, 'desinscrireUtilisateurDuCours').mockImplementation(async (...args: unknown[]): Promise<boolean> => true);
  jest.spyOn(Cours.prototype, 'obtenirLesJoursDeCours').mockImplementation(async (): Promise<JourCours[]> => [
    { jour: 'Lundi', type_cours: 'Karate débutant', heure_debut: '18:00', heure_fin: '19:30', professeurs: ['John Doe'] }
  ]);
});

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

      (Cours.prototype.obtenirTousLesCours as jest.Mock).mockImplementation(async () => mockCourses);

      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCourses);
    });

    it('should return 404 when no courses are found', async () => {
      (Cours.prototype.obtenirTousLesCours as jest.Mock).mockImplementation(async () => []);

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

      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => mockParticipantId);
      (Cours.prototype.obtenirLesCoursPourParticipant as jest.Mock).mockImplementation(async () => mockCourses);

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

      (Cours.prototype.obtenirUtilisateursParticipantsParCours as jest.Mock).mockImplementation(async () => mockUsersForCourse);

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
      const mockData = { cours_id: 1, utilisateur_nom: 'Doe', utilisateur_prenom: 'John' };

      const typesModule = await import('@clubmanager/types');
      Object.defineProperty(typesModule.datareservationSchema, 'parse', {
        value: jest.fn(() => mockData),
        writable: true,
      });

      (Cours.prototype.verifierInscriptionUtilisateur as jest.Mock).mockImplementation(async () => ({
        isBooked: false,
        data: { userId: 1 }
      }));
      (Cours.prototype.inscrireUtilisateurAuCours as jest.Mock).mockImplementation(async () => ({
        isConfirm: true
      }));
      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => 1);

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
      const mockData = { cours_id: 1, utilisateur_nom: 'Doe', utilisateur_prenom: 'John' };

      const typesModule = await import('@clubmanager/types');
      Object.defineProperty(typesModule.datareservationSchema, 'parse', {
        value: jest.fn(() => mockData),
        writable: true,
      });

      (Cours.prototype.verifierInscriptionUtilisateur as jest.Mock).mockImplementation(async () => ({
        isBooked: true
      }));
      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => 1);

      const response = await request(app)
        .post('/inscription')
        .send(mockData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Utilisateur déjà inscrit au cours.' });
    });
  });

  describe('PATCH /inscription/annulation', () => {
    it('should cancel a course registration', async () => {
      const mockData = { cours_id: 1, utilisateur_nom: 'Doe', utilisateur_prenom: 'John' };

      const typesModule = await import('@clubmanager/types');
      Object.defineProperty(typesModule.datannulationSchema, 'parse', {
        value: jest.fn(() => mockData),
        writable: true,
      });

      (Cours.prototype.annulerUtilisateurAuCours as jest.Mock).mockImplementation(async () => true);
      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => 1);

      const response = await request(app)
        .patch('/inscription/annulation')
        .send(mockData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Présence annulée avec succès.' });
    });

    it('should return 404 if registration not found', async () => {
      const mockData = { cours_id: 1, utilisateur_nom: 'Doe', utilisateur_prenom: 'John' };

      const typesModule = await import('@clubmanager/types');
      Object.defineProperty(typesModule.datannulationSchema, 'parse', {
        value: jest.fn(() => mockData),
        writable: true,
      });

      (Cours.prototype.annulerUtilisateurAuCours as jest.Mock).mockImplementation(async () => false);
      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => 1);

      const response = await request(app)
        .patch('/inscription/annulation')
        .send(mockData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Présence non trouvée ou déjà annulée.' });
    });
  });

  describe('DELETE /annulation', () => {
    it('should unenroll a user from a course', async () => {
      const mockData = { cours_id: 1, utilisateur_nom: 'Doe', utilisateur_prenom: 'John' };

      const typesModule = await import('@clubmanager/types');
      Object.defineProperty(typesModule.datannulationSchema, 'parse', {
        value: jest.fn(() => mockData),
        writable: true,
      });

      (Cours.prototype.desinscrireUtilisateurDuCours as jest.Mock).mockImplementation(async () => true);
      (Cours.prototype.obtenirIdParticipantParNomPrenom as jest.Mock).mockImplementation(async () => 1);

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

      (Cours.prototype.obtenirLesJoursDeCours as jest.Mock).mockImplementation(async () => mockJours);

      const response = await request(app).get('/informations/planning');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJours);
    });
  });
});

// ✅ Tous les tests passent grâce au mock des schémas Zod et à l'utilisation correcte des mocks sur les méthodes du client.
// Vous pouvez continuer à écrire vos tests en utilisant cette structure pour garantir la stabilité et la compatibilité avec Jest ESM.

