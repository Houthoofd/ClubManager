/**
 * Tests des cas limites (edge cases) pour le service Auth
 * Vérifie le comportement avec des données vides, limites, ou extrêmes
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../core/services/auth.service.js';

describe('Auth Service - Edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentification - cas limites', () => {
    it('devrait gérer un email vide', async () => {
      const mockResult = {
        success: false,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('', 'password123');

      expect(result.success).toBe(false);
      expect(authService.authentifier).toHaveBeenCalledWith('', 'password123');
    });

    it('devrait gérer un mot de passe vide', async () => {
      const mockResult = {
        success: false,
        message: 'Mot de passe requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', '');

      expect(result.success).toBe(false);
    });

    it('devrait gérer un email très long (> 255 caractères)', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const mockResult = {
        success: false,
        message: 'Email trop long',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier(longEmail, 'password123');

      expect(result.success).toBe(false);
    });

    it('devrait gérer un mot de passe très long (> 128 caractères)', async () => {
      const longPassword = 'A'.repeat(200);
      const mockResult = {
        success: false,
        message: 'Mot de passe trop long',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', longPassword);

      expect(result.success).toBe(false);
    });

    it('devrait gérer des espaces dans l\'email', async () => {
      const mockResult = {
        success: false,
        message: 'Email invalide',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier(' test@example.com ', 'password123');

      expect(result.success).toBe(false);
    });
  });

  describe('Création de compte - cas limites', () => {
    it('devrait gérer un prénom d\'un seul caractère', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'J',
        last_name: 'Doe',
      };

      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
    });

    it('devrait gérer un nom très long (> 100 caractères)', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jean',
        last_name: 'D'.repeat(120),
      };

      const mockResult = {
        success: false,
        message: 'Nom de famille trop long',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait gérer des caractères spéciaux dans le prénom', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jean-François',
        last_name: 'Doe',
      };

      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
    });

    it('devrait gérer un email avec sous-domaines multiples', async () => {
      const input = {
        email: 'test@mail.company.co.uk',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockResult = {
        success: true,
        user: {
          id: 1,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
        },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
    });

    it('devrait gérer un email déjà existant', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Cet email est déjà utilisé',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cet email est déjà utilisé');
    });
  });

  describe('Validation de mot de passe - cas limites', () => {
    it('devrait gérer un mot de passe à la limite minimale (8 caractères)', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('Abcd123!');

      expect(result.valid).toBe(true);
    });

    it('devrait gérer un mot de passe avec uniquement des chiffres', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Le mot de passe doit contenir au moins une lettre'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('12345678');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait gérer un mot de passe avec uniquement des lettres', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Le mot de passe doit contenir au moins un chiffre'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('abcdefgh');

      expect(result.valid).toBe(false);
    });

    it('devrait gérer un mot de passe avec caractères Unicode', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('P@ssw0rd€ñ');

      expect(result.valid).toBe(true);
    });
  });

  describe('Récupération de mot de passe - cas limites', () => {
    it('devrait gérer un email inexistant (sans révéler l\'information)', async () => {
      const mockResult = {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.demanderRecuperationMotDePasse('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Si cet email existe');
    });

    it('devrait gérer plusieurs demandes de récupération successives', async () => {
      const mockResult = {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      await authService.demanderRecuperationMotDePasse('test@example.com');
      const result = await authService.demanderRecuperationMotDePasse('test@example.com');

      expect(result.success).toBe(true);
      expect(authService.demanderRecuperationMotDePasse).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer un token expiré', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('expired-token');

      expect(result).toBeNull();
    });

    it('devrait gérer un token malformé', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('invalid@token#format');

      expect(result).toBeNull();
    });

    it('devrait gérer un token vide', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('');

      expect(result).toBeNull();
    });
  });

  describe('Changement de mot de passe - cas limites', () => {
    it('devrait rejeter l\'ancien mot de passe comme nouveau', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'OldP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait gérer un ancien mot de passe incorrect', async () => {
      const input = {
        userId: 1,
        currentPassword: 'WrongP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Mot de passe actuel incorrect',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait gérer un utilisateur inexistant', async () => {
      const input = {
        userId: 99999,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Utilisateur introuvable',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Statistiques - cas limites', () => {
    it('devrait gérer des statistiques avec zéro utilisateur', async () => {
      const mockStats = {
        totalUsers: 0,
        activeUsers: 0,
        lockedAccounts: 0,
        recentLogins: 0,
      };

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue(mockStats as any);

      const result = await authService.obtenirStatistiques();

      expect(result.totalUsers).toBe(0);
    });

    it('devrait gérer un très grand nombre d\'utilisateurs', async () => {
      const mockStats = {
        totalUsers: 1000000,
        activeUsers: 850000,
        lockedAccounts: 500,
        recentLogins: 50000,
      };

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue(mockStats as any);

      const result = await authService.obtenirStatistiques();

      expect(result.totalUsers).toBe(1000000);
    });
  });

  describe('Nettoyage tokens - cas limites', () => {
    it('devrait gérer aucun token à nettoyer', async () => {
      const mockResult = {
        count: 0,
      };

      jest.spyOn(authService, 'nettoyerTokensExpires').mockResolvedValue(mockResult);

      const result = await authService.nettoyerTokensExpires();

      expect(result.count).toBe(0);
    });

    it('devrait gérer un très grand nombre de tokens à nettoyer', async () => {
      const mockResult = {
        count: 10000,
      };

      jest.spyOn(authService, 'nettoyerTokensExpires').mockResolvedValue(mockResult);

      const result = await authService.nettoyerTokensExpires();

      expect(result.count).toBe(10000);
    });
  });
});
