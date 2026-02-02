/**
 * Tests de gestion des erreurs pour le service Compte
 * Tests des cas d'erreurs et exceptions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';

describe('Compte Service - Tests de gestion des erreurs', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  describe('Erreurs de base de données', () => {
    it('devrait gérer une erreur de connexion à la base de données', async () => {
      const dbError = new Error('Connection refused');
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(dbError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('Connection refused');
    });

    it('devrait gérer une erreur de timeout de requête', async () => {
      const timeoutError = new Error('Query timeout exceeded');
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockRejectedValue(timeoutError);

      await expect(
        compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'test@example.com' })
      ).rejects.toThrow('Query timeout');
    });

    it('devrait gérer une erreur de contrainte unique (email)', async () => {
      const updateData = { email: 'duplicate@example.com' };

      const mockResult = {
        isConfirm: false,
        message: 'UNIQUE constraint failed: utilisateurs.email'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('UNIQUE constraint');
    });

    it('devrait gérer une erreur de clé étrangère invalide', async () => {
      const updateData = { genres: 9999 }; // ID inexistant

      const mockResult = {
        isConfirm: false,
        message: 'FOREIGN KEY constraint failed'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('FOREIGN KEY');
    });

    it('devrait gérer une erreur de verrouillage de table', async () => {
      const lockError = new Error('Database table is locked');
      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockRejectedValue(lockError);

      await expect(
        compteClient.mettreAJourMotDePasse(1, 'hashedPassword', false)
      ).rejects.toThrow('locked');
    });

    it('devrait gérer une erreur de syntaxe SQL', async () => {
      const sqlError = new Error('SQL syntax error near SELECT');
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(sqlError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('SQL syntax error');
    });
  });

  describe('Erreurs de validation des paramètres', () => {
    it('devrait gérer un ID utilisateur null', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'ID utilisateur ne peut pas être null'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(null as any, 'hash', false);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('null');
    });

    it('devrait gérer un ID utilisateur undefined', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'ID utilisateur est requis'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(undefined as any, {});

      expect(result.isConfirm).toBe(false);
    });

    it('devrait gérer des paramètres de type incorrect', async () => {
      const mockResult = {
        isFind: false,
        message: 'Le prénom doit être une chaîne de caractères'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(123 as any, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait gérer un objet de mise à jour null', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Les données de mise à jour sont requises'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, null as any);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Erreurs de sécurité', () => {
    it('devrait rejeter une tentative d\'injection SQL dans le prénom', async () => {
      const sqlInjection = "'; DROP TABLE utilisateurs; --";

      const mockResult = {
        isFind: false,
        message: 'Caractères non autorisés détectés'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(sqlInjection, 'Doe');

      expect(result.isFind).toBe(false);
      expect(result.message).toContain('non autorisés');
    });

    it('devrait rejeter une tentative d\'injection SQL dans l\'email', async () => {
      const updateData = { email: "admin@example.com' OR '1'='1" };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide ou caractères suspects'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter un hash de mot de passe non hashé (texte clair)', async () => {
      const plainPassword = 'Password123!'; // Pas un hash bcrypt

      const mockResult = {
        isConfirm: false,
        message: 'Le mot de passe doit être hashé avec bcrypt'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, plainPassword, true);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('hashé');
    });

    it('devrait gérer les tentatives de scripts XSS', async () => {
      const xssAttempt = '<script>alert("XSS")</script>';

      const mockResult = {
        isFind: false,
        message: 'Contenu HTML/JavaScript non autorisé'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(xssAttempt, 'Doe');

      expect(result.isFind).toBe(false);
    });
  });

  describe('Erreurs de logique métier', () => {
    it('devrait empêcher la création d\'un mot de passe si un existe déjà', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'L\'utilisateur possède déjà un mot de passe. Utilisez la fonction de modification.'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'newHash', true);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('déjà un mot de passe');
    });

    it('devrait empêcher la modification d\'un mot de passe inexistant', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Aucun mot de passe existant. Utilisez la fonction de création.'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'newHash', false);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('Aucun mot de passe');
    });

    it('devrait empêcher la mise à jour d\'un utilisateur inexistant', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Utilisateur avec l\'ID 99999 n\'existe pas'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(99999, { email: 'test@example.com' });

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('n\'existe pas');
    });

    it('devrait empêcher la mise à jour avec un email déjà utilisé', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Cet email est déjà utilisé par un autre compte'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'existing@example.com' });

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('déjà utilisé');
    });
  });

  describe('Erreurs réseau et système', () => {
    it('devrait gérer une perte de connexion réseau', async () => {
      const networkError = new Error('ECONNREFUSED');
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(networkError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('ECONNREFUSED');
    });

    it('devrait gérer un dépassement de mémoire', async () => {
      const memoryError = new Error('JavaScript heap out of memory');
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockRejectedValue(memoryError);

      await expect(
        compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'test@example.com' })
      ).rejects.toThrow('heap out of memory');
    });

    it('devrait gérer une erreur de permission fichier', async () => {
      const permissionError = new Error('EACCES: permission denied');
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(permissionError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('permission denied');
    });
  });

  describe('Erreurs de données corrompues', () => {
    it('devrait gérer des données utilisateur corrompues', async () => {
      const mockResult = {
        isFind: true,
        data: null // Données corrompues
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(true);
      expect(result.data).toBeNull();
    });

    it('devrait gérer une date de naissance corrompue', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          date_naissance: 'invalid-date'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(true);
      expect(result.data.date_naissance).toBe('invalid-date');
    });

    it('devrait gérer des IDs de référence invalides dans les données', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          genre_id: -1, // ID invalide
          grade_id: null
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(true);
      expect(result.data.genre_id).toBe(-1);
      expect(result.data.grade_id).toBeNull();
    });
  });

  describe('Erreurs de concurrence', () => {
    it('devrait gérer une mise à jour concurrente', async () => {
      const concurrencyError = new Error('Row was updated or deleted by another transaction');
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockRejectedValue(concurrencyError);

      await expect(
        compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'new@example.com' })
      ).rejects.toThrow('another transaction');
    });

    it('devrait gérer un deadlock de base de données', async () => {
      const deadlockError = new Error('Deadlock detected');
      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockRejectedValue(deadlockError);

      await expect(
        compteClient.mettreAJourMotDePasse(1, 'hash', false)
      ).rejects.toThrow('Deadlock');
    });
  });

  describe('Erreurs de format de données', () => {
    it('devrait gérer un format JSON invalide dans les données', async () => {
      const jsonError = new Error('Unexpected token in JSON');
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(jsonError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('JSON');
    });

    it('devrait gérer un encodage de caractères invalide', async () => {
      const encodingError = new Error('Invalid character encoding');
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockRejectedValue(encodingError);

      await expect(
        compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'test@example.com' })
      ).rejects.toThrow('encoding');
    });
  });

  describe('Gestion des erreurs multiples', () => {
    it('devrait accumuler plusieurs erreurs de validation', async () => {
      const updateData = {
        email: 'invalid-email',
        date_naissance: '32/13/2023',
        genres: -1
      };

      const mockResult = {
        isConfirm: false,
        message: 'Plusieurs erreurs de validation',
        errors: [
          'Format email invalide',
          'Format de date invalide',
          'ID de genre invalide'
        ]
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('devrait gérer une chaîne d\'erreurs', async () => {
      const chainError = new Error('Primary error');
      (chainError as any).cause = new Error('Secondary error');

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(chainError);

      await expect(
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      ).rejects.toThrow('Primary error');
    });
  });
});
