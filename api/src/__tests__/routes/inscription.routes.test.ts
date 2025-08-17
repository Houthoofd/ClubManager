import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import inscriptionRouter from '../../routes/inscription.js';
import { Utilisateurs } from '../../db/clients/utilisateurs/utilisateurs.js';

// Mock de la classe Utilisateurs
jest.mock('../../db/clients/utilisateurs/utilisateurs.js');

const app = express();
app.use(express.json());
app.use('/', inscriptionRouter);

beforeAll(() => {
  // Mock les méthodes du client Utilisateurs
  Utilisateurs.prototype.checkUtilisateurByEmail = jest.fn(async (email: string) => {
    if (email === 'exists@example.com') {
      return { isFind: true, message: "Utilisateur déjà existant" };
    }
    if (email === 'error@example.com') {
      throw new Error('DB error');
    }
    return { isFind: false, message: "Utilisateur non trouvé" };
  });

  Utilisateurs.prototype.inscriptionUtilisateurSimple = jest.fn(async (data: any) => {
    if (data.email === 'fail@example.com') {
      throw new Error('Insert error');
    }
    return { insertId: 42, affectedRows: 1 };
  });
});

describe('Inscription Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /inscription/verification', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/inscription/verification')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Email requis/);
    });

    it('should return 409 if user exists', async () => {
      const res = await request(app)
        .post('/inscription/verification')
        .send({ email: 'exists@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Utilisateur déjà existant/);
      expect(Utilisateurs.prototype.checkUtilisateurByEmail).toHaveBeenCalledWith('exists@example.com');
    });

    it('should return 200 if user does not exist', async () => {
      const res = await request(app)
        .post('/inscription/verification')
        .send({ email: 'new@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
      expect(Utilisateurs.prototype.checkUtilisateurByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return 500 if DB error', async () => {
      const res = await request(app)
        .post('/inscription/verification')
        .send({ email: 'error@example.com' });
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Erreur serveur/);
    });
  });

  describe('POST /inscription/validation', () => {
    const validPayload = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'securepass',
      date: '2024-06-01',
      abonnement: '1'
    };

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/inscription/validation')
        .send({ email: 'new@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Champs requis manquants/);
    });

    it('should return 409 if user already exists', async () => {
      const res = await request(app)
        .post('/inscription/validation')
        .send({ ...validPayload, email: 'exists@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Utilisateur déjà existant/);
      expect(Utilisateurs.prototype.checkUtilisateurByEmail).toHaveBeenCalledWith('exists@example.com');
    });

    it('should return 201 if inscription succeeds', async () => {
      const res = await request(app)
        .post('/inscription/validation')
        .send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Inscription réussie/);
      expect(res.body.userId).toBe(42);
      expect(Utilisateurs.prototype.inscriptionUtilisateurSimple).toHaveBeenCalled();
    });

    it('should return 500 if inscription fails', async () => {
      const res = await request(app)
        .post('/inscription/validation')
        .send({ ...validPayload, email: 'fail@example.com' });
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Erreur serveur/);
    });
  });
});
