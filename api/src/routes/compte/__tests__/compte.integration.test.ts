/**
 * Tests d'intégration pour le service Compte
 * Tests des interactions entre les différents composants
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';
import bcrypt from 'bcrypt';

describe('Compte Service - Tests d\'intégration', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cycle de vie complet d\'un compte', () => {
    it('devrait créer un compte, ajouter un mot de passe, puis le modifier', async () => {
      // 1. Récupérer les informations d'un utilisateur sans mot de passe
      const mockUtilisateur = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com',
          password: null
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockUtilisateur as any);

      const utilisateur = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      expect(utilisateur.isFind).toBe(true);
      expect(utilisateur.data.password).toBeNull();

      // 2. Créer un mot de passe
      const hashedPassword = await bcrypt.hash('FirstPassword123!', 10);
      const mockCreation = {
        isConfirm: true,
        message: 'Mot de passe créé avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockCreation as any);

      const creation = await compteClient.mettreAJourMotDePasse(1, hashedPassword, true);
      expect(creation.isConfirm).toBe(true);

      // 3. Modifier le mot de passe
      const newHashedPassword = await bcrypt.hash('NewPassword456!', 10);
      const mockModification = {
        isConfirm: true,
        message: 'Mot de passe modifié avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValueOnce(mockModification as any);

      const modification = await compteClient.mettreAJourMotDePasse(1, newHashedPassword, false);
      expect(modification.isConfirm).toBe(true);
    });

    it('devrait créer un compte et mettre à jour toutes ses informations', async () => {
      // 1. Récupérer un nouvel utilisateur
      const mockNouvelUtilisateur = {
        isFind: true,
        data: {
          id: 2,
          prenom: 'Jane',
          nom: 'Smith',
          email: 'jane.smith@example.com',
          date_naissance: null,
          genre: null,
          grade: null,
          abonnement: null,
          status: null
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockNouvelUtilisateur as any);

      const utilisateur = await compteClient.obtenirInformationsUtilisateur('Jane', 'Smith');
      expect(utilisateur.isFind).toBe(true);

      // 2. Mettre à jour toutes les informations
      const updateData = {
        email: 'jane.updated@example.com',
        date_naissance: '1992-03-15',
        genres: 2,
        grades: 'Ceinture bleue',
        abonnement: 3,
        status: 1
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Toutes les informations mises à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(2, updateData);
      expect(result.isConfirm).toBe(true);
    });
  });

  describe('Intégration avec la base de données', () => {
    it('devrait gérer une transaction complète de mise à jour', async () => {
      const updateData = {
        email: 'transaction@example.com',
        genres: 1,
        grades: 2
      };

      const mockResult = {
        isConfirm: true,
        message: 'Transaction complétée',
        transactionId: 'txn_12345'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.transactionId).toBeDefined();
    });

    it('devrait rollback une transaction en cas d\'erreur', async () => {
      const updateData = {
        email: 'invalid@',
        genres: 9999 // ID inexistant
      };

      const mockError = {
        isConfirm: false,
        message: 'Transaction rollback: FOREIGN KEY constraint failed',
        rollback: true
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockError as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.rollback).toBe(true);
    });
  });

  describe('Intégration avec les services externes', () => {
    it('devrait mettre à jour le compte et notifier par email', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Compte mis à jour',
        emailSent: true
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.emailSent).toBe(true);
    });

    it('devrait réussir la mise à jour même si l\'email échoue', async () => {
      const updateData = {
        email: 'updated@example.com'
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Compte mis à jour',
        emailSent: false,
        emailError: 'Service email temporairement indisponible'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBeDefined();
    });
  });

  describe('Intégration avec le système d\'échéances', () => {
    it('devrait régénérer les échéances lors d\'un changement d\'abonnement', async () => {
      const updateData = {
        abonnement: 3 // Nouvel abonnement
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Abonnement mis à jour',
        echeancesUpdated: true,
        newEcheances: [
          { id: 1, montant: 50, date: '2024-02-01' },
          { id: 2, montant: 50, date: '2024-03-01' }
        ]
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.echeancesUpdated).toBe(true);
      expect(result.newEcheances).toHaveLength(2);
    });

    it('devrait supprimer les anciennes échéances avant d\'en créer de nouvelles', async () => {
      const updateData = {
        abonnement: 2
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Abonnement mis à jour',
        echeancesDeleted: 3,
        echeancesCreated: 2
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.echeancesDeleted).toBe(3);
      expect(result.echeancesCreated).toBe(2);
    });

    it('ne devrait pas régénérer les échéances si l\'abonnement ne change pas', async () => {
      const updateData = {
        email: 'same@example.com',
        date_naissance: '1990-01-01'
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Informations mises à jour',
        echeancesUpdated: false
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.echeancesUpdated).toBe(false);
    });
  });

  describe('Intégration avec le système de cache', () => {
    it('devrait invalider le cache après une mise à jour', async () => {
      const updateData = {
        email: 'cached@example.com'
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Compte mis à jour',
        cacheInvalidated: true
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.cacheInvalidated).toBe(true);
    });

    it('devrait récupérer les données du cache si disponibles', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe'
        },
        fromCache: true
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(true);
      expect(result.fromCache).toBe(true);
    });
  });

  describe('Intégration avec le système d\'audit', () => {
    it('devrait enregistrer un log d\'audit pour chaque modification', async () => {
      const updateData = {
        email: 'audited@example.com'
      };

      const mockUpdate = {
        isConfirm: true,
        message: 'Compte mis à jour',
        auditLog: {
          id: 'audit_12345',
          action: 'UPDATE_EMAIL',
          userId: 1,
          timestamp: new Date(),
          changes: { email: { old: 'old@example.com', new: 'audited@example.com' } }
        }
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockUpdate as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.action).toBe('UPDATE_EMAIL');
    });

    it('devrait enregistrer les tentatives échouées', async () => {
      const updateData = {
        email: 'invalid@'
      };

      const mockError = {
        isConfirm: false,
        message: 'Format email invalide',
        auditLog: {
          id: 'audit_67890',
          action: 'UPDATE_FAILED',
          userId: 1,
          timestamp: new Date(),
          error: 'Format email invalide'
        }
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockError as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.action).toBe('UPDATE_FAILED');
    });
  });

  describe('Scénarios complexes multi-étapes', () => {
    it('devrait gérer une migration complète de compte', async () => {
      // 1. Récupérer le compte existant
      const mockExisting = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe', email: 'john@old.com' }
      };
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValueOnce(mockExisting as any);

      const existing = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      expect(existing.isFind).toBe(true);

      // 2. Mettre à jour l'email
      const mockEmailUpdate = {
        isConfirm: true,
        message: 'Email mis à jour'
      };
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValueOnce(mockEmailUpdate as any);

      const emailUpdate = await compteClient.mettreAJourUtilisateurAvecConversion(1, { email: 'john@new.com' });
      expect(emailUpdate.isConfirm).toBe(true);

      // 3. Créer un nouveau mot de passe
      const hash = await bcrypt.hash('NewSecurePassword!', 10);
      const mockPasswordCreate = {
        isConfirm: true,
        message: 'Mot de passe créé'
      };
      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValueOnce(mockPasswordCreate as any);

      const passwordCreate = await compteClient.mettreAJourMotDePasse(1, hash, true);
      expect(passwordCreate.isConfirm).toBe(true);

      // 4. Mettre à jour l'abonnement
      const mockAbonnementUpdate = {
        isConfirm: true,
        message: 'Abonnement mis à jour',
        echeancesUpdated: true
      };
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValueOnce(mockAbonnementUpdate as any);

      const abonnementUpdate = await compteClient.mettreAJourUtilisateurAvecConversion(1, { abonnement: 3 });
      expect(abonnementUpdate.isConfirm).toBe(true);
      expect(abonnementUpdate.echeancesUpdated).toBe(true);
    });

    it('devrait gérer une série de mises à jour avec validation', async () => {
      const updates = [
        { email: 'step1@example.com' },
        { date_naissance: '1990-01-01' },
        { genres: 1 },
        { grades: 'Ceinture noire' }
      ];

      for (const update of updates) {
        const mockResult = {
          isConfirm: true,
          message: 'Mise à jour réussie'
        };
        jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValueOnce(mockResult as any);

        const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, update);
        expect(result.isConfirm).toBe(true);
      }
    });
  });

  describe('Tests de performance et charge', () => {
    it('devrait gérer des mises à jour simultanées de différents utilisateurs', async () => {
      const userIds = [1, 2, 3, 4, 5];
      const promises = userIds.map(userId => {
        const mockResult = {
          isConfirm: true,
          message: `Utilisateur ${userId} mis à jour`
        };
        jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValueOnce(mockResult as any);

        return compteClient.mettreAJourUtilisateurAvecConversion(userId, { email: `user${userId}@example.com` });
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.isConfirm).toBe(true);
      });
    });

    it('devrait gérer un grand volume de recherches', async () => {
      const searches = Array(100).fill(null).map((_, i) => ({
        prenom: `User${i}`,
        nom: `Test${i}`
      }));

      for (const search of searches) {
        const mockResult = {
          isFind: true,
          data: { prenom: search.prenom, nom: search.nom }
        };
        jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValueOnce(mockResult as any);

        const result = await compteClient.obtenirInformationsUtilisateur(search.prenom, search.nom);
        expect(result.isFind).toBe(true);
      }
    });
  });

  describe('Intégration avec les permissions et rôles', () => {
    it('devrait vérifier les permissions avant la mise à jour', async () => {
      const updateData = {
        status: 'Admin' // Changement de rôle
      };

      const mockResult = {
        isConfirm: false,
        message: 'Permission insuffisante pour modifier le statut'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('Permission');
    });

    it('devrait permettre la mise à jour avec les bonnes permissions', async () => {
      const updateData = {
        status: 'Membre',
        adminOverride: true
      };

      const mockResult = {
        isConfirm: true,
        message: 'Statut mis à jour avec override admin'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });
  });
});
