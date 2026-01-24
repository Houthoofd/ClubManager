/**
 * Tests unitaires pour le service Auth avec Mock Local
 * 
 * Ces tests vérifient les fonctions individuelles sans interaction de base de données
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { initializePasswordHashes } from './auth.mock.js';

// Import des fonctions core
import * as password from '../core/password/index.js';
import * as tokens from '../core/tokens/index.js';

describe('AuthService - Tests unitaires', () => {

  beforeEach(async () => {
    await initializePasswordHashes();
  });

  describe('Password Core - Validation et hashage', () => {
    it('devrait valider un mot de passe fort', () => {
      const result = password.validerMotDePasse('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un mot de passe faible', () => {
      const result = password.validerMotDePasse('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait hasher un mot de passe', async () => {
      const hash = await password.hasherMotDePasse('testpassword');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('devrait vérifier un mot de passe hashé', async () => {
      const hash = await password.hasherMotDePasse('testpassword');
      const isValid = await password.verifierMotDePasse('testpassword', hash);
      expect(isValid).toBe(true);

      const isInvalid = await password.verifierMotDePasse('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('devrait valider un email correct', () => {
      expect(password.validerEmail('test@example.com')).toBe(true);
      expect(password.validerEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      expect(password.validerEmail('invalid-email')).toBe(false);
      expect(password.validerEmail('test@')).toBe(false);
      expect(password.validerEmail('@domain.com')).toBe(false);
    });
  });

  describe('Tokens Core - Génération sécurisée', () => {
    it('devrait générer un token sécurisé', () => {
      const token = tokens.genererTokenSecurise();
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      expect(typeof token).toBe('string');
    });

    it('devrait générer des tokens uniques', () => {
      const tokens1 = Array.from({length: 10}, () => tokens.genererTokenSecurise());
      const uniqueTokens = new Set(tokens1);
      expect(uniqueTokens.size).toBe(10); // Tous les tokens doivent être uniques
    });

    it('devrait générer des tokens de longueur appropriée', () => {
      const token = tokens.genererTokenSecurise();
      // Les tokens doivent être assez longs pour être sécurisés
      expect(token.length).toBeGreaterThanOrEqual(32);
    });
  });
});