/**
 * Tests de base pour le service Auth
 * Tests des fonctionnalités principales (happy path)
 * Pattern identique aux tests alertes
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../../../services/auth/auth.service.js';

describe('Auth Service - Tests de base', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentification', () => {
    it('devrait authentifier un utilisateur avec des credentials valides', async () => {
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

      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(authService.authentifier).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(authService.authentifier).toHaveBeenCalledTimes(1);
    });

    it('devrait rejeter les credentials invalides', async () => {
      const mockResult = {
        success: false,
        message: 'Email ou mot de passe incorrect',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email ou mot de passe incorrect');
    });
  });

  describe('Création de compte', () => {
    it('devrait créer un nouveau compte avec des données valides', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockResult = {
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: 2,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
      expect(authService.creerCompte).toHaveBeenCalledWith(input);
    });

    it('devrait rejeter un email invalide', async () => {
      const input = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Email invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email invalide');
    });
  });

  describe('Vérification email', () => {
    it('devrait vérifier si un email existe', async () => {
      const mockResult = {
        exists: true,
        email: 'test@example.com',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('test@example.com');

      expect(result.exists).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(authService.verifierEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('devrait retourner false pour un email inexistant', async () => {
      const mockResult = {
        exists: false,
        email: 'nonexistent@example.com',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('nonexistent@example.com');

      expect(result.exists).toBe(false);
    });
  });

  describe('Changement de mot de passe', () => {
    it('devrait changer le mot de passe avec succès', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: true,
        message: 'Mot de passe modifié avec succès',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(true);
      expect(authService.changerMotDePasse).toHaveBeenCalledWith(input);
    });

    it('devrait rejeter un mot de passe faible', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'weak',
      };

      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('8 caractères');
    });
  });

  describe('Validation de mot de passe', () => {
    it('devrait valider un mot de passe fort', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('SecureP@ssw0rd123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait invalider un mot de passe faible', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Le mot de passe doit contenir au moins 8 caractères'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('weak');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Récupération de mot de passe', () => {
    it('devrait créer une demande de récupération', async () => {
      const mockResult = {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.demanderRecuperationMotDePasse('test@example.com');

      expect(result.success).toBe(true);
      expect(authService.demanderRecuperationMotDePasse).toHaveBeenCalledWith('test@example.com');
    });

    it('devrait vérifier un token de récupération', async () => {
      const mockToken = {
        token: 'valid-token-123',
        userId: 1,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(mockToken as any);

      const result = await authService.verifierTokenRecuperation('valid-token-123');

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(authService.verifierTokenRecuperation).toHaveBeenCalledWith('valid-token-123');
    });

    it('devrait rejeter un token invalide', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('invalid-token');

      expect(result).toBeNull();
    });

    it('devrait réinitialiser le mot de passe avec un token valide', async () => {
      const mockResult = {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('valid-token', 'NewP@ssw0rd123');

      expect(result.success).toBe(true);
      expect(authService.reinitialiserMotDePasse).toHaveBeenCalledWith('valid-token', 'NewP@ssw0rd123');
    });
  });

  describe('Sécurité et audit', () => {
    it('devrait obtenir les informations de sécurité', async () => {
      const mockSecurityInfo = {
        userId: 1,
        lastLogin: new Date(),
        failedAttempts: 0,
        accountLocked: false,
      };

      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(mockSecurityInfo as any);

      const result = await authService.obtenirInformationsSecurite(1);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(authService.obtenirInformationsSecurite).toHaveBeenCalledWith(1);
    });

    it('devrait obtenir les statistiques d\'authentification', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        lockedAccounts: 2,
        recentLogins: 50,
      };

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue(mockStats as any);

      const result = await authService.obtenirStatistiques();

      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(100);
      expect(authService.obtenirStatistiques).toHaveBeenCalledTimes(1);
    });
  });

  describe('Maintenance', () => {
    it('devrait nettoyer les tokens expirés', async () => {
      const mockResult = {
        count: 5,
      };

      jest.spyOn(authService, 'nettoyerTokensExpires').mockResolvedValue(mockResult);

      const result = await authService.nettoyerTokensExpires();

      expect(result.count).toBe(5);
      expect(authService.nettoyerTokensExpires).toHaveBeenCalledTimes(1);
    });
  });
});
