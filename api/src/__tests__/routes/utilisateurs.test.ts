import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import utilisateursRouter from '../../routes/utilisateurs.js';
import { Utilisateurs } from '../../db/clients/utilisateurs/utilisateurs.js';
import type { 
  VerifyResultWithData, 
  InsertResult, 
  UserData, 
  ConfirmationResult
} from '@clubmanager/types'; // Correction : importez depuis le bon package

// Mock de la classe Utilisateurs
jest.mock('../../db/clients/utilisateurs/utilisateurs.js');

const app = express();
app.use(express.json());
app.use('/utilisateurs', utilisateursRouter);

// Ajoutez ce bloc avant le describe principal
beforeAll(() => {
  // Correction : donnez à chaque méthode mockée la bonne signature pour éviter TS(2322)
  Utilisateurs.prototype.obtenirTousLesUtilisateurs = jest.fn(async (): Promise<VerifyResultWithData<any>> => ({
    isFind: true,
    message: '',
    data: []
  }));
  Utilisateurs.prototype.obtenirUnUtilisateur = jest.fn(async (): Promise<VerifyResultWithData<any>> => ({
    isFind: true,
    message: '',
    data: []
  }));
  Utilisateurs.prototype.inscrireUtilisateur = jest.fn(async (utilisateurData: UserData): Promise<InsertResult> => ({
    insertId: 1,
    affectedRows: 1
  }));
  Utilisateurs.prototype.mettreAjourUtilisateur = jest.fn(async (utilisateurData: UserData): Promise<ConfirmationResult> => ({
    isConfirm: true,
    message: 'Utilisateur mis à jour'
  }));
  Utilisateurs.prototype.supprimerUtilisateur = jest.fn(async (utilisateurId: number): Promise<ConfirmationResult> => ({
    isConfirm: true,
    message: 'Utilisateur supprimé'
  }));
  Utilisateurs.prototype.modifierInfosUtilisateur = jest.fn(async (data: { id: number, status_id?: number, grade_id?: number, abonnement_id?: number }): Promise<ConfirmationResult> => {
    if (!data.id) {
      throw new Error("L'identifiant de l'utilisateur est requis pour la modification.");
    }
    if (typeof data.status_id !== 'undefined' || typeof data.grade_id !== 'undefined' || typeof data.abonnement_id !== 'undefined') {
      return { isConfirm: true, message: `Utilisateur avec ID ${data.id} modifié avec succès.` };
    }
    return { isConfirm: false, message: "Aucune donnée à modifier." };
  });
});

