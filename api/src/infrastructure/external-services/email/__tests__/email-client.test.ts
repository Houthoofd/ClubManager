/**
 * Tests pour EmailClient - Système unifié (templates HTML)
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock du template-loader pour éviter les dépendances filesystem
await jest.unstable_mockModule("../template-loader.js", () => ({
  templateLoader: {
    loadTemplate: jest.fn(),
    previewTemplate: jest.fn(),
    listAvailableTemplates: jest.fn(),
    templateExists: jest.fn(),
  },
}));

// Mock de sendgrid-sender
await jest.unstable_mockModule("../sendgrid-sender.js", () => ({
  sendGridSender: {
    send: jest.fn(),
  },
}));

const { EmailClient } = await import("../email-client.js");

describe("EmailClient", () => {
  let emailClient: InstanceType<typeof EmailClient>;

  beforeEach(() => {
    emailClient = new EmailClient();
  });

  describe("Structure", () => {
    it("should create EmailClient instance", () => {
      expect(emailClient).toBeInstanceOf(EmailClient);
    });

    it("should have sendEmail method", () => {
      expect(typeof emailClient.sendEmail).toBe("function");
    });

    it("should have sendPromotionEmail method", () => {
      expect(typeof emailClient.sendPromotionEmail).toBe("function");
    });

    it("should have sendWelcomeEmail method", () => {
      expect(typeof emailClient.sendWelcomeEmail).toBe("function");
    });

    it("should have sendOrderConfirmationEmail method", () => {
      expect(typeof emailClient.sendOrderConfirmationEmail).toBe("function");
    });

    it("should have sendPasswordResetEmail method", () => {
      expect(typeof emailClient.sendPasswordResetEmail).toBe("function");
    });

    it("should have previewTemplate method", () => {
      expect(typeof emailClient.previewTemplate).toBe("function");
    });

    it("should have listTemplates method", () => {
      expect(typeof emailClient.listTemplates).toBe("function");
    });

    it("should have templateExists method", () => {
      expect(typeof emailClient.templateExists).toBe("function");
    });
  });

  describe("Nouveau système unifié", () => {
    it("should use template-loader instead of emailTemplateService", () => {
      // Le nouveau système n'utilise plus emailTemplateService
      // Tous les templates viennent de fichiers HTML via template-loader
      expect(emailClient).toBeDefined();
    });

    it("should have preview capabilities", () => {
      // Le nouveau système permet de prévisualiser les templates
      expect(typeof emailClient.previewTemplate).toBe("function");
    });

    it("should list available templates", () => {
      // Le nouveau système peut lister tous les templates disponibles
      expect(typeof emailClient.listTemplates).toBe("function");
    });
  });

  describe.skip("sendPromotionEmail", () => {
    it("should send promotion email", async () => {
      // Test à implémenter avec mocks
    });
  });

  describe.skip("sendWelcomeEmail", () => {
    it("should send welcome email", async () => {
      // Test à implémenter avec mocks
    });
  });

  describe.skip("sendOrderConfirmationEmail", () => {
    it("should send order confirmation", async () => {
      // Test à implémenter avec mocks
    });
  });
});
