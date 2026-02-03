/**
 * Tests de schéma et configuration pour le module Paiements
 * Tests des types, interfaces et configuration du module
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPaymentIntentEcheanceSchema,
  createPaymentIntentCommandeSchema,
  confirmEcheancePaymentSchema,
  confirmCommandePaymentSchema,
  getHistoriqueSchema,
  CreatePaymentIntentEcheanceData,
  CreatePaymentIntentCommandeData,
  ConfirmEcheancePaymentData,
  ConfirmCommandePaymentData,
  GetHistoriqueData,
} from "../core/validators/paiement.schema.js";

describe("Paiements Module - Schémas et Configuration", () => {
  describe("Schémas Zod - Structure", () => {
    it("createPaymentIntentEcheanceSchema devrait avoir tous les champs requis", () => {
      const schema = createPaymentIntentEcheanceSchema;

      expect(schema).toBeDefined();
      expect(schema.safeParse).toBeDefined();

      // Vérifier que le schéma attend les bons champs
      const validData = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
        description: "Test",
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("createPaymentIntentCommandeSchema devrait accepter commande numérique ou objet", () => {
      const schema = createPaymentIntentCommandeSchema;

      const validData1 = {
        amount: 45.0,
        commande: 5,
        userId: 2,
      };

      const validData2 = {
        amount: 45.0,
        commande: { id: 5, articles: [] },
        userId: 2,
      };

      expect(schema.safeParse(validData1).success).toBe(true);
      expect(schema.safeParse(validData2).success).toBe(true);
    });

    it("confirmEcheancePaymentSchema devrait valider le format Payment Intent", () => {
      const schema = confirmEcheancePaymentSchema;

      const validData = {
        paymentIntentId: "pi_1234567890abcdef",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("getHistoriqueSchema devrait avoir des valeurs par défaut", () => {
      const schema = getHistoriqueSchema;

      const minimalData = {};

      const result = schema.safeParse(minimalData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
      }
    });
  });

  describe("Types TypeScript - Inférence", () => {
    it("CreatePaymentIntentEcheanceData devrait avoir les bons types", () => {
      const data: CreatePaymentIntentEcheanceData = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
        description: "Test",
      };

      expect(typeof data.amount).toBe("number");
      expect(typeof data.echeanceId).toBe("number");
      expect(typeof data.userId).toBe("number");
      expect(typeof data.currency).toBe("string");
      expect(typeof data.description).toBe("string");
    });

    it("CreatePaymentIntentCommandeData devrait accepter plusieurs types de commande", () => {
      const data1: CreatePaymentIntentCommandeData = {
        amount: 45.0,
        commande: 5,
      };

      const data2: CreatePaymentIntentCommandeData = {
        amount: 45.0,
        commande: { id: 5, articles: [] },
        userId: 2,
      };

      expect(typeof data1.commande).toBe("number");
      expect(typeof data2.commande).toBe("object");
    });

    it("ConfirmEcheancePaymentData devrait avoir les bons types", () => {
      const data: ConfirmEcheancePaymentData = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(typeof data.paymentIntentId).toBe("string");
      expect(typeof data.echeanceId).toBe("number");
      expect(typeof data.userId).toBe("number");
      expect(typeof data.amount).toBe("number");
    });

    it("ConfirmCommandePaymentData devrait avoir les bons types", () => {
      const data: ConfirmCommandePaymentData = {
        paymentIntentId: "pi_1234567890",
        commandeId: 5,
        userId: 2,
        amount: 4500,
      };

      expect(typeof data.paymentIntentId).toBe("string");
      expect(typeof data.commandeId).toBe("number");
      expect(typeof data.userId).toBe("number");
      expect(typeof data.amount).toBe("number");
    });

    it("GetHistoriqueData devrait avoir les bons types", () => {
      const data: GetHistoriqueData = {
        utilisateurId: 5,
        limit: 20,
        offset: 10,
      };

      expect(typeof data.limit).toBe("number");
      expect(typeof data.offset).toBe("number");
      if (data.utilisateurId) {
        expect(typeof data.utilisateurId).toBe("number");
      }
    });
  });

  describe("Valeurs par défaut", () => {
    it("currency devrait être 'eur' par défaut", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.parse(data);
      expect(result.currency).toBe("eur");
    });

    it("description devrait avoir une valeur par défaut pour échéance", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.parse(data);
      expect(result.description).toBe("Paiement échéance");
    });

    it("description devrait avoir une valeur par défaut pour commande", () => {
      const data = {
        amount: 45.0,
        commande: 5,
      };

      const result = createPaymentIntentCommandeSchema.parse(data);
      expect(result.description).toBe("Paiement commande");
    });

    it("limit devrait être 10 par défaut dans getHistoriqueSchema", () => {
      const result = getHistoriqueSchema.parse({});
      expect(result.limit).toBe(10);
    });

    it("offset devrait être 0 par défaut dans getHistoriqueSchema", () => {
      const result = getHistoriqueSchema.parse({});
      expect(result.offset).toBe(0);
    });
  });

  describe("Limites et contraintes", () => {
    it("amount devrait avoir un minimum de 0.50", () => {
      const invalidData = {
        amount: 0.49,
        echeanceId: 1,
        userId: 1,
      };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData),
      ).toThrow();
    });

    it("amount devrait avoir un maximum de 999,999", () => {
      const invalidData = {
        amount: 1000000,
        echeanceId: 1,
        userId: 1,
      };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData),
      ).toThrow();
    });

    it("limit devrait avoir un maximum de 100", () => {
      const invalidData = {
        limit: 101,
      };

      expect(() => getHistoriqueSchema.parse(invalidData)).toThrow();
    });

    it("offset ne peut pas être négatif", () => {
      const invalidData = {
        offset: -1,
      };

      expect(() => getHistoriqueSchema.parse(invalidData)).toThrow();
    });

    it("echeanceId doit être un entier positif", () => {
      const invalidData1 = {
        amount: 25.5,
        echeanceId: 1.5,
        userId: 1,
      };

      const invalidData2 = {
        amount: 25.5,
        echeanceId: -1,
        userId: 1,
      };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData1),
      ).toThrow();
      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData2),
      ).toThrow();
    });

    it("userId doit être un entier positif", () => {
      const invalidData1 = {
        amount: 25.5,
        echeanceId: 1,
        userId: 0,
      };

      const invalidData2 = {
        amount: 25.5,
        echeanceId: 1,
        userId: -5,
      };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData1),
      ).toThrow();
      expect(() =>
        createPaymentIntentEcheanceSchema.parse(invalidData2),
      ).toThrow();
    });
  });

  describe("Devises supportées", () => {
    it("devrait accepter EUR", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait accepter USD", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "usd",
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait accepter GBP", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "gbp",
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait accepter CHF", () => {
      const data = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "chf",
      };

      expect(() => createPaymentIntentEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter des devises non supportées", () => {
      const invalidCurrencies = ["jpy", "cad", "aud", "xyz", "btc"];

      invalidCurrencies.forEach((currency) => {
        const data = {
          amount: 25.5,
          echeanceId: 1,
          userId: 1,
          currency,
        };

        expect(() => createPaymentIntentEcheanceSchema.parse(data)).toThrow();
      });
    });
  });

  describe("Format Payment Intent ID", () => {
    it("devrait accepter un Payment Intent ID valide", () => {
      const validIds = [
        "pi_1234567890",
        "pi_1ABCdefGHI234jklMNO567pqrSTU890vwx",
        "pi_test_1234567890",
      ];

      validIds.forEach((id) => {
        const data = {
          paymentIntentId: id,
          echeanceId: 1,
          userId: 1,
          amount: 2550,
        };

        expect(() => confirmEcheancePaymentSchema.parse(data)).not.toThrow();
      });
    });

    it("devrait rejeter un ID ne commençant pas par 'pi_'", () => {
      const invalidIds = [
        "ch_1234567890",
        "py_1234567890",
        "1234567890",
        "payment_intent_123",
      ];

      invalidIds.forEach((id) => {
        const data = {
          paymentIntentId: id,
          echeanceId: 1,
          userId: 1,
          amount: 2550,
        };

        expect(() => confirmEcheancePaymentSchema.parse(data)).toThrow();
      });
    });

    it("devrait rejeter un ID trop court", () => {
      const data = {
        paymentIntentId: "pi_123",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      expect(() => confirmEcheancePaymentSchema.parse(data)).toThrow();
    });
  });

  describe("Champs optionnels vs requis", () => {
    it("amount, echeanceId, userId sont requis pour échéance", () => {
      const missingAmount = { echeanceId: 1, userId: 1 };
      const missingEcheanceId = { amount: 25.5, userId: 1 };
      const missingUserId = { amount: 25.5, echeanceId: 1 };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(missingAmount),
      ).toThrow();
      expect(() =>
        createPaymentIntentEcheanceSchema.parse(missingEcheanceId),
      ).toThrow();
      expect(() =>
        createPaymentIntentEcheanceSchema.parse(missingUserId),
      ).toThrow();
    });

    it("currency et description sont optionnels", () => {
      const minimalData = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.parse(minimalData);
      expect(result.currency).toBeDefined();
      expect(result.description).toBeDefined();
    });

    it("userId est optionnel pour commande", () => {
      const withoutUserId = {
        amount: 45.0,
        commande: 5,
      };

      expect(() =>
        createPaymentIntentCommandeSchema.parse(withoutUserId),
      ).not.toThrow();
    });

    it("utilisateurId est optionnel dans getHistoriqueSchema", () => {
      const withoutUserId = {
        limit: 10,
        offset: 0,
      };

      expect(() => getHistoriqueSchema.parse(withoutUserId)).not.toThrow();
    });
  });

  describe("Transformation des données", () => {
    it("devrait appliquer les valeurs par défaut correctement", () => {
      const input = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const result = createPaymentIntentEcheanceSchema.parse(input);

      expect(result).toEqual({
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
        description: "Paiement échéance",
      });
    });

    it("ne devrait pas écraser les valeurs fournies", () => {
      const input = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "usd",
        description: "Ma description personnalisée",
      };

      const result = createPaymentIntentEcheanceSchema.parse(input);

      expect(result.currency).toBe("usd");
      expect(result.description).toBe("Ma description personnalisée");
    });
  });

  describe("Messages d'erreur", () => {
    it("devrait fournir un message clair pour montant manquant", () => {
      try {
        createPaymentIntentEcheanceSchema.parse({
          echeanceId: 1,
          userId: 1,
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("montant");
      }
    });

    it("devrait fournir un message clair pour montant négatif", () => {
      try {
        createPaymentIntentEcheanceSchema.parse({
          amount: -10,
          echeanceId: 1,
          userId: 1,
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("positif");
      }
    });

    it("devrait fournir un message clair pour devise invalide", () => {
      try {
        createPaymentIntentEcheanceSchema.parse({
          amount: 25.5,
          echeanceId: 1,
          userId: 1,
          currency: "xyz",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("Devise");
      }
    });

    it("devrait fournir un message clair pour Payment Intent ID invalide", () => {
      try {
        confirmEcheancePaymentSchema.parse({
          paymentIntentId: "invalid",
          echeanceId: 1,
          userId: 1,
          amount: 2550,
        });
        fail("Should have thrown");
      } catch (error: any) {
        // Le message peut être soit sur la longueur, soit sur le format
        const message = error.errors[0].message;
        expect(message.includes("pi_") || message.includes("trop court")).toBe(
          true,
        );
      }
    });
  });

  describe("Compatibilité et rétrocompatibilité", () => {
    it("devrait accepter les anciens formats de données valides", () => {
      const oldFormat = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
      };

      expect(() =>
        createPaymentIntentEcheanceSchema.parse(oldFormat),
      ).not.toThrow();
    });

    it("devrait rejeter les champs supplémentaires non définis", () => {
      const dataWithExtra = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        extraField: "should be ignored or rejected",
      };

      // Zod par défaut ignore les champs supplémentaires (strip)
      const result = createPaymentIntentEcheanceSchema.parse(dataWithExtra);
      expect((result as any).extraField).toBeUndefined();
    });
  });
});
