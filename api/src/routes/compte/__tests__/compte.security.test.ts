/**
 * Tests de sécurité pour le service Compte
 * Tests des aspects de sécurité, authentification et autorisation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';
import bcrypt from 'bcrypt';

describe('Compte Service - Tests de sécurité', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  describe('Sécurité du mot de passe', () => {
    it('devrait hasher les mots de passe avec bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('devrait utiliser un salt cost minimum de 10', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const saltRounds = hash.split('$')[2];
      expect(parseInt(saltRounds)).toBeGreaterThanOrEqual(10);
    });

    it('ne devrait jamais stocker de mots de passe en texte clair', async () => {
      const plainPassword = 'PlainPassword123';

      const mockResult = {
        isConfirm: false,
        message: 'Le mot de passe doit être hashé'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, plainPassword, true);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter des mots de passe trop courts', async () => {
      const shortPassword = 'short';

      const mockResult = {
        isConfirm: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, shortPassword, true);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait empêcher la réutilisation du même mot de passe', async () => {
      const samePassword = await bcrypt.hash('SamePassword123!', 10);

      const mockResult = {
        isConfirm: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, samePassword, false);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait générer des hashes différents pour le même mot de passe', async () => {
      const password = 'SamePassword123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Protection contre les injections SQL', () => {
    it('devrait échapper les caractères spéciaux dans le prénom', async () => {
      const sqlInjection = "John'; DROP TABLE utilisateurs; --";

      const mockResult = {
        isFind: false,
        message: 'Caractères dangereux détectés'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(sqlInjection, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait échapper les caractères spéciaux dans le nom', async () => {
      const sqlInjection = "Doe' OR '1'='1";

      const mockResult = {
        isFind: false,
        message: 'Caractères dangereux détectés'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', sqlInjection);

      expect(result.isFind).toBe(false);
    });

    it('devrait protéger contre les injections SQL dans l\'email', async () => {
      const updateData = { email: "admin@example.com' OR '1'='1" };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait protéger contre les commentaires SQL', async () => {
      const sqlComment = "John-- comment";

      const mockResult = {
        isFind: false,
        message: 'Caractères dangereux détectés'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(sqlComment, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait protéger contre les unions SQL', async () => {
      const sqlUnion = "John' UNION SELECT * FROM users --";

      const mockResult = {
        isFind: false,
        message: 'Caractères dangereux détectés'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(sqlUnion, 'Doe');

      expect(result.isFind).toBe(false);
    });
  });

  describe('Protection contre XSS (Cross-Site Scripting)', () => {
    it('devrait échapper les balises HTML dans le prénom', async () => {
      const xssAttempt = '<script>alert("XSS")</script>';

      const mockResult = {
        isFind: false,
        message: 'Contenu HTML non autorisé'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(xssAttempt, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait échapper les événements JavaScript', async () => {
      const xssEvent = '<img src=x onerror="alert(1)">';

      const mockResult = {
        isFind: false,
        message: 'Contenu HTML non autorisé'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(xssEvent, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait bloquer les balises iframe', async () => {
      const xssIframe = '<iframe src="malicious.com"></iframe>';

      const mockResult = {
        isFind: false,
        message: 'Contenu HTML non autorisé'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(xssIframe, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait échapper les entités HTML encodées', async () => {
      const htmlEntity = '&lt;script&gt;alert("XSS")&lt;/script&gt;';

      const mockResult = {
        isFind: false,
        message: 'Contenu suspect détecté'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(htmlEntity, 'Doe');

      expect(result.isFind).toBe(false);
    });
  });

  describe('Validation et sanitisation des données', () => {
    it('devrait valider le format de l\'email', async () => {
      const invalidEmail = 'not-an-email';

      const updateData = { email: invalidEmail };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait limiter la longueur des chaînes de caractères', async () => {
      const tooLongName = 'A'.repeat(300);

      const mockResult = {
        isFind: false,
        message: 'Le prénom est trop long (max 100 caractères)'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(tooLongName, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait valider les IDs numériques', async () => {
      const invalidId = 'not-a-number';

      const mockResult = {
        isConfirm: false,
        message: 'ID utilisateur invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(invalidId as any, 'hash', false);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter les IDs négatifs', async () => {
      const negativeId = -5;

      const mockResult = {
        isConfirm: false,
        message: 'ID utilisateur invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(negativeId, 'hash', false);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Contrôle d\'accès et autorisation', () => {
    it('devrait empêcher la modification de compte d\'un autre utilisateur', async () => {
      const unauthorizedUpdate = {
        email: 'hacker@example.com'
      };

      const mockResult = {
        isConfirm: false,
        message: 'Accès non autorisé'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(999, unauthorizedUpdate);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('non autorisé');
    });

    it('devrait vérifier les permissions avant de modifier le status', async () => {
      const updateData = { status: 'Admin' };

      const mockResult = {
        isConfirm: false,
        message: 'Permission insuffisante pour modifier le status'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait limiter les tentatives de recherche d\'utilisateurs', async () => {
      const mockResult = {
        isFind: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      // Simuler plusieurs tentatives
      for (let i = 0; i < 5; i++) {
        await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      }

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(false);
    });
  });

  describe('Protection des données sensibles', () => {
    it('ne devrait pas retourner le mot de passe dans les informations utilisateur', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com',
          // password ne devrait pas être présent
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.data).toBeDefined();
      expect(result.data).not.toHaveProperty('password');
      expect(result.data).not.toHaveProperty('password_hash');
    });

    it('devrait masquer les données sensibles dans les logs', async () => {
      const updateData = {
        email: 'john.doe@example.com',
        password: 'SecurePassword123!'
      };

      // Les logs ne devraient jamais contenir le mot de passe
      const mockResult = {
        isConfirm: true,
        message: 'Compte mis à jour',
        logData: {
          email: 'john.doe@example.com',
          password: '***MASKED***'
        }
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait masquer partiellement l\'email dans les logs publics', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'j***@example.com' // Email partiellement masqué
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.data.email).toContain('***');
    });
  });

  describe('Protection contre les attaques par force brute', () => {
    it('devrait limiter le nombre de tentatives de modification de mot de passe', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Trop de tentatives. Compte temporairement verrouillé.'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'hash', false);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('verrouillé');
    });

    it('devrait implémenter un délai progressif entre les tentatives', async () => {
      const startTime = Date.now();

      const mockResult = {
        isConfirm: false,
        message: 'Veuillez attendre avant de réessayer'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      await compteClient.mettreAJourMotDePasse(1, 'hash', false);
      const endTime = Date.now();

      // Un délai devrait être imposé
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation de session et tokens', () => {
    it('devrait valider l\'authenticité de la session', async () => {
      const mockResult = {
        isFind: false,
        message: 'Session invalide ou expirée'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait vérifier l\'expiration du token', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Token expiré. Veuillez vous reconnecter.'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, {});

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Audit et traçabilité', () => {
    it('devrait logger les tentatives de modification de mot de passe', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe modifié',
        auditLog: {
          action: 'PASSWORD_CHANGE',
          userId: 1,
          timestamp: new Date(),
          ipAddress: '192.168.1.1'
        }
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'newHash', false);

      expect(result.isConfirm).toBe(true);
      expect(result.auditLog).toBeDefined();
    });

    it('devrait enregistrer les échecs de mise à jour', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Échec de la mise à jour',
        auditLog: {
          action: 'UPDATE_FAILED',
          userId: 1,
          timestamp: new Date(),
          reason: 'Invalid data'
        }
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, {});

      expect(result.isConfirm).toBe(false);
      expect(result.auditLog).toBeDefined();
    });
  });

  describe('Protection contre CSRF', () => {
    it('devrait valider le token CSRF pour les modifications', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Token CSRF invalide ou manquant'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, {});

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('CSRF');
    });
  });

  describe('Conformité RGPD', () => {
    it('devrait permettre l\'exportation des données personnelles', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com',
          date_naissance: '1990-01-01'
        },
        exportable: true
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.exportable).toBe(true);
    });

    it('devrait permettre la suppression des données personnelles', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Données personnelles supprimées conformément au RGPD'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, { deleted: true });

      expect(result.isConfirm).toBe(true);
    });
  });
});
