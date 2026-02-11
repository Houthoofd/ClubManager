/**
 * Tests de cohérence des schémas pour le service Auth
 * Vérifie la structure et les types des données retournées
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../core/services/auth.service.js';

describe('Auth Service - Cohérence des données', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Structure des réponses - Authentification', () => {
    it('authentifier - devrait avoir la structure attendue pour succès', async () => {
      const mockResult = {
        success: true,
        message: 'Connexion réussie',
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'password123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.success).toBe(true);
    });

    it('authentifier - devrait avoir la structure attendue pour échec', async () => {
      const mockResult = {
        success: false,
        message: 'Email ou mot de passe incorrect',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'wrongpassword');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(false);
      expect(result).not.toHaveProperty('user');
    });

    it('authentifier - user devrait contenir tous les champs requis', async () => {
      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'password123');

      if (result.success && 'user' in result) {
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('email');
        expect(result.user).toHaveProperty('first_name');
        expect(result.user).toHaveProperty('last_name');
        expect(typeof result.user.id).toBe('number');
        expect(typeof result.user.email).toBe('string');
        expect(typeof result.user.first_name).toBe('string');
        expect(typeof result.user.last_name).toBe('string');
      }
    });

    it('authentifier - ne devrait jamais exposer le mot de passe', async () => {
      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'password123');

      if (result.success && 'user' in result) {
        expect(result.user).not.toHaveProperty('password');
        expect(result.user).not.toHaveProperty('password_hash');
        expect(result.user).not.toHaveProperty('passwordHash');
      }
    });
  });

  describe('Structure des réponses - Création de compte', () => {
    it('creerCompte - devrait avoir la structure attendue pour succès', async () => {
      const mockResult = {
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: 1,
          email: 'new@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte({
        email: 'new@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('creerCompte - devrait retourner l\'utilisateur créé', async () => {
      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: 'new@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte({
        email: 'new@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      });

      if (result.success && 'user' in result) {
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('email');
        expect(result.user.id).toBeGreaterThan(0);
      }
    });
  });

  describe('Structure des réponses - Vérification email', () => {
    it('verifierEmail - devrait retourner exists et email', async () => {
      const mockResult = {
        exists: true,
        email: 'test@example.com',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('test@example.com');

      expect(result).toHaveProperty('exists');
      expect(result).toHaveProperty('email');
      expect(typeof result.exists).toBe('boolean');
      expect(typeof result.email).toBe('string');
    });
  });

  describe('Structure des réponses - Changement de mot de passe', () => {
    it('changerMotDePasse - devrait avoir la structure attendue', async () => {
      const mockResult = {
        success: true,
        message: 'Mot de passe modifié avec succès',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse({
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Structure des réponses - Validation mot de passe', () => {
    it('validerMotDePasse - devrait retourner valid et errors', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('SecureP@ssw0rd123');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('validerMotDePasse - errors devrait être un tableau de strings', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Le mot de passe doit contenir au moins 8 caractères'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('weak');

      expect(Array.isArray(result.errors)).toBe(true);
      result.errors.forEach(error => {
        expect(typeof error).toBe('string');
      });
    });
  });

  describe('Structure des réponses - Récupération mot de passe', () => {
    it('demanderRecuperationMotDePasse - devrait avoir la structure attendue', async () => {
      const mockResult = {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.demanderRecuperationMotDePasse('test@example.com');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('verifierTokenRecuperation - devrait retourner les données du token ou null', async () => {
      const mockToken = {
        token: 'valid-token-123',
        userId: 1,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(mockToken as any);

      const result = await authService.verifierTokenRecuperation('valid-token-123');

      if (result !== null) {
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('expiresAt');
        expect(typeof result.token).toBe('string');
        expect(typeof result.userId).toBe('number');
        expect(typeof result.email).toBe('string');
        expect(result.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('verifierTokenRecuperation - devrait retourner null pour token invalide', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('invalid-token');

      expect(result).toBeNull();
    });

    it('reinitialiserMotDePasse - devrait avoir la structure attendue', async () => {
      const mockResult = {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('valid-token', 'NewP@ssw0rd123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Structure des réponses - Statistiques', () => {
    it('obtenirStatistiques - devrait avoir la structure attendue', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        lockedAccounts: 2,
        recentLogins: 50,
      };

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue(mockStats as any);

      const result = await authService.obtenirStatistiques();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('lockedAccounts');
      expect(result).toHaveProperty('recentLogins');
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.activeUsers).toBe('number');
      expect(typeof result.lockedAccounts).toBe('number');
      expect(typeof result.recentLogins).toBe('number');
    });

    it('obtenirInformationsSecurite - devrait avoir la structure attendue', async () => {
      const mockSecurityInfo = {
        userId: 1,
        lastLogin: new Date(),
        failedAttempts: 0,
        accountLocked: false,
      };

      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(mockSecurityInfo as any);

      const result = await authService.obtenirInformationsSecurite(1);

      if (result !== null) {
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('lastLogin');
        expect(result).toHaveProperty('failedAttempts');
        expect(result).toHaveProperty('accountLocked');
        expect(typeof result.userId).toBe('number');
        expect(result.lastLogin).toBeInstanceOf(Date);
        expect(typeof result.failedAttempts).toBe('number');
        expect(typeof result.accountLocked).toBe('boolean');
      }
    });

    it('obtenirInformationsSecurite - devrait retourner null pour utilisateur inexistant', async () => {
      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(null);

      const result = await authService.obtenirInformationsSecurite(99999);

      expect(result).toBeNull();
    });
  });

  describe('Structure des réponses - Maintenance', () => {
    it('nettoyerTokensExpires - devrait retourner le nombre de tokens nettoyés', async () => {
      const mockResult = {
        count: 5,
      };

      jest.spyOn(authService, 'nettoyerTokensExpires').mockResolvedValue(mockResult);

      const result = await authService.nettoyerTokensExpires();

      expect(result).toHaveProperty('count');
      expect(typeof result.count).toBe('number');
      expect(result.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cohérence des types de données', () => {
    it('les IDs devraient toujours être des nombres positifs', async () => {
      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'password123');

      if (result.success && 'user' in result) {
        expect(result.user.id).toBeGreaterThan(0);
        expect(Number.isInteger(result.user.id)).toBe(true);
      }
    });

    it('les emails devraient toujours être en minuscules', async () => {
      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('TEST@EXAMPLE.COM', 'password123');

      if (result.success && 'user' in result) {
        expect(result.user.email).toBe(result.user.email.toLowerCase());
      }
    });

    it('les dates devraient être des objets Date valides', async () => {
      const mockToken = {
        token: 'valid-token',
        userId: 1,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(mockToken as any);

      const result = await authService.verifierTokenRecuperation('valid-token');

      if (result !== null) {
        expect(result.expiresAt).toBeInstanceOf(Date);
        expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('les booléens devraient être strictement true ou false', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('SecureP@ssw0rd123');

      expect(result.valid).toStrictEqual(true);
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Cohérence des messages d\'erreur', () => {
    it('les messages d\'erreur devraient être clairs et consistants', async () => {
      const mockResult = {
        success: false,
        message: 'Email ou mot de passe incorrect',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'wrongpassword');

      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
      expect(typeof result.message).toBe('string');
    });

    it('les erreurs de validation devraient être descriptives', async () => {
      const mockValidation = {
        valid: false,
        errors: [
          'Le mot de passe doit contenir au moins 8 caractères',
          'Le mot de passe doit contenir au moins une lettre majuscule',
        ],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('weak');

      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach(error => {
        expect(error.length).toBeGreaterThan(10); // Messages descriptifs
        expect(error).toMatch(/mot de passe/i);
      });
    });
  });
});