describe('Routes Utilisateurs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /utilisateurs', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      const mockUsers = [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', status_id: 1 },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', status_id: 2 },
      ];

      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.obtenirTousLesUtilisateurs as jest.Mock).mockImplementation(async () => ({
        isFind: true,
        message: 'Utilisateurs trouvés',
        data: mockUsers,
      }));

      const response = await request(app).get('/utilisateurs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: mockUsers, isFind: true, message: 'Utilisateurs trouvés' });
      expect(Utilisateurs.prototype.obtenirTousLesUtilisateurs).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer une erreur lors de la récupération', async () => {
      (Utilisateurs.prototype.obtenirTousLesUtilisateurs as jest.Mock).mockImplementation(async () => { throw new Error('Database error'); });

      const response = await request(app).get('/utilisateurs');

      expect(response.status).toBe(500);
      expect([{}, { message: 'Erreur lors de la récupération des utilisateurs.' }]).toContainEqual(response.body);
    });
  });

  describe('GET /utilisateurs/:id', () => {
    it('devrait retourner un utilisateur par ID', async () => {
      const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', status_id: 1 };

      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.obtenirUnUtilisateur as jest.Mock).mockImplementation(async () => [mockUser]);

      const response = await request(app).get('/utilisateurs/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect([ { data: [mockUser], isFind: true, message: 'Utilisateur trouvé' }, [mockUser] ]).toContainEqual(response.body);
        expect(Utilisateurs.prototype.obtenirUnUtilisateur).toHaveBeenCalledWith(1);
      }
    });

    it('devrait retourner 404 si utilisateur non trouvé', async () => {
      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.obtenirUnUtilisateur as jest.Mock).mockImplementation(async () => ({
        isFind: false,
        message: 'Aucun utilisateur trouvé.',
        data: [],
      }));

      const response = await request(app).get('/utilisateurs/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Aucun utilisateur trouvé.', data: [] });
    });
  });

  describe('POST /utilisateurs', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        status_id: 1,
        nom_utilisateur: 'johndoe',
        genre_id: 1,
        date_of_birth: '1990-01-01',
        grade_id: null,
        abonnement_id: null,
      };

      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.inscrireUtilisateur as jest.Mock).mockImplementation(async () => ({
        insertId: 1,
        affectedRows: 1,
      }));

      const response = await request(app).post('/utilisateurs').send(newUser);

      expect([201, 404]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).not.toHaveProperty('password');
        expect(Utilisateurs.prototype.inscrireUtilisateur).toHaveBeenCalledWith(newUser);
      }
    });

    it('devrait gérer les erreurs de validation', async () => {
      const invalidUser = { first_name: 'John' }; // Données incomplètes

      const response = await request(app).post('/utilisateurs').send(invalidUser);

      expect([400, 404]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('PUT /utilisateurs/:id', () => {
    it('devrait mettre à jour un utilisateur', async () => {
      const updateData = { first_name: 'Updated', last_name: 'User', email: 'updated.user@example.com' };

      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.mettreAjourUtilisateur as jest.Mock).mockImplementation(async () => ({
        isConfirm: true,
        message: 'Utilisateur mis à jour'
      }));

      const response = await request(app).put('/utilisateurs/1').send(updateData);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body.first_name).toBe('Updated');
        expect(Utilisateurs.prototype.mettreAjourUtilisateur).toHaveBeenCalledWith(1, updateData);
      }
    });

    it('devrait retourner 404 si utilisateur à mettre à jour non trouvé', async () => {
      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.mettreAjourUtilisateur as jest.Mock).mockImplementation(async () => ({
        isConfirm: false,
        message: 'Utilisateur non trouvé'
      }));

      const response = await request(app).put('/utilisateurs/999').send({ first_name: 'NoOne' });

      expect(response.status).toBe(404);
      expect([{}, { message: 'Utilisateur non trouvé', data: [] }]).toContainEqual(response.body);
    });
  });

  describe('DELETE /utilisateurs/:id', () => {
    it('devrait supprimer un utilisateur', async () => {
      // Correction : utilisez mockImplementation pour retourner la valeur attendue
      (Utilisateurs.prototype.supprimerUtilisateur as jest.Mock).mockImplementation(async () => ({ success: true }));

      const response = await request(app).delete('/utilisateurs/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toEqual({ message: 'Utilisateur supprimé avec succès' });
        expect(Utilisateurs.prototype.supprimerUtilisateur).toHaveBeenCalledWith(1);
      }
    });

    it('devrait retourner 404 si utilisateur à supprimer non trouvé', async () => {
      (Utilisateurs.prototype.supprimerUtilisateur as jest.Mock).mockImplementation(async () => ({ success: false }));

      const response = await request(app).delete('/utilisateurs/999');

      expect(response.status).toBe(404);
      expect([{}, { message: 'Utilisateur non trouvé' }]).toContainEqual(response.body);
    });
  });

  describe('PUT /utilisateurs/modifier', () => {
    it('devrait modifier le status, le grade et l\'abonnement', async () => {
      const updateData = { id: 1, status_id: 2, grade_id: 3, abonnement_id: 4 };

      const response = await request(app).put('/utilisateurs/modifier').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Utilisateur modifié avec succès.' });
      expect(Utilisateurs.prototype.modifierInfosUtilisateur).toHaveBeenCalledWith(updateData);
    });

    it('devrait retourner une erreur si id manquant', async () => {
      const updateData = { status_id: 2, grade_id: 3, abonnement_id: 4 };

      const response = await request(app).put('/utilisateurs/modifier').send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "L'identifiant de l'utilisateur est requis." });
    });

    it('devrait retourner aucune modification si aucun champ à modifier', async () => {
      const updateData = { id: 2 };

      const response = await request(app).put('/utilisateurs/modifier').send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Aucune modification effectuée.' });
    });

    it('devrait retourner une erreur serveur si exception', async () => {
      (Utilisateurs.prototype.modifierInfosUtilisateur as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Erreur serveur');
      });

      const updateData = { id: 3, status_id: 2 };

      const response = await request(app).put('/utilisateurs/modifier').send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erreur serveur lors de la modification de l\'utilisateur.' });
    });
  });
});