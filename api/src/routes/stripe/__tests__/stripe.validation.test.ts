/**
 * Tests de validation Zod pour le module Stripe
 * Teste tous les schémas de validation avec cas valides et invalides
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPaymentIntentEcheanceSchema,
  createPaymentIntentCommandeSchema,
  confirmPaymentEcheanceSchema,
  confirmPaymentCommandeSchema,
  alternativePaymentSchema,
  toStripeAmount,
  fromStripeAmount,
  isValidPaymentIntentId,
} from "@clubmanager/types/validators";

describe("Stripe Validation - Tests des schémas Zod", () => {
  // ==================== CREATE PAYMENT INTENT ECHEANCE ====================
  describe("createPaymentIntentEcheanceSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
        description: "Paiement échéance",
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter une description optionnelle", () => {
      const validData = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant négatif", () => {
      const invalidData = {
        amount: -10,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant trop petit (< 0.5)", () => {
      const invalidData = {
        amount: 0.1,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant trop grand (> 999999)", () => {
      const invalidData = {
        amount: 1000000,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un echeanceId non entier", () => {
      const invalidData = {
        amount: 50,
        echeanceId: 1.5,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId négatif", () => {
      const invalidData = {
        amount: 50,
        echeanceId: 1,
        userId: -1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des données manquantes", () => {
      const invalidData = {
        amount: 50,
        // echeanceId manquant
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== CREATE PAYMENT INTENT COMMANDE ====================
  describe("createPaymentIntentCommandeSchema", () => {
    it("devrait valider des données correctes avec commande existante", () => {
      const validData = {
        amount: 100,
        commande: {
          id: 1,
          articles: [{ id: 1, quantite: 2 }],
        },
        userId: 1,
      };

      const result = createPaymentIntentCommandeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider des données correctes avec nouvelle commande", () => {
      const validData = {
        amount: 100,
        commande: {
          articles: [{ id: 1, quantite: 2 }],
          adresse_livraison: "123 Rue Test",
        },
        userId: 1,
      };

      const result = createPaymentIntentCommandeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si commande n'est pas un objet", () => {
      const invalidData = {
        amount: 100,
        commande: "invalid",
        userId: 1,
      };

      const result = createPaymentIntentCommandeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== CONFIRM PAYMENT ECHEANCE ====================
  describe("confirmPaymentEcheanceSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        paymentIntentId: "pi_test_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      const result = confirmPaymentEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un paymentIntentId trop court", () => {
      const invalidData = {
        paymentIntentId: "pi_short",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      const result = confirmPaymentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un paymentIntentId sans préfixe pi_", () => {
      const invalidData = {
        paymentIntentId: "invalid_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      const result = confirmPaymentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant négatif", () => {
      const invalidData = {
        paymentIntentId: "pi_test_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: -50,
      };

      const result = confirmPaymentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== CONFIRM PAYMENT COMMANDE ====================
  describe("confirmPaymentCommandeSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        paymentIntentId: "pi_test_1234567890",
        commandeId: 1,
        userId: 1,
        amount: 100,
      };

      const result = confirmPaymentCommandeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un commandeId invalide", () => {
      const invalidData = {
        paymentIntentId: "pi_test_1234567890",
        commandeId: 0,
        userId: 1,
        amount: 100,
      };

      const result = confirmPaymentCommandeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== ALTERNATIVE PAYMENT ====================
  describe("alternativePaymentSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        amount: 100,
        commande: {
          articles: [{ id: 1, quantite: 1 }],
        },
        userId: 1,
      };

      const result = alternativePaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant invalide", () => {
      const invalidData = {
        amount: 0,
        commande: {},
        userId: 1,
      };

      const result = alternativePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== HELPER FUNCTIONS ====================
  describe("Helper Functions", () => {
    describe("toStripeAmount", () => {
      it("devrait convertir EUR en centimes", () => {
        expect(toStripeAmount(50)).toBe(5000);
        expect(toStripeAmount(10.5)).toBe(1050);
        expect(toStripeAmount(100)).toBe(10000);
      });

      it("devrait arrondir correctement", () => {
        expect(toStripeAmount(10.555)).toBe(1056);
        expect(toStripeAmount(10.554)).toBe(1055);
      });

      it("devrait gérer zéro", () => {
        expect(toStripeAmount(0)).toBe(0);
      });
    });

    describe("fromStripeAmount", () => {
      it("devrait convertir centimes en EUR", () => {
        expect(fromStripeAmount(5000)).toBe(50);
        expect(fromStripeAmount(1050)).toBe(10.5);
        expect(fromStripeAmount(10000)).toBe(100);
      });

      it("devrait gérer zéro", () => {
        expect(fromStripeAmount(0)).toBe(0);
      });

      it("devrait gérer les nombres décimaux", () => {
        expect(fromStripeAmount(1055)).toBe(10.55);
      });
    });

    describe("isValidPaymentIntentId", () => {
      it("devrait valider un ID correct", () => {
        expect(isValidPaymentIntentId("pi_test_1234567890")).toBe(true);
        expect(isValidPaymentIntentId("pi_1234567890abcdef")).toBe(true);
      });

      it("devrait rejeter un ID trop court", () => {
        expect(isValidPaymentIntentId("pi_short")).toBe(false);
      });

      it("devrait rejeter un ID sans préfixe pi_", () => {
        expect(isValidPaymentIntentId("invalid_1234567890")).toBe(false);
      });

      it("devrait rejeter une chaîne vide", () => {
        expect(isValidPaymentIntentId("")).toBe(false);
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge Cases", () => {
    it("devrait rejeter des valeurs null", () => {
      const invalidData = {
        amount: null,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des valeurs undefined", () => {
      const invalidData = {
        amount: undefined,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des strings pour des nombres", () => {
      const invalidData = {
        amount: "50",
        echeanceId: "1",
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait gérer NaN", () => {
      const invalidData = {
        amount: NaN,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait gérer Infinity", () => {
      const invalidData = {
        amount: Infinity,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== BOUNDARY TESTS ====================
  describe("Boundary Tests", () => {
    it("devrait accepter le montant minimum valide (0.5)", () => {
      const validData = {
        amount: 0.5,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter le montant maximum valide (999999)", () => {
      const validData = {
        amount: 999999,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant juste en dessous du minimum", () => {
      const invalidData = {
        amount: 0.49,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant juste au-dessus du maximum", () => {
      const invalidData = {
        amount: 1000000,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
