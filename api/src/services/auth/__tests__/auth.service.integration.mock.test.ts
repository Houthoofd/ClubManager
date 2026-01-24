/**
 * Tests d'intégration pour le service Auth avec Mock Local
 * 
 * Ces tests vérifient les workflows complets avec interaction de base de données
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockPrisma, initializePasswordHashes } from './auth.mock.js';

// Import des fonctions core
import * as authentication from '../core/authentication/index.js';
import * as password from '../core/password/index.js';
import * as tokens from '../core/tokens/index.js';
import * as security from '../core/security/index.js';

describe('AuthService - Tests d\'intégration avec Mock Local', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    await initializePasswordHashes();
    mockPrisma._reset();
  });

  describe('Authentication Core - Workflows complets', () => {
    it('devrait authentifier un utilisateur avec les bonnes credentials', async () => {
      const result = await authentication.authentifierUtilisateur(
        'jean@test.com', 
        'password123', 
        mockPrisma
      );
      
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('jean@test.com');
      expect(result.user?.firstName).toBe('Jean');
      expect(result.message).toContain('réussie');
    });

    it('devrait rejeter un mauvais mot de passe', async () => {
      const result = await authentication.authentifierUtilisateur(
        'jean@test.com', 
        'wrongpassword', 
        mockPrisma
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('incorrect');
    });

    it('devrait créer un nouveau compte utilisateur', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'ValidPass123'
      };

      const result = await authentication.creerCompteUtilisateur(userData, mockPrisma);
      
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('newuser@test.com');
      expect(result.user?.firstName).toBe('Test');
    });

    it('devrait vérifier si un email existe', async () => {
      const exists = await authentication.emailExiste('jean@test.com', mockPrisma);
      expect(exists).toBe(true);

      const notExists = await authentication.emailExiste('inconnu@test.com', mockPrisma);
      expect(notExists).toBe(false);
    });
  });

  describe('Password Core - Gestion complète des mots de passe', () => {
    it('devrait changer le mot de passe d\'un utilisateur', async () => {
      const result = await password.modifierMotDePasse(
        1, 
        'NewPassword123!', 
        mockPrisma
      );
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('modifié');
    });

    it('devrait échouer si l\'utilisateur n\'existe pas', async () => {
      const result = await password.modifierMotDePasse(
        999, // ID inexistant
        'NewPassword123!', 
        mockPrisma
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('trouvé');
    });
  });

  describe('Tokens Core - Gestion complète des tokens', () => {
    it('devrait créer un token de récupération', async () => {
      const result = await tokens.creerTokenRecuperation(
        1, // userId au lieu d'email 
        1, // 1 heure
        mockPrisma
      );
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.message).toContain('créé');
    });

    it('devrait vérifier un token de récupération valide', async () => {
      // D'abord créer un token
      const createResult = await tokens.creerTokenRecuperation(
        1, // userId
        1, // 1 heure
        mockPrisma
      );
      
      expect(createResult.success).toBe(true);
      const token = createResult.token!;
      
      // Puis le vérifier
      const verifyResult = await tokens.verifierTokenRecuperation(token, mockPrisma);
      expect(verifyResult).toBeDefined();
      expect(verifyResult?.userId).toBe(1);
    });

    it('devrait rejeter un token invalide', async () => {
      const result = await tokens.verifierTokenRecuperation(
        'invalid-token', 
        mockPrisma
      );
      
      expect(result).toBeNull();
    });

    it('devrait réinitialiser un mot de passe avec un token valide', async () => {
      // Créer un token
      const createResult = await tokens.creerTokenRecuperation(
        1, // userId
        1, // 1 heure
        mockPrisma
      );
      
      const token = createResult.token!;
      
      // Réinitialiser le mot de passe
      const resetResult = await tokens.reinitialiserMotDePasseAvecToken(
        token, 
        'NewPassword123!', 
        mockPrisma
      );
      
      expect(resetResult.success).toBe(true);
      expect(resetResult.message).toContain('réinitialisé');
    });

    it('devrait nettoyer les tokens expirés', async () => {
      const result = await tokens.nettoyerTokensExpires(mockPrisma);
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('count'); // La fonction retourne {count: number}
    });

    it('devrait gérer le workflow complet de récupération de mot de passe', async () => {
      // 1. Créer un token
      const createResult = await tokens.creerTokenRecuperation(1, 1, mockPrisma);
      expect(createResult.success).toBe(true);
      const token = createResult.token!;

      // 2. Vérifier le token
      const verifyResult = await tokens.verifierTokenRecuperation(token, mockPrisma);
      expect(verifyResult).toBeDefined();

      // 3. Utiliser le token pour réinitialiser
      const resetResult = await tokens.reinitialiserMotDePasseAvecToken(
        token, 
        'NewSecurePass123!', 
        mockPrisma
      );
      expect(resetResult.success).toBe(true);

      // 4. Vérifier que le token est maintenant invalide (utilisé)
      const reVerifyResult = await tokens.verifierTokenRecuperation(token, mockPrisma);
      expect(reVerifyResult).toBeNull();
    });
  });

  describe('Security Core - Fonctions de sécurité avancées', () => {
    it('devrait rechercher un utilisateur par email', async () => {
      const user = await security.rechercherUtilisateurParEmail(
        'jean@test.com', 
        mockPrisma
      );
      
      expect(user).toBeDefined();
      expect(user?.email).toBe('jean@test.com');
      expect(user?.first_name).toBe('Jean');
    });

    it('devrait retourner null pour un email inexistant', async () => {
      const user = await security.rechercherUtilisateurParEmail(
        'inconnu@test.com', 
        mockPrisma
      );
      
      expect(user).toBeNull();
    });

    it('devrait obtenir les informations de sécurité', async () => {
      const info = await security.obtenirInformationsSecurite(1, mockPrisma);
      
      expect(info).toBeDefined();
      expect(info?.id).toBe(1);
      expect(typeof info?.email).toBe('string');
      expect(typeof info?.firstName).toBe('string');
      expect(typeof info?.lastName).toBe('string');
    });

    it('devrait obtenir les statistiques d\'authentification', async () => {
      const stats = await security.obtenirStatistiquesAuth(mockPrisma);
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(typeof stats.authAttemptsToday).toBe('number');
      expect(typeof stats.successfulAuthsToday).toBe('number');
      expect(typeof stats.failedAuthsToday).toBe('number');
      expect(typeof stats.successRate).toBe('number');
      expect(typeof stats.resetTokensActive).toBe('number');
    });
  });

  describe('Isolation et intégrité des tests', () => {
    it('devrait réinitialiser les données entre les tests', () => {
      // Vérifier que le mock a bien sa méthode de reset
      expect(typeof mockPrisma._reset).toBe('function');
      
      // Le reset est appelé dans beforeEach, donc les données devraient être propres
      expect(mockPrisma.utilisateurs.findFirst).toBeDefined();
      expect(mockPrisma.password_reset_tokens.create).toBeDefined();
    });

    it('devrait fonctionner indépendamment des mocks globaux', async () => {
      // Ce test vérifie que notre mock local fonctionne
      const user = await mockPrisma.utilisateurs.findFirst({
        where: { email: 'jean@test.com' }
      });
      
      expect(user).toBeDefined();
      expect(user.email).toBe('jean@test.com');
    });

    it('devrait maintenir l\'état entre plusieurs opérations dans un même test', async () => {
      // Créer un utilisateur
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
        password: 'ValidPass123'
      };

      const createResult = await authentication.creerCompteUtilisateur(userData, mockPrisma);
      expect(createResult.success).toBe(true);

      // Vérifier qu'il peut être authentifié immédiatement
      const authResult = await authentication.authentifierUtilisateur(
        'integration@test.com',
        'ValidPass123',
        mockPrisma
      );
      
      expect(authResult.success).toBe(true);
      expect(authResult.user?.email).toBe('integration@test.com');
    });
  });
});