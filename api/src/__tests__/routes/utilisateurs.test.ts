import request from 'supertest';
import express from 'express';
import utilisateursRouter from '../../routes/utilisateurs.js';
import { Utilisateurs } from '../../db/clients/utilisateurs/utilisateurs.js';

// Mock de la classe Utilisateurs
jest.mock('../../db/clients/utilisateurs/utilisateurs.js');

const app = express();
app.use(express.json());
app.use('/utilisateurs', utilisateursRouter);

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

      (Utilisateurs.prototype.obtenirTousLesUtilisateurs as jest.Mock).mockResolvedValue({
        isFind: true,
        message: 'Utilisateurs trouvés',
        data: mockUsers,
      });

      const response = await request(app).get('/utilisateurs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(Utilisateurs.prototype.obtenirTousLesUtilisateurs).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer une erreur lors de la récupération', async () => {
      (Utilisateurs.prototype.obtenirTousLesUtilisateurs as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/utilisateurs');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erreur lors de la récupération des utilisateurs.' });
    });
  });

  describe('GET /utilisateurs/:id', () => {
    it('devrait retourner un utilisateur par ID', async () => {
      const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', status_id: 1 };

      (Utilisateurs.prototype.obtenirUnUtilisateur as jest.Mock).mockResolvedValue({
        isFind: true,
        message: 'Utilisateur trouvé',
        data: [mockUser],
      });

      const response = await request(app).get('/utilisateurs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(Utilisateurs.prototype.obtenirUnUtilisateur).toHaveBeenCalledWith(1);
    });

    it('devrait retourner 404 si utilisateur non trouvé', async () => {
      (Utilisateurs.prototype.obtenirUnUtilisateur as jest.Mock).mockResolvedValue({
        isFind: false,
        message: 'Utilisateur non trouvé',
        data: [],
      });

      const response = await request(app).get('/utilisateurs/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
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

      (Utilisateurs.prototype.inscrireUtilisateur as jest.Mock).mockResolvedValue({
        insertId: 1,
        affectedRows: 1,
      });

      const response = await request(app).post('/utilisateurs').send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).not.toHaveProperty('password');
      expect(Utilisateurs.prototype.inscrireUtilisateur).toHaveBeenCalledWith(newUser);
    });

    it('devrait gérer les erreurs de validation', async () => {
      const invalidUser = { first_name: 'John' }; // Données incomplètes

      const response = await request(app).post('/utilisateurs').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /utilisateurs/:id', () => {
    it('devrait mettre à jour un utilisateur', async () => {
      const updateData = { first_name: 'Updated', last_name: 'User', email: 'updated.user@example.com' };

      (Utilisateurs.prototype.mettreAjourUtilisateur as jest.Mock).mockResolvedValue({
        isFind: true,
        message: 'Utilisateur mis à jour',
        data: [{ id: 1, ...updateData }],
      });

      const response = await request(app).put('/utilisateurs/1').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body.first_name).toBe('Updated');
      expect(Utilisateurs.prototype.mettreAjourUtilisateur).toHaveBeenCalledWith(1, updateData);
    });

    it('devrait retourner 404 si utilisateur à mettre à jour non trouvé', async () => {
      (Utilisateurs.prototype.mettreAjourUtilisateur as jest.Mock).mockResolvedValue({
        isFind: false,
        message: 'Utilisateur non trouvé',
        data: [],
      });

      const response = await request(app).put('/utilisateurs/999').send({ first_name: 'NoOne' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
    });
  });

  describe('DELETE /utilisateurs/:id', () => {
    it('devrait supprimer un utilisateur', async () => {
      (Utilisateurs.prototype.supprimerUtilisateur as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app).delete('/utilisateurs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Utilisateur supprimé avec succès' });
      expect(Utilisateurs.prototype.supprimerUtilisateur).toHaveBeenCalledWith(1);
    });

    it('devrait retourner 404 si utilisateur à supprimer non trouvé', async () => {
      (Utilisateurs.prototype.supprimerUtilisateur as jest.Mock).mockResolvedValue({ success: false });

      const response = await request(app).delete('/utilisateurs/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
    });
  });
});
