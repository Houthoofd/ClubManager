/**
 * Tests pour les validators d'authentification
 * Test de tous les schémas Zod dans auth.validators.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  loginSchema,
  loginByUserIdSchema,
  registerSchema,
  registerWithConfirmSchema,
  validateEmailTokenSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordResetWithConfirmSchema,
  changePasswordSchema,
  searchUserByEmailSchema,
  verifyUserExistsSchema,
  refreshTokenSchema,
  verifyJwtSchema,
  logoutSchema,
  resendEmailValidationSchema,
} from '../auth.validators.js';

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('devrait valider un login valide', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('devrait valider différents formats d\'email valides', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({
          email,
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un email invalide (sans @)', () => {
      const result = loginSchema.safeParse({
        email: 'userexample.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide (sans domaine)', () => {
      const result = loginSchema.safeParse({
        email: 'user@',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide (sans extension)', () => {
      const result = loginSchema.safeParse({
        email: 'user@example',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email trop court (< 5 caractères)', () => {
      const result = loginSchema.safeParse({
        email: 'a@b.c',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email trop long (> 255 caractères)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = loginSchema.safeParse({
        email: longEmail,
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court (< 8 caractères)', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'pass123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop long (> 255 caractères)', () => {
      const longPassword = 'a'.repeat(256);
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: longPassword,
      });
      expect(result.success).toBe(false);
    });

    it('devrait valider un mot de passe de 8 caractères (minimum)', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'pass1234',
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email manquant', () => {
      const result = loginSchema.safeParse({
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe manquant', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginByUserIdSchema', () => {
    it('devrait valider un userId au format U-YYYY-XXXX', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'U-2024-0001',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('U-2024-0001');
        expect(result.data.password).toBe('password123');
      }
    });

    it('devrait valider différents userId valides', () => {
      const validUserIds = [
        'U-2024-0001',
        'U-2023-9999',
        'U-1999-0000',
        'U-2025-5678',
      ];

      validUserIds.forEach((userId) => {
        const result = loginByUserIdSchema.safeParse({
          userId,
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un userId sans tirets', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'U20240001',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId avec mauvais préfixe', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'A-2024-0001',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId avec année à 2 chiffres', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'U-24-0001',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId avec numéro à 3 chiffres', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'U-2024-001',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId avec numéro à 5 chiffres', () => {
      const result = loginByUserIdSchema.safeParse({
        userId: 'U-2024-00001',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId manquant', () => {
      const result = loginByUserIdSchema.safeParse({
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validBirthDate = '2000-01-01';

    it('devrait valider une inscription complète valide', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        nom_utilisateur: 'jeandupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
        abonnement_id: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe('Jean');
        expect(result.data.last_name).toBe('Dupont');
        expect(result.data.email).toBe('jean.dupont@example.com');
      }
    });

    it('devrait valider une inscription sans nom d\'utilisateur (optionnel)', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider une inscription sans abonnement_id (optionnel)', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un âge de 5 ans (minimum)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 5);
      const dateStr = birthDate.toISOString().split('T')[0];

      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: dateStr,
        genre_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un âge de 120 ans (maximum)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 120);
      const dateStr = birthDate.toISOString().split('T')[0];

      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: dateStr,
        genre_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un âge inférieur à 5 ans', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 4);
      const dateStr = birthDate.toISOString().split('T')[0];

      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: dateStr,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un âge supérieur à 120 ans', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 121);
      const dateStr = birthDate.toISOString().split('T')[0];

      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: dateStr,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prénom trop court (< 2 caractères)', () => {
      const result = registerSchema.safeParse({
        first_name: 'J',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom trop long (> 100 caractères)', () => {
      const longName = 'a'.repeat(101);
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: longName,
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom d\'utilisateur trop court (< 3 caractères)', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        nom_utilisateur: 'ab',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un first_name manquant', () => {
      const result = registerSchema.safeParse({
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un last_name manquant', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email manquant', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un password manquant', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date_of_birth manquante', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un genre_id manquant', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un genre_id négatif', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un genre_id égal à 0', () => {
      const result = registerSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerWithConfirmSchema', () => {
    const validBirthDate = '2000-01-01';

    it('devrait valider une inscription avec mots de passe correspondants', () => {
      const result = registerWithConfirmSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('password123');
        expect(result.data.confirmPassword).toBe('password123');
      }
    });

    it('devrait rejeter des mots de passe ne correspondant pas', () => {
      const result = registerWithConfirmSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        confirmPassword: 'password456',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas');
      }
    });

    it('devrait rejeter un confirmPassword manquant', () => {
      const result = registerWithConfirmSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si confirmPassword est vide', () => {
      const result = registerWithConfirmSchema.safeParse({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123',
        confirmPassword: '',
        date_of_birth: validBirthDate,
        genre_id: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateEmailTokenSchema', () => {
    it('devrait valider un token valide (32 caractères) et un userId', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(32),
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('a'.repeat(32));
        expect(result.data.userId).toBe('U-2024-0001');
      }
    });

    it('devrait valider un token long (255 caractères)', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(255),
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un token de 64 caractères', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'b'.repeat(64),
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un token trop court (< 32 caractères)', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(31),
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un token trop long (> 255 caractères)', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(256),
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId au format invalide', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(32),
        userId: 'invalid-format',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un token manquant', () => {
      const result = validateEmailTokenSchema.safeParse({
        userId: 'U-2024-0001',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId manquant', () => {
      const result = validateEmailTokenSchema.safeParse({
        token: 'a'.repeat(32),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('devrait valider un email valide', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('devrait valider différents formats d\'email', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const result = passwordResetRequestSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un email invalide', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email manquant', () => {
      const result = passwordResetRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('devrait valider un token et un nouveau mot de passe valides', () => {
      const result = passwordResetSchema.safeParse({
        token: 'a'.repeat(32),
        newPassword: 'newPassword123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('a'.repeat(32));
        expect(result.data.newPassword).toBe('newPassword123');
      }
    });

    it('devrait valider un token de 64 caractères', () => {
      const result = passwordResetSchema.safeParse({
        token: 'b'.repeat(64),
        newPassword: 'newPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un token trop court', () => {
      const result = passwordResetSchema.safeParse({
        token: 'a'.repeat(31),
        newPassword: 'newPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nouveau mot de passe trop court', () => {
      const result = passwordResetSchema.safeParse({
        token: 'a'.repeat(32),
        newPassword: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un token manquant', () => {
      const result = passwordResetSchema.safeParse({
        newPassword: 'newPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un newPassword manquant', () => {
      const result = passwordResetSchema.safeParse({
        token: 'a'.repeat(32),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetWithConfirmSchema', () => {
    it('devrait valider un reset avec mots de passe correspondants', () => {
      const result = passwordResetWithConfirmSchema.safeParse({
        token: 'a'.repeat(32),
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newPassword).toBe('newPassword123');
        expect(result.data.confirmPassword).toBe('newPassword123');
      }
    });

    it('devrait rejeter des mots de passe ne correspondant pas', () => {
      const result = passwordResetWithConfirmSchema.safeParse({
        token: 'a'.repeat(32),
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas');
      }
    });

    it('devrait rejeter un confirmPassword manquant', () => {
      const result = passwordResetWithConfirmSchema.safeParse({
        token: 'a'.repeat(32),
        newPassword: 'newPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un token invalide', () => {
      const result = passwordResetWithConfirmSchema.safeParse({
        token: 'short',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('devrait valider un changement de mot de passe valide', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.oldPassword).toBe('oldPassword123');
        expect(result.data.newPassword).toBe('newPassword456');
        expect(result.data.confirmPassword).toBe('newPassword456');
      }
    });

    it('devrait rejeter si newPassword == oldPassword', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'samePassword123',
        newPassword: 'samePassword123',
        confirmPassword: 'samePassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues.find(
          (issue) => issue.path.includes('newPassword')
        )?.message;
        expect(errorMessage).toBe('Le nouveau mot de passe doit être différent de l\'ancien');
      }
    });

    it('devrait rejeter si newPassword != confirmPassword', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword789',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas');
      }
    });

    it('devrait rejeter un oldPassword manquant', () => {
      const result = changePasswordSchema.safeParse({
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un newPassword manquant', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldPassword123',
        confirmPassword: 'newPassword456',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un confirmPassword manquant', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter tous les mots de passe trop courts', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'short',
        newPassword: 'short2',
        confirmPassword: 'short2',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('searchUserByEmailSchema', () => {
    it('devrait valider un email valide', () => {
      const result = searchUserByEmailSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('devrait valider différents formats d\'email', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const result = searchUserByEmailSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un email invalide', () => {
      const result = searchUserByEmailSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email manquant', () => {
      const result = searchUserByEmailSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('verifyUserExistsSchema', () => {
    it('devrait valider des données utilisateur valides', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1990-05-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe('Dupont');
        expect(result.data.prenom).toBe('Jean');
        expect(result.data.date_naissance).toBe('1990-05-15');
      }
    });

    it('devrait valider différentes dates au format YYYY-MM-DD', () => {
      const validDates = [
        '1990-01-01',
        '2000-12-31',
        '1985-06-15',
        '2024-02-29', // Année bissextile
      ];

      validDates.forEach((date) => {
        const result = verifyUserExistsSchema.safeParse({
          nom: 'Dupont',
          prenom: 'Jean',
          date_naissance: date,
        });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un format de date invalide (DD/MM/YYYY)', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '15/05/1990',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Format de date invalide (YYYY-MM-DD)');
      }
    });

    it('devrait rejeter un format de date invalide (MM/DD/YYYY)', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '05/15/1990',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date sans zéros (YYYY-M-D)', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1990-5-15',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom trop court', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'D',
        prenom: 'Jean',
        date_naissance: '1990-05-15',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prenom trop court', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'J',
        date_naissance: '1990-05-15',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom manquant', () => {
      const result = verifyUserExistsSchema.safeParse({
        prenom: 'Jean',
        date_naissance: '1990-05-15',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prenom manquant', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        date_naissance: '1990-05-15',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date_naissance manquante', () => {
      const result = verifyUserExistsSchema.safeParse({
        nom: 'Dupont',
        prenom: 'Jean',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('devrait valider un refreshToken valide (32 caractères)', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'a'.repeat(32),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refreshToken).toBe('a'.repeat(32));
      }
    });

    it('devrait valider un refreshToken de 64 caractères', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'b'.repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un refreshToken de 255 caractères (maximum)', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'c'.repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un refreshToken trop court (< 32 caractères)', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'a'.repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un refreshToken trop long (> 255 caractères)', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'a'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un refreshToken manquant', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un refreshToken vide', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyJwtSchema', () => {
    it('devrait valider un token JWT valide', () => {
      const result = verifyJwtSchema.safeParse({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token.length).toBeGreaterThan(0);
      }
    });

    it('devrait valider un token court (minimum 1 caractère)', () => {
      const result = verifyJwtSchema.safeParse({
        token: 'a',
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un token long', () => {
      const result = verifyJwtSchema.safeParse({
        token: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un token vide', () => {
      const result = verifyJwtSchema.safeParse({
        token: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le token est requis');
      }
    });

    it('devrait rejeter un token manquant', () => {
      const result = verifyJwtSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('logoutSchema', () => {
    it('devrait valider un logout avec token', () => {
      const result = logoutSchema.safeParse({
        token: 'some-token-value',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('some-token-value');
      }
    });

    it('devrait valider un logout sans token (optionnel pour cookies)', () => {
      const result = logoutSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBeUndefined();
      }
    });

    it('devrait valider un logout avec token undefined', () => {
      const result = logoutSchema.safeParse({
        token: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un logout avec token vide', () => {
      const result = logoutSchema.safeParse({
        token: '',
      });
      expect(result.success).toBe(true);
    });

    it('devrait valider un logout avec un long token', () => {
      const result = logoutSchema.safeParse({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resendEmailValidationSchema', () => {
    it('devrait valider un email valide', () => {
      const result = resendEmailValidationSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('devrait valider différents formats d\'email valides', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = resendEmailValidationSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un email invalide (sans @)', () => {
      const result = resendEmailValidationSchema.safeParse({
        email: 'userexample.com',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide (format incomplet)', () => {
      const result = resendEmailValidationSchema.safeParse({
        email: 'user@',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email trop court', () => {
      const result = resendEmailValidationSchema.safeParse({
        email: 'a@b.c',
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email trop long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = resendEmailValidationSchema.safeParse({
        email: longEmail,
      });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email manquant', () => {
      const result = resendEmailValidationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email vide', () => {
      const result = resendEmailValidationSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
