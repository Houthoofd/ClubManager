/**
 * Tests pour VariablesPreparator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { VariablesPreparator } from '../variables-preparator';

describe('VariablesPreparator', () => {
  let preparator: VariablesPreparator;

  beforeEach(() => {
    preparator = new VariablesPreparator();
  });

  describe('prepareCommonVariables', () => {
    it('should prepare common variables with defaults', () => {
      const variables = preparator.prepareCommonVariables();

      expect(variables).toHaveProperty('clubName');
      expect(variables).toHaveProperty('clubWebsite');
      expect(variables).toHaveProperty('supportEmail');
      expect(variables).toHaveProperty('currentYear');
      expect(variables).toHaveProperty('currentDate');
      expect(variables.currentYear).toBe(new Date().getFullYear().toString());
    });

    it('should merge custom variables', () => {
      const custom = { customKey: 'customValue' };
      const variables = preparator.prepareCommonVariables(custom);

      expect(variables.customKey).toBe('customValue');
      expect(variables).toHaveProperty('clubName');
    });

    it('should override default values', () => {
      const custom = { clubName: 'Custom Club' };
      const variables = preparator.prepareCommonVariables(custom);

      expect(variables.clubName).toBe('Custom Club');
    });
  });

  describe('preparePromotionVariables', () => {
    it('should prepare promotion variables for a user', () => {
      const user = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const variables = preparator.preparePromotionVariables(user);

      expect(variables.userName).toBe('John Doe');
      expect(variables.firstName).toBe('John');
      expect(variables.lastName).toBe('Doe');
      expect(variables.email).toBe('john@example.com');
      expect(variables.userId).toBe('1');
      expect(variables.promotionDate).toBeDefined();
    });

    it('should include custom message', () => {
      const user = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const custom = { customMessage: 'Félicitations!' };
      const variables = preparator.preparePromotionVariables(user, custom);

      expect(variables.customMessage).toBe('Félicitations!');
    });

    it('should have default custom message', () => {
      const user = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const variables = preparator.preparePromotionVariables(user);

      expect(variables.customMessage).toBe('Bienvenue dans l\'équipe des professeurs !');
    });
  });

  describe('prepareWelcomeVariables', () => {
    it('should prepare welcome variables for a user', () => {
      const user = {
        id: 1,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      };

      const variables = preparator.prepareWelcomeVariables(user);

      expect(variables.userName).toBe('Jane Smith');
      expect(variables.firstName).toBe('Jane');
      expect(variables.lastName).toBe('Smith');
      expect(variables.email).toBe('jane@example.com');
      expect(variables.userId).toBe('1');
    });
  });

  describe('prepareOrderVariables', () => {
    it('should prepare order confirmation variables', () => {
      const variables = preparator.prepareOrderVariables(
        'John Doe',
        'CMD-12345',
        {
          dateCommande: '2026-01-24',
          statutCommande: 'confirmée',
          nbArticles: '3',
          totalCommande: '49.99',
        }
      );

      expect(variables.userName).toBe('John Doe');
      expect(variables.numeroCommande).toBe('CMD-12345');
      expect(variables.dateCommande).toBe('2026-01-24');
      expect(variables.statutCommande).toBe('confirmée');
      expect(variables.nbArticles).toBe('3');
      expect(variables.totalCommande).toBe('49.99');
    });

    it('should include common variables', () => {
      const variables = preparator.prepareOrderVariables(
        'John Doe',
        'CMD-12345',
        {
          dateCommande: '2026-01-24',
          statutCommande: 'confirmée',
          nbArticles: '3',
          totalCommande: '49.99',
        }
      );

      expect(variables).toHaveProperty('clubName');
      expect(variables).toHaveProperty('currentYear');
    });
  });
});
