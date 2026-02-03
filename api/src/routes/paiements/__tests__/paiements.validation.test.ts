/**
 * Tests de validation pour le module Paiements
 * Tests des schémas Zod et validation des données
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPaymentIntentEcheanceSchema,
  createPaymentIntentCommandeSchema,
  confirmEcheancePaymentSchema,
  confirmCommandePaymentSchema,
} from "../core/validators/paiement.schema.js";
import { z } from "zod";

describe("Paiements Validation - Schémas Zod", () => {
  describe("createPaymentIntentEcheanceSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
        description: "Paiement échéance",
      };

      const result = createPaymentIntentEcheanceSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("devrait accepter les valeurs par défaut", () => {
      const minimalData = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.parse(minimalData);

      expect(result.currency).toBe("eur");
      expect(result.description).toBe("Paiement échéance");
    });

    it("devrait rejeter un montant manquant", () => {
      const invalidData = {
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        z.ZodError
      );
    });

    it("devrait rejeter un montant négatif", () => {
      const invalidData = {
        amount: -10,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        "Le montant doit être positif"
      );
    });

    it("devrait rejeter un montant inférieur à 0.50€", () => {
      const invalidData = {
        amount: 0.25,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        "Le montant minimum est 0.50€"
      );
    });

    it("devrait rejeter un montant supérieur à 999,999€", () => {
      const invalidData = {
        amount: 1000000,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        "Le montant maximum est 999,999€"
      );
    });

    it("devrait accepter les montants limites valides", () => {
      const dataMin = {
        amount: 0.50,
        echeanceId: 1,
        userId: 1,
      };

      const dataMax = {
        amount: 999999,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(dataMin)).not.toThrow();
      expect(() => createPaymentIntentEcheanceSchema.parse(dataMax)).not.toThrow();
    });

    it("devrait rejeter un echeanceId manquant", () => {
      const invalidData = {
        amount: 25.50,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un echeanceId non entier", () => {
      const invalidData = {
        amount: 25.50,
        echeanceId: 1.5,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un echeanceId négatif", () => {
      const invalidData = {
        amount: 25.50,
        echeanceId: -1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un userId manquant", () => {
      const invalidData = {
        amount: 25.50,
        echeanceId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait accepter les devises supportées", () => {
      const devises = ["eur", "usd", "gbp", "chf"];

      devises.forEach((currency) => {
        const data = {
          amount: 25.50,
          echeanceId: 1,
          userId: 1,
          currency,
        };

        expect(() => createPaymentIntentEcheanceSchema.parse(data)).not.toThrow();
      });
    });

    it("devrait rejeter une devise non supportée", () => {
      const invalidData = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
        currency: "jpy",
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        "Devise non supportée"
      );
    });
  });

  describe("createPaymentIntentCommandeSchema", () => {
    it("devrait valider une commande avec ID numérique", () => {
      const validData = {
        amount: 45.00,
        commande: 5,
        userId: 2,
      };

      const result = createPaymentIntentCommandeSchema.parse(validData);

      expect(result.commande).toBe(5);
    });

    it("devrait valider une commande avec objet", () => {
      const validData = {
        amount: 45.00,
        commande: {
          id: 5,
          articles: [{ id: 1, quantite: 2 }],
        },
        userId: 2,
      };

      const result = createPaymentIntentCommandeSchema.parse(validData);

      expect(result.commande).toEqual({
        id: 5,
        articles: [{ id: 1, quantite: 2 }],
      });
    });

    it("devrait rejeter une commande manquante", () => {
      const invalidData = {
        amount: 45.00,
        userId: 2,
      };

      expect(() => createPaymentIntentCommandeSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter une commande null", () => {
      const invalidData = {
        amount: 45.00,
        commande: null,
        userId: 2,
      };

      expect(() => createPaymentIntentCommandeSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un ID de commande négatif", () => {
      const invalidData = {
        amount: 45.00,
        commande: -5,
        userId: 2,
      };

      expect(() => createPaymentIntentCommandeSchema.parse(invalidData)).toThrow();
    });

    it("devrait accepter userId optionnel", () => {
      const validData = {
        amount: 45.00,
        commande: 5,
      };

      const result = createPaymentIntentCommandeSchema.parse(validData);

      expect(result.userId).toBeUndefined();
    });
  });

  describe("confirmEcheancePaymentSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        paymentIntentId: "pi_1234567890abcdef",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      const result = confirmEcheancePaymentSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("devrait rejeter un paymentIntentId ne commençant pas par 'pi_'", () => {
      const invalidData = {
        paymentIntentId: "ch_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow(
        "L'ID du Payment Intent doit commencer par 'pi_'"
      );
    });

    it("devrait rejeter un paymentIntentId trop court", () => {
      const invalidData = {
        paymentIntentId: "pi_123",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow(
        "L'ID du Payment Intent est trop court"
      );
    });

    it("devrait rejeter un paymentIntentId manquant", () => {
      const invalidData = {
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un echeanceId manquant", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un userId manquant", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un amount manquant", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        userId: 1,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un amount négatif", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: -100,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un amount de zéro", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 0,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });
  });

  describe("confirmCommandePaymentSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        paymentIntentId: "pi_1234567890abcdef",
        commandeId: 5,
        userId: 2,
        amount: 4500,
      };

      const result = confirmCommandePaymentSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("devrait rejeter un paymentIntentId invalide", () => {
      const invalidData = {
        paymentIntentId: "invalid_id",
        commandeId: 5,
        userId: 2,
        amount: 4500,
      };

      expect(() => confirmCommandePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un commandeId manquant", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        userId: 2,
        amount: 4500,
      };

      expect(() => confirmCommandePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un commandeId non entier", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        commandeId: 5.5,
        userId: 2,
        amount: 4500,
      };

      expect(() => confirmCommandePaymentSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un commandeId négatif", () => {
      const invalidData = {
        paymentIntentId: "pi_1234567890",
        commandeId: -5,
        userId: 2,
        amount: 4500,
      };

      expect(() => confirmCommandePaymentSchema.parse(invalidData)).toThrow();
    });
  });

  describe("Types de données", () => {
    it("devrait rejeter un montant de type string", () => {
      const invalidData = {
        amount: "25.50",
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow(
        "Le montant doit être un nombre"
      );
    });

    it("devrait rejeter un echeanceId de type string", () => {
      const invalidData = {
        amount: 25.50,
        echeanceId: "1",
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter un paymentIntentId de type number", () => {
      const invalidData = {
        paymentIntentId: 123456,
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(invalidData)).toThrow();
    });
  });

  describe("Champs optionnels", () => {
    it("devrait accepter description optionnelle", () => {
      const data1 = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
      };

      const data2 = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
        description: "Ma description",
      };

      const result1 = createPaymentIntentEcheanceSchema.parse(data1);
      const result2 = createPaymentIntentEcheanceSchema.parse(data2);

      expect(result1.description).toBe("Paiement échéance");
      expect(result2.description).toBe("Ma description");
    });

    it("devrait accepter currency optionnelle", () => {
      const data1 = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
      };

      const data2 = {
        amount: 25.50,
        echeanceId: 1,
        userId: 1,
        currency: "usd",
      };

      const result1 = createPaymentIntentEcheanceSchema.parse(data1);
      const result2 = createPaymentIntentEcheanceSchema.parse(data2);

      expect(result1.currency).toBe("eur");
      expect(result2.currency).toBe("usd");
    });
  });

  describe("Cas limites", () => {
    it("devrait accepter le montant minimum valide (0.50€)", () => {
      const validData = {
        amount: 0.50,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(validData)).not.toThrow();
    });

    it("devrait accepter le montant maximum valide (999,999€)", () => {
      const validData = {
        amount: 999999,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(validData)).not.toThrow();
    });

    it("devrait rejeter 0.49€ (juste en dessous du minimum)", () => {
      const invalidData = {
        amount: 0.49,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait rejeter 1,000,000€ (juste au-dessus du maximum)", () => {
      const invalidData = {
        amount: 1000000,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("devrait accepter des montants avec décimales", () => {
      const validData = {
        amount: 123.45,
        echeanceId: 1,
        userId: 1,
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(validData)).not.toThrow();
    });
  });
});
