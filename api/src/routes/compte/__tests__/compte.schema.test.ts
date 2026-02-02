/**
 * Tests de schéma pour le service Compte
 * Tests de validation des schémas de données avec Zod
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { z } from 'zod';

describe('Compte Service - Tests de schéma', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schéma de récupération des informations', () => {
    const getInformationsSchema = z.object({
      prenom: z.string().min(1, 'Le prénom est requis'),
      nom: z.string().min(1, 'Le nom est requis')
    });

    it('devrait valider un schéma valide', () => {
      const validData = {
        prenom: 'John',
        nom: 'Doe'
      };

      const result = getInformationsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un prénom vide', () => {
      const invalidData = {
        prenom: '',
        nom: 'Doe'
      };

      const result = getInformationsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('prénom');
      }
    });

    it('devrait rejeter un nom vide', () => {
      const invalidData = {
        prenom: 'John',
        nom: ''
      };

      const result = getInformationsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('nom');
      }
    });

    it('devrait rejeter un objet incomplet', () => {
      const incompleteData = {
        prenom: 'John'
      };

      const result = getInformationsSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });

    it('devrait accepter des noms avec caractères spéciaux', () => {
      const validData = {
        prenom: 'Jean-Pierre',
        nom: "O'Connor"
      };

      const result = getInformationsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Schéma de création de mot de passe', () => {
    const createPasswordSchema = z.object({
      id: z.number().int().positive('L\'ID doit être positif'),
      password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    });

    it('devrait valider un schéma valide', () => {
      const validData = {
        id: 1,
        password: 'SecurePassword123!'
      };

      const result = createPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un ID négatif', () => {
      const invalidData = {
        id: -1,
        password: 'SecurePassword123!'
      };

      const result = createPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un ID nul', () => {
      const invalidData = {
        id: 0,
        password: 'SecurePassword123!'
      };

      const result = createPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const invalidData = {
        id: 1,
        password: 'short'
      };

      const result = createPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('8 caractères');
      }
    });

    it('devrait rejeter un mot de passe vide', () => {
      const invalidData = {
        id: 1,
        password: ''
      };

      const result = createPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un ID de type string', () => {
      const invalidData = {
        id: '1',
        password: 'SecurePassword123!'
      };

      const result = createPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de modification de mot de passe', () => {
    const changePasswordSchema = z.object({
      id: z.number().int().positive('L\'ID doit être positif'),
      password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    });

    it('devrait valider un schéma valide', () => {
      const validData = {
        id: 1,
        password: 'NewSecurePassword456!'
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter les mêmes erreurs que la création', () => {
      const invalidData = {
        id: -1,
        password: 'weak'
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de mise à jour du compte', () => {
    const updateAccountSchema = z.object({
      id: z.number().int().positive('L\'ID doit être positif'),
      email: z.string().email('Format email invalide').optional(),
      date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
      genres: z.union([z.number().int().positive(), z.string()]).optional(),
      grades: z.union([z.number().int().positive(), z.string()]).optional(),
      abonnement: z.union([z.number().int().positive(), z.string()]).optional(),
      status: z.union([z.number().int().positive(), z.string()]).optional(),
      password: z.string().min(8).optional()
    });

    it('devrait valider un schéma complet', () => {
      const validData = {
        id: 1,
        email: 'test@example.com',
        date_naissance: '1990-01-01',
        genres: 1,
        grades: 'Ceinture noire',
        abonnement: 2,
        status: 1,
        password: 'NewPassword123!'
      };

      const result = updateAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait valider avec seulement l\'ID', () => {
      const minimalData = {
        id: 1
      };

      const result = updateAccountSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('devrait valider avec un seul champ optionnel', () => {
      const partialData = {
        id: 1,
        email: 'new@example.com'
      };

      const result = updateAccountSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      const invalidData = {
        id: 1,
        email: 'invalid-email'
      };

      const result = updateAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('email');
      }
    });

    it('devrait rejeter une date invalide', () => {
      const invalidData = {
        id: 1,
        date_naissance: '01/01/1990'
      };

      const result = updateAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait accepter un genre comme nombre', () => {
      const validData = {
        id: 1,
        genres: 2
      };

      const result = updateAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un genre comme string', () => {
      const validData = {
        id: 1,
        genres: 'Homme'
      };

      const result = updateAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un grade comme nombre', () => {
      const validData = {
        id: 1,
        grades: 3
      };

      const result = updateAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un grade comme string', () => {
      const validData = {
        id: 1,
        grades: 'Ceinture bleue'
      };

      const result = updateAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un abonnement négatif', () => {
      const invalidData = {
        id: 1,
        abonnement: -1
      };

      const result = updateAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un status nul', () => {
      const invalidData = {
        id: 1,
        status: 0
      };

      const result = updateAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de validation d\'email', () => {
    const emailSchema = z.string().email('Format email invalide');

    it('devrait valider un email standard', () => {
      const result = emailSchema.safeParse('user@example.com');
      expect(result.success).toBe(true);
    });

    it('devrait valider un email avec sous-domaine', () => {
      const result = emailSchema.safeParse('user@mail.example.com');
      expect(result.success).toBe(true);
    });

    it('devrait valider un email avec caractères spéciaux', () => {
      const result = emailSchema.safeParse('user.name+tag@example.com');
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email sans @', () => {
      const result = emailSchema.safeParse('userexample.com');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email sans domaine', () => {
      const result = emailSchema.safeParse('user@');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email sans nom d\'utilisateur', () => {
      const result = emailSchema.safeParse('@example.com');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email avec espaces', () => {
      const result = emailSchema.safeParse('user @example.com');
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de validation de date', () => {
    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide');

    it('devrait valider une date au format YYYY-MM-DD', () => {
      const result = dateSchema.safeParse('1990-01-01');
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une date au format DD/MM/YYYY', () => {
      const result = dateSchema.safeParse('01/01/1990');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date au format MM-DD-YYYY', () => {
      const result = dateSchema.safeParse('01-01-1990');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date partielle', () => {
      const result = dateSchema.safeParse('1990-01');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une chaîne vide', () => {
      const result = dateSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de validation de mot de passe', () => {
    const passwordSchema = z.string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

    it('devrait valider un mot de passe fort', () => {
      const result = passwordSchema.safeParse('SecureP@ssw0rd');
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un mot de passe sans majuscule', () => {
      const result = passwordSchema.safeParse('securep@ssw0rd');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe sans minuscule', () => {
      const result = passwordSchema.safeParse('SECUREP@SSW0RD');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe sans chiffre', () => {
      const result = passwordSchema.safeParse('SecureP@ssword');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe sans caractère spécial', () => {
      const result = passwordSchema.safeParse('SecurePassw0rd');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const result = passwordSchema.safeParse('Sec@0rd');
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de réponse des informations utilisateur', () => {
    const utilisateurSchema = z.object({
      id: z.number().int().positive(),
      prenom: z.string(),
      nom: z.string(),
      email: z.string().email(),
      date_naissance: z.string().nullable(),
      genre: z.string().nullable(),
      grade: z.string().nullable(),
      abonnement: z.string().nullable(),
      status: z.string().nullable()
    });

    it('devrait valider une réponse complète', () => {
      const validResponse = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com',
        date_naissance: '1990-01-01',
        genre: 'Homme',
        grade: 'Ceinture noire',
        abonnement: 'Mensuel',
        status: 'Actif'
      };

      const result = utilisateurSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait valider une réponse avec des champs null', () => {
      const validResponse = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com',
        date_naissance: null,
        genre: null,
        grade: null,
        abonnement: null,
        status: null
      };

      const result = utilisateurSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une réponse sans ID', () => {
      const invalidResponse = {
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com',
        date_naissance: null,
        genre: null,
        grade: null,
        abonnement: null,
        status: null
      };

      const result = utilisateurSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une réponse avec un email invalide', () => {
      const invalidResponse = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'invalid-email',
        date_naissance: null,
        genre: null,
        grade: null,
        abonnement: null,
        status: null
      };

      const result = utilisateurSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de réponse de succès', () => {
    const successSchema = z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.any().optional()
    });

    it('devrait valider une réponse de succès', () => {
      const validResponse = {
        success: true,
        message: 'Opération réussie'
      };

      const result = successSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait valider une réponse avec données', () => {
      const validResponse = {
        success: true,
        message: 'Opération réussie',
        data: { id: 1, name: 'Test' }
      };

      const result = successSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une réponse sans success', () => {
      const invalidResponse = {
        message: 'Opération réussie'
      };

      const result = successSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une réponse sans message', () => {
      const invalidResponse = {
        success: true
      };

      const result = successSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Schéma de réponse d\'erreur', () => {
    const errorSchema = z.object({
      success: z.literal(false),
      message: z.string(),
      error: z.string().optional(),
      details: z.any().optional()
    });

    it('devrait valider une réponse d\'erreur simple', () => {
      const validResponse = {
        success: false,
        message: 'Une erreur est survenue'
      };

      const result = errorSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait valider une réponse d\'erreur avec détails', () => {
      const validResponse = {
        success: false,
        message: 'Erreur de validation',
        error: 'ValidationError',
        details: { field: 'email', reason: 'Format invalide' }
      };

      const result = errorSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une réponse avec success=true', () => {
      const invalidResponse = {
        success: true,
        message: 'Erreur'
      };

      const result = errorSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Transformation de schémas', () => {
    const transformSchema = z.object({
      id: z.string().transform(val => parseInt(val, 10)),
      genres: z.union([
        z.number(),
        z.string().transform(val => {
          const map: Record<string, number> = { 'Homme': 1, 'Femme': 2, 'Autre': 3 };
          return map[val] || 0;
        })
      ])
    });

    it('devrait transformer un ID string en number', () => {
      const data = { id: '123', genres: 1 };
      const result = transformSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe('number');
        expect(result.data.id).toBe(123);
      }
    });

    it('devrait transformer un genre string en number', () => {
      const data = { id: '1', genres: 'Homme' };
      const result = transformSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.genres).toBe(1);
      }
    });

    it('devrait laisser un genre number inchangé', () => {
      const data = { id: '1', genres: 2 };
      const result = transformSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.genres).toBe(2);
      }
    });
  });

  describe('Schémas imbriqués', () => {
    const addressSchema = z.object({
      rue: z.string(),
      ville: z.string(),
      codePostal: z.string().regex(/^\d{5}$/)
    });

    const compteCompletSchema = z.object({
      id: z.number(),
      prenom: z.string(),
      nom: z.string(),
      email: z.string().email(),
      adresse: addressSchema.optional()
    });

    it('devrait valider un schéma imbriqué', () => {
      const validData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com',
        adresse: {
          rue: '123 Main St',
          ville: 'Paris',
          codePostal: '75001'
        }
      };

      const result = compteCompletSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un code postal invalide dans le schéma imbriqué', () => {
      const invalidData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com',
        adresse: {
          rue: '123 Main St',
          ville: 'Paris',
          codePostal: '750'
        }
      };

      const result = compteCompletSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait valider sans l\'objet adresse optionnel', () => {
      const validData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com'
      };

      const result = compteCompletSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Schémas avec valeurs par défaut', () => {
    const schemaWithDefaults = z.object({
      id: z.number(),
      email: z.string().email(),
      status: z.string().default('Actif'),
      notifications: z.boolean().default(true)
    });

    it('devrait appliquer les valeurs par défaut', () => {
      const data = {
        id: 1,
        email: 'test@example.com'
      };

      const result = schemaWithDefaults.parse(data);
      expect(result.status).toBe('Actif');
      expect(result.notifications).toBe(true);
    });

    it('devrait permettre de surcharger les valeurs par défaut', () => {
      const data = {
        id: 1,
        email: 'test@example.com',
        status: 'Inactif',
        notifications: false
      };

      const result = schemaWithDefaults.parse(data);
      expect(result.status).toBe('Inactif');
      expect(result.notifications).toBe(false);
    });
  });
});
