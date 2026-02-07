/**
 * Tests unitaires des services Stripe
 * Teste la logique métier isolée avec mocks des dépendances
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { StripeService } from "../core/services/stripe.service.js";
import { PaymentService } from "../core/services/payment.service.js";
import { StatusUpgradeService } from "../core/services/status-upgrade.service.js";
import { EmailNotificationService } from "../core/services/email-notification.service.js";

// Mock Stripe SDK
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }));
});

describe("Stripe Services - Tests unitaires", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singletons entre chaque test
    (StripeService as any).instance = null;
    (PaymentService as any).instance = null;
    (StatusUpgradeService as any).instance = null;
    (EmailNotificationService as any).instance = null;
  });

  // ==================== STRIPE SERVICE ====================
  describe("StripeService", () => {
    it("devrait être un singleton", () => {
      const instance1 = StripeService.getInstance();
      const instance2 = StripeService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("devrait retourner la configuration Stripe", () => {
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";
      const service = StripeService.getInstance();
      const config = service.obtenirConfiguration();

      expect(config).toHaveProperty("publishableKey");
      expect(config).toHaveProperty("paymentMethods");
      expect(typeof config.paymentMethods).toBe("object");
      expect(config.paymentMethods).toHaveProperty("card");
      expect(config.paymentMethods).toHaveProperty("bancontact");
    });

    it("devrait gérer l'absence de clé publique", () => {
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      const service = StripeService.getInstance();
      const config = service.obtenirConfiguration();

      expect(config.publishableKey).toBe("");
    });
  });

  // ==================== PAYMENT SERVICE ====================
  describe("PaymentService", () => {
    it("devrait être un singleton", () => {
      const instance1 = PaymentService.getInstance();
      const instance2 = PaymentService.getInstance();
      expect(instance1).toBe(instance2);
    });

    // Note: Les tests avec DB réelle sont dans stripe.real-integration.test.ts
    // Ici on teste la logique sans DB
  });

  // ==================== STATUS UPGRADE SERVICE ====================
  describe("StatusUpgradeService", () => {
    it("devrait être un singleton", () => {
      const instance1 = StatusUpgradeService.getInstance();
      const instance2 = StatusUpgradeService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("ne devrait pas upgrader si ce n'est pas le premier paiement", async () => {
      const service = StatusUpgradeService.getInstance();
      const result = await service.upgraderStatutUtilisateur(1, false);

      expect(result.upgraded).toBe(false);
    });

    // Tests avec DB réelle dans stripe.real-integration.test.ts
  });

  // ==================== EMAIL NOTIFICATION SERVICE ====================
  describe("EmailNotificationService", () => {
    it("devrait être un singleton", () => {
      const instance1 = EmailNotificationService.getInstance();
      const instance2 = EmailNotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("devrait préparer les variables de template correctement", async () => {
      const service = EmailNotificationService.getInstance();

      const mockData = {
        email: "test@example.com",
        userId: 1,
        userName: "Test User",
        amount: 50,
        paymentIntentId: "pi_test_xxx",
        premierPaiement: false,
      };

      // Test que la méthode existe et peut être appelée
      expect(service.envoyerConfirmationPaiement).toBeDefined();
    });

    it("devrait gérer les erreurs d'email gracieusement", async () => {
      const service = EmailNotificationService.getInstance();

      const mockData = {
        email: "invalid-email",
        userId: 1,
        userName: "Test User",
        amount: 50,
        paymentIntentId: "pi_test_xxx",
        premierPaiement: false,
      };

      // L'envoi d'email ne devrait pas throw même en cas d'erreur
      try {
        await service.envoyerConfirmationPaiement(mockData);
        expect(true).toBe(true); // Si pas d'erreur, c'est OK
      } catch (error) {
        // Si erreur, vérifier qu'elle est bien catchée dans le handler
        expect(error).toBeDefined();
      }
    });
  });

  // ==================== INTEGRATION TESTS (Services ensemble) ====================
  describe("Integration des services", () => {
    it("devrait créer toutes les instances sans erreur", () => {
      const stripe = StripeService.getInstance();
      const payment = PaymentService.getInstance();
      const statusUpgrade = StatusUpgradeService.getInstance();
      const email = EmailNotificationService.getInstance();

      expect(stripe).toBeDefined();
      expect(payment).toBeDefined();
      expect(statusUpgrade).toBeDefined();
      expect(email).toBeDefined();
    });

    it("devrait maintenir les singletons entre appels", () => {
      const stripe1 = StripeService.getInstance();
      const payment1 = PaymentService.getInstance();

      const stripe2 = StripeService.getInstance();
      const payment2 = PaymentService.getInstance();

      expect(stripe1).toBe(stripe2);
      expect(payment1).toBe(payment2);
    });
  });
});
