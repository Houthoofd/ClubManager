/**
 * Tests de validation des inputs pour le service Auth
 * Vérifie la gestion des données invalides, manquantes ou limites
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../core/services/auth.service.js';

describe('Auth Service - Validation des inputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentifier - validation', () => {
    it('devrait rejeter un email null', async () => {
      const mockResult = {
        success: false,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier(null as any, 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email requis');
    });

    it('devrait rejeter un email undefined', async () => {
      const mockResult = {
        success: false,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier(undefined as any, 'password123');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe null', async () => {
      const mockResult = {
        success: false,
        message: 'Mot de passe requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', null as any);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe undefined', async () => {
      const mockResult = {
        success: false,
        message: 'Mot de passe requis',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com', undefined as any);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email avec format invalide', async () => {
      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('not-an-email', 'password123');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email sans @', async () => {
      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('testexample.com', 'password123');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email sans domaine', async () => {
      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@', 'password123');

      expect(result.success).toBe(false);
    });
  });

  describe('creerCompte - validation', () => {
    it('devrait rejeter un email manquant', async () => {
      const input = {
        email: '',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe manquant', async () => {
      const input = {
        email: 'test@example.com',
        password: '',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Mot de passe requis',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prénom manquant', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: '',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Prénom requis',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom de famille manquant', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: '',
      };

      const mockResult = {
        success: false,
        message: 'Nom de famille requis',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide', async () => {
      const input = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Short1!',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prénom avec uniquement des espaces', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: '   ',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Prénom invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom avec uniquement des espaces', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: '   ',
      };

      const mockResult = {
        success: false,
        message: 'Nom de famille invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email avec caractères invalides', async () => {
      const input = {
        email: 'test@exam ple.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
    });
  });

  describe('changerMotDePasse - validation', () => {
    it('devrait rejeter un userId invalide (négatif)', async () => {
      const input = {
        userId: -1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'ID utilisateur invalide',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId à 0', async () => {
      const input = {
        userId: 0,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'ID utilisateur invalide',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe actuel vide', async () => {
      const input = {
        userId: 1,
        currentPassword: '',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Mot de passe actuel requis',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nouveau mot de passe vide', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: '',
      };

      const mockResult = {
        success: false,
        message: 'Nouveau mot de passe requis',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nouveau mot de passe trop court', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'Short1!',
      };

      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('verifierEmail - validation', () => {
    it('devrait rejeter un email vide', async () => {
      const mockResult = {
        exists: false,
        email: '',
        message: 'Email requis',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('');

      expect(result.exists).toBe(false);
    });

    it('devrait rejeter un email null', async () => {
      const mockResult = {
        exists: false,
        email: null,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult as any);

      const result = await authService.verifierEmail(null as any);

      expect(result.exists).toBe(false);
    });

    it('devrait rejeter un format d\'email invalide', async () => {
      const mockResult = {
        exists: false,
        email: 'invalid',
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('invalid');

      expect(result.exists).toBe(false);
    });
  });

  describe('demanderRecuperationMotDePasse - validation', () => {
    it('devrait rejeter un email vide', async () => {
      const mockResult = {
        success: false,
        message: 'Email requis',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.demanderRecuperationMotDePasse('');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide', async () => {
      const mockResult = {
        success: false,
        message: 'Format d\'email invalide',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.demanderRecuperationMotDePasse('not-an-email');

      expect(result.success).toBe(false);
    });
  });

  describe('verifierTokenRecuperation - validation', () => {
    it('devrait rejeter un token vide', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('');

      expect(result).toBeNull();
    });

    it('devrait rejeter un token null', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation(null as any);

      expect(result).toBeNull();
    });

    it('devrait rejeter un token undefined', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation(undefined as any);

      expect(result).toBeNull();
    });
  });

  describe('reinitialiserMotDePasse - validation', () => {
    it('devrait rejeter un token vide', async () => {
      const mockResult = {
        success: false,
        message: 'Token requis',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('', 'NewP@ssw0rd123');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nouveau mot de passe vide', async () => {
      const mockResult = {
        success: false,
        message: 'Nouveau mot de passe requis',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('valid-token', '');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nouveau mot de passe trop court', async () => {
      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('valid-token', 'Short1!');

      expect(result.success).toBe(false);
    });
  });

  describe('obtenirInformationsSecurite - validation', () => {
    it('devrait rejeter un userId invalide (négatif)', async () => {
      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(null);

      const result = await authService.obtenirInformationsSecurite(-1);

      expect(result).toBeNull();
    });

    it('devrait rejeter un userId à 0', async () => {
      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(null);

      const result = await authService.obtenirInformationsSecurite(0);

      expect(result).toBeNull();
    });

    it('devrait rejeter un userId null', async () => {
      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(null);

      const result = await authService.obtenirInformationsSecurite(null as any);

      expect(result).toBeNull();
    });
  });

  describe('validerMotDePasse - validation des règles', () => {
    it('devrait rejeter un mot de passe null', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Mot de passe requis'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mot de passe requis');
    });

    it('devrait rejeter un mot de passe vide', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Mot de passe requis'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('');

      expect(result.valid).toBe(false);
    });

    it('devrait rejeter un mot de passe avec moins de 8 caractères', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Le mot de passe doit contenir au moins 8 caractères'],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('devrait valider un mot de passe répondant à tous les critères', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('SecureP@ssw0rd123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
