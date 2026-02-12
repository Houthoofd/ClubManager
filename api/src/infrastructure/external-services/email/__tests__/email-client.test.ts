/**
 * Tests pour EmailClient - Version simplifiée sans mocks complexes
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock du emailTemplateService pour éviter l'erreur MysqlConnector
await jest.unstable_mockModule('../../../services/emailTemplateService.js', () => ({
  emailTemplateService: {
    getTemplateByTitle: jest.fn(),
    getTemplateById: jest.fn(),
  },
}));

const { EmailClient } = await import('../email-client.js');

describe('EmailClient', () => {
  let emailClient: InstanceType<typeof EmailClient>;

  beforeEach(() => {
    emailClient = new EmailClient();
  });

  describe('Structure', () => {
    it('should create EmailClient instance', () => {
      expect(emailClient).toBeInstanceOf(EmailClient);
    });

    it('should have sendEmail method', () => {
      expect(typeof emailClient.sendEmail).toBe('function');
    });

    it('should have sendPromotionEmail method', () => {
      expect(typeof emailClient.sendPromotionEmail).toBe('function');
    });

    it('should have sendWelcomeEmail method', () => {
      expect(typeof emailClient.sendWelcomeEmail).toBe('function');
    });

    it('should have sendOrderConfirmationEmail method', () => {
      expect(typeof emailClient.sendOrderConfirmationEmail).toBe('function');
    });
  });

  // TODO: Ajouter tests avec mocks une fois les dépendances résolues
  describe.skip('sendEmail', () => {
    it('should send simple email', async () => {
      // Test à implémenter avec mocks
    });
  });

  describe.skip('sendPromotionEmail', () => {
    it('should send promotion email', async () => {
      // Test à implémenter avec mocks
    });
  });

  describe.skip('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      // Test à implémenter avec mocks
    });
  });

  describe.skip('sendOrderConfirmationEmail', () => {
    it('should send order confirmation', async () => {
      // Test à implémenter avec mocks
    });
  });
});
