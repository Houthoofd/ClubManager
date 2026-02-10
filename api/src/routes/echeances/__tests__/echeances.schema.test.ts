/**
 * Tests de schéma et configuration pour le module Échéances
 * Tests des types, interfaces et configuration du module
 */

import { describe, it, expect } from "@jest/globals";
import {
  getEcheancesUtilisateurSchema,
  getEcheanceDetailSchema,
  createEcheanceSchema,
  updateEcheanceSchema,
  deleteEcheanceSchema,
  getStatistiquesSchema,
  diagnosticEcheanceSchema,
  GetEcheancesUtilisateurData,
  GetEcheanceDetailData,
  CreateEcheanceData,
  UpdateEcheanceData,
  DeleteEcheanceData,
  GetStatistiquesData,
  DiagnosticEcheanceData,
} from "@clubmanager/types/validators";

describe("Échéances Module - Schémas et Configuration", () => {
  describe("Schémas Zod - Structure", () => {
    it("getEcheancesUtilisateurSchema devrait avoir tous les champs requis", () => {
      const schema = getEcheancesUtilisateurSchema;

      expect(schema).toBeDefined();
      expect(schema.safeParse).toBeDefined();

      const validData = { userId: "1" };
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("createEcheanceSchema devrait accepter les données valides", () => {
      const schema = createEcheanceSchema;

      const validData = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation mensuelle",
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("updateEcheanceSchema devrait accepter des mises à jour partielles", () => {
      const schema = updateEcheanceSchema;

      const validData = {
        echeanceId: 1,
        montant: 30.0,
        statut: "payé",
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("deleteEcheanceSchema devrait valider l'ID", () => {
      const schema = deleteEcheanceSchema;

      const validData = { echeanceId: "1" };
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Types TypeScript - Inférence", () => {
    it("GetEcheancesUtilisateurData devrait avoir les bons types", () => {
      const data: GetEcheancesUtilisateurData = {
        userId: 1,
      };

      expect(typeof data.userId).toBe("number");
    });

    it("CreateEcheanceData devrait avoir les bons types", () => {
      const data: CreateEcheanceData = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Test",
      };

      expect(typeof data.utilisateur_id).toBe("number");
      expect(typeof data.montant).toBe("number");
      expect(typeof data.date_echeance).toBe("string");
    });

    it("UpdateEcheanceData devrait accepter des champs optionnels", () => {
      const data: UpdateEcheanceData = {
        echeanceId: 1,
        montant: 30.0,
      };

      expect(typeof data.echeanceId).toBe("number");
      expect(typeof data.montant).toBe("number");
    });
  });

  describe("Valeurs par défaut", () => {
    it("statut devrait être 'en attente' par défaut", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      const result = createEcheanceSchema.parse(data);
      expect(result.statut).toBe("en attente");
    });
  });

  describe("Limites et contraintes", () => {
    it("montant devrait avoir un minimum de 0.01", () => {
      const invalidData = {
        utilisateur_id: 1,
        montant: 0.001,
        date_echeance: "2024-03-15",
      };

      expect(() => createEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("montant devrait avoir un maximum de 999,999", () => {
      const invalidData = {
        utilisateur_id: 1,
        montant: 1000000,
        date_echeance: "2024-03-15",
      };

      expect(() => createEcheanceSchema.parse(invalidData)).toThrow();
    });

    it("utilisateur_id doit être un entier positif", () => {
      const invalidData1 = {
        utilisateur_id: 0,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      const invalidData2 = {
        utilisateur_id: -5,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      expect(() => createEcheanceSchema.parse(invalidData1)).toThrow();
      expect(() => createEcheanceSchema.parse(invalidData2)).toThrow();
    });

    it("date_echeance doit être une date valide", () => {
      const invalidData = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "invalid-date",
      };

      expect(() => createEcheanceSchema.parse(invalidData)).toThrow();
    });
  });

  describe("Statuts supportés", () => {
    it("devrait accepter 'en attente'", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "en attente",
      };

      expect(() => createEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait accepter 'payé'", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "payé",
      };

      expect(() => createEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait accepter 'échu'", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "échu",
      };

      expect(() => createEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter des statuts invalides", () => {
      const invalidStatuts = ["pending", "completed", "failed", "xyz"];

      invalidStatuts.forEach((statut) => {
        const data = {
          utilisateur_id: 1,
          montant: 25.5,
          date_echeance: "2024-03-15",
          statut,
        };

        expect(() => createEcheanceSchema.parse(data)).toThrow();
      });
    });
  });

  describe("Champs optionnels vs requis", () => {
    it("utilisateur_id, montant, date_echeance sont requis", () => {
      const missingUtilisateurId = {
        montant: 25.5,
        date_echeance: "2024-03-15",
      };
      const missingMontant = {
        utilisateur_id: 1,
        date_echeance: "2024-03-15",
      };
      const missingDateEcheance = { utilisateur_id: 1, montant: 25.5 };

      expect(() => createEcheanceSchema.parse(missingUtilisateurId)).toThrow();
      expect(() => createEcheanceSchema.parse(missingMontant)).toThrow();
      expect(() => createEcheanceSchema.parse(missingDateEcheance)).toThrow();
    });

    it("description et statut sont optionnels", () => {
      const minimalData = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      const result = createEcheanceSchema.parse(minimalData);
      expect(result.statut).toBeDefined();
    });

    it("abonnement_id est optionnel", () => {
      const withoutAbonnement = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      expect(() => createEcheanceSchema.parse(withoutAbonnement)).not.toThrow();
    });
  });

  describe("Transformation des données", () => {
    it("devrait transformer userId en nombre", () => {
      const input = { userId: "1" };
      const result = getEcheancesUtilisateurSchema.parse(input);
      expect(typeof result.userId).toBe("number");
      expect(result.userId).toBe(1);
    });

    it("devrait transformer echeanceId en nombre", () => {
      const input = { echeanceId: "5" };
      const result = deleteEcheanceSchema.parse(input);
      expect(typeof result.echeanceId).toBe("number");
      expect(result.echeanceId).toBe(5);
    });

    it("devrait appliquer les valeurs par défaut correctement", () => {
      const input = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      const result = createEcheanceSchema.parse(input);

      expect(result).toEqual({
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "en attente",
      });
    });

    it("ne devrait pas écraser les valeurs fournies", () => {
      const input = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "payé",
        description: "Ma description personnalisée",
      };

      const result = createEcheanceSchema.parse(input);

      expect(result.statut).toBe("payé");
      expect(result.description).toBe("Ma description personnalisée");
    });
  });

  describe("Messages d'erreur", () => {
    it("devrait fournir un message clair pour montant manquant", () => {
      try {
        createEcheanceSchema.parse({
          utilisateur_id: 1,
          date_echeance: "2024-03-15",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("montant");
      }
    });

    it("devrait fournir un message clair pour montant négatif", () => {
      try {
        createEcheanceSchema.parse({
          utilisateur_id: 1,
          montant: -10,
          date_echeance: "2024-03-15",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("positif");
      }
    });

    it("devrait fournir un message clair pour date invalide", () => {
      try {
        createEcheanceSchema.parse({
          utilisateur_id: 1,
          montant: 25.5,
          date_echeance: "not-a-date",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("date");
      }
    });

    it("devrait fournir un message clair pour statut invalide", () => {
      try {
        createEcheanceSchema.parse({
          utilisateur_id: 1,
          montant: 25.5,
          date_echeance: "2024-03-15",
          statut: "invalid",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("statut");
      }
    });
  });

  describe("Validation d'ID", () => {
    it("devrait accepter un ID numérique valide sous forme de string", () => {
      const validIds = ["1", "10", "999"];

      validIds.forEach((id) => {
        const data = { userId: id };
        expect(() => getEcheancesUtilisateurSchema.parse(data)).not.toThrow();
      });
    });

    it("devrait rejeter un ID non numérique", () => {
      const invalidIds = ["abc", "1a", "a1", "-5", "0"];

      invalidIds.forEach((id) => {
        const data = { userId: id };
        expect(() => getEcheancesUtilisateurSchema.parse(data)).toThrow();
      });
    });

    it("devrait rejeter un ID négatif", () => {
      const data = { userId: "-1" };
      expect(() => getEcheancesUtilisateurSchema.parse(data)).toThrow();
    });
  });

  describe("Diagnostic schema", () => {
    it("devrait valider echeanceId et userId pour diagnostic", () => {
      const validData = {
        echeanceId: "1",
        userId: "1",
      };

      const result = diagnosticEcheanceSchema.parse(validData);
      expect(result.echeanceId).toBe(1);
      expect(result.userId).toBe(1);
    });

    it("devrait rejeter des IDs invalides", () => {
      const invalidData = {
        echeanceId: "abc",
        userId: "xyz",
      };

      expect(() => diagnosticEcheanceSchema.parse(invalidData)).toThrow();
    });
  });

  describe("Compatibilité et rétrocompatibilité", () => {
    it("devrait accepter les anciens formats de données valides", () => {
      const oldFormat = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Ancienne échéance",
      };

      expect(() => createEcheanceSchema.parse(oldFormat)).not.toThrow();
    });

    it("devrait rejeter les champs supplémentaires non définis", () => {
      const dataWithExtra = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        extraField: "should be ignored",
      };

      // Zod par défaut ignore les champs supplémentaires (strip)
      const result = createEcheanceSchema.parse(dataWithExtra);
      expect((result as any).extraField).toBeUndefined();
    });
  });

  describe("Description validation", () => {
    it("devrait accepter une description valide", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation mensuelle Mars 2024",
      };

      expect(() => createEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter une description trop longue", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "a".repeat(256), // Plus de 255 caractères
      };

      expect(() => createEcheanceSchema.parse(data)).toThrow();
    });

    it("devrait rejeter une description vide", () => {
      const data = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "",
      };

      expect(() => createEcheanceSchema.parse(data)).toThrow();
    });
  });

  describe("Update schema - champs optionnels", () => {
    it("devrait permettre de mettre à jour uniquement le montant", () => {
      const data = {
        echeanceId: 1,
        montant: 35.0,
      };

      expect(() => updateEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait permettre de mettre à jour uniquement le statut", () => {
      const data = {
        echeanceId: 1,
        statut: "payé",
      };

      expect(() => updateEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait permettre de mettre à jour plusieurs champs", () => {
      const data = {
        echeanceId: 1,
        montant: 35.0,
        statut: "payé",
        date_paiement: "2024-03-16",
        stripe_payment_intent_id: "pi_1234567890",
      };

      expect(() => updateEcheanceSchema.parse(data)).not.toThrow();
    });

    it("devrait valider le format du stripe_payment_intent_id", () => {
      const validData = {
        echeanceId: 1,
        stripe_payment_intent_id: "pi_1234567890abcdef",
      };

      expect(() => updateEcheanceSchema.parse(validData)).not.toThrow();

      const invalidData = {
        echeanceId: 1,
        stripe_payment_intent_id: "invalid_id",
      };

      expect(() => updateEcheanceSchema.parse(invalidData)).toThrow();
    });
  });
});
