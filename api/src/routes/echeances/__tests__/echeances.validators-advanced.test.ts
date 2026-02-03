/**
 * Tests avancés pour les validators du module Échéances
 * Ces tests ciblent les branches non couvertes pour améliorer le branch coverage
 */

import { describe, it, expect } from "@jest/globals";
import {
  createEcheanceSchema,
  updateEcheanceSchema,
  getEcheancesUtilisateurSchema,
  getEcheanceDetailSchema,
  deleteEcheanceSchema,
  getStatistiquesSchema,
  diagnosticEcheanceSchema,
} from "../core/validators/echeance.schema.js";

describe("Validators - Tests avancés de branch coverage", () => {
  describe("getEcheancesUtilisateurSchema - Tests de toutes les branches", () => {
    it("devrait accepter un userId valide comme string", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(123);
      }
    });

    it("devrait accepter '1' comme userId minimum valide", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
      }
    });

    it("devrait rejeter userId = '0'", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId négatif", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId non numérique", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: "abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId avec des lettres mélangées", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({
        userId: "123abc",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: null });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({
        userId: undefined,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre au lieu d'une string", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({ userId: 123 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("getEcheanceDetailSchema - Tests de toutes les branches", () => {
    it("devrait accepter un echeanceId valide", () => {
      const result = getEcheanceDetailSchema.safeParse({ echeanceId: "456" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.echeanceId).toBe(456);
      }
    });

    it("devrait accepter echeanceId avec userId optionnel", () => {
      const result = getEcheanceDetailSchema.safeParse({
        echeanceId: "456",
        userId: "123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.echeanceId).toBe(456);
        expect(result.data.userId).toBe(123);
      }
    });

    it("devrait accepter echeanceId sans userId", () => {
      const result = getEcheanceDetailSchema.safeParse({ echeanceId: "789" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.echeanceId).toBe(789);
        expect(result.data.userId).toBeUndefined();
      }
    });

    it("devrait rejeter echeanceId = '0'", () => {
      const result = getEcheanceDetailSchema.safeParse({ echeanceId: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId = '0'", () => {
      const result = getEcheanceDetailSchema.safeParse({
        echeanceId: "456",
        userId: "0",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un echeanceId négatif", () => {
      const result = getEcheanceDetailSchema.safeParse({ echeanceId: "-10" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId négatif optionnel", () => {
      const result = getEcheanceDetailSchema.safeParse({
        echeanceId: "456",
        userId: "-5",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un echeanceId non numérique", () => {
      const result = getEcheanceDetailSchema.safeParse({
        echeanceId: "abc",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createEcheanceSchema - Tests de toutes les branches", () => {
    const validData = {
      utilisateur_id: 1,
      abonnement_id: 1,
      montant: 25.5,
      date_echeance: "2024-03-15",
      statut: "en attente" as const,
    };

    it("devrait accepter des données complètes valides", () => {
      const result = createEcheanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter des données sans champs optionnels", () => {
      const minimalData = {
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };
      const result = createEcheanceSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter abonnement_id null", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        abonnement_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter utilisateur_id = 0", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        utilisateur_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id négatif", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        utilisateur_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter abonnement_id = 0", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        abonnement_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter abonnement_id négatif", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        abonnement_id: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter montant = 0", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter montant négatif", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: -10.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter montant = 0.01", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: 0.01,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter montant < 0.01", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: 0.009,
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter montant = 999999", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: 999999,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter montant > 999999", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: 1000000,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        date_echeance: "invalid-date",
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter une date au format ISO", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        date_echeance: "2024-12-31T23:59:59Z",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un statut invalide", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        statut: "invalid_status",
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter statut 'en attente'", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        statut: "en attente",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter statut 'payé'", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        statut: "payé",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter statut 'échu'", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        statut: "échu",
      });
      expect(result.success).toBe(true);
    });

    it("devrait utiliser 'en attente' par défaut si statut non fourni", () => {
      const dataWithoutStatus = {
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };
      const result = createEcheanceSchema.safeParse(dataWithoutStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en attente");
      }
    });

    it("devrait rejeter description vide", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter description trop longue (> 255 caractères)", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        description: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter description valide", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        description: "Paiement mensuel",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter des données vides", () => {
      const result = createEcheanceSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = createEcheanceSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id en string", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        utilisateur_id: "1",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter montant en string", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        montant: "25.5",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id décimal", () => {
      const result = createEcheanceSchema.safeParse({
        ...validData,
        utilisateur_id: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateEcheanceSchema - Tests de toutes les branches", () => {
    it("devrait accepter une mise à jour du montant", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 50.0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter une mise à jour du statut", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        statut: "payé",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter une mise à jour de la date", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        date_echeance: "2024-06-30",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter une mise à jour de plusieurs champs", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 75.5,
        statut: "payé",
        date_echeance: "2024-07-15",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter montant = 0", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter montant négatif", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: -20,
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter montant = 0.01", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 0.01,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter montant < 0.01", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 0.005,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter montant > 999999", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        montant: 1000000,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId = 0", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 0,
        montant: 50.0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId négatif", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: -5,
        montant: 50.0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId manquant", () => {
      const result = updateEcheanceSchema.safeParse({
        montant: 50.0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        statut: "annulé",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        date_echeance: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter date_paiement valide", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        date_paiement: "2024-03-15",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter date_paiement null", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        date_paiement: null,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter stripe_payment_intent_id valide", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        stripe_payment_intent_id: "pi_1234567890abcdef",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter stripe_payment_intent_id null", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        stripe_payment_intent_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter stripe_payment_intent_id sans préfixe pi_", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        stripe_payment_intent_id: "ch_1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter description dans une mise à jour", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        description: "Mise à jour description",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter description vide", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter description trop longue", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1,
        description: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId décimal", () => {
      const result = updateEcheanceSchema.safeParse({
        echeanceId: 1.5,
        montant: 50.0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteEcheanceSchema - Tests de toutes les branches", () => {
    it("devrait accepter un echeanceId valide", () => {
      const result = deleteEcheanceSchema.safeParse({ echeanceId: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.echeanceId).toBe(123);
      }
    });

    it("devrait rejeter echeanceId = '0'", () => {
      const result = deleteEcheanceSchema.safeParse({ echeanceId: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId négatif", () => {
      const result = deleteEcheanceSchema.safeParse({ echeanceId: "-10" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId non numérique", () => {
      const result = deleteEcheanceSchema.safeParse({ echeanceId: "abc" });
      expect(result.success).toBe(false);
    });
  });

  describe("getStatistiquesSchema - Tests de toutes les branches", () => {
    it("devrait accepter un userId valide", () => {
      const result = getStatistiquesSchema.safeParse({ userId: "456" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(456);
      }
    });

    it("devrait rejeter userId = '0'", () => {
      const result = getStatistiquesSchema.safeParse({ userId: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId négatif", () => {
      const result = getStatistiquesSchema.safeParse({ userId: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId non numérique", () => {
      const result = getStatistiquesSchema.safeParse({ userId: "xyz" });
      expect(result.success).toBe(false);
    });
  });

  describe("diagnosticEcheanceSchema - Tests de toutes les branches", () => {
    it("devrait accepter echeanceId et userId valides", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "789",
        userId: "123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.echeanceId).toBe(789);
        expect(result.data.userId).toBe(123);
      }
    });

    it("devrait rejeter echeanceId = '0'", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "0",
        userId: "123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId = '0'", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "789",
        userId: "0",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId négatif", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "-10",
        userId: "123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId négatif", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "789",
        userId: "-5",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter echeanceId non numérique", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "abc",
        userId: "123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId non numérique", () => {
      const result = diagnosticEcheanceSchema.safeParse({
        echeanceId: "789",
        userId: "xyz",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases et cas limites", () => {
    it("devrait gérer des nombres très grands pour userId", () => {
      const result = getEcheancesUtilisateurSchema.safeParse({
        userId: "2147483647",
      });
      expect(result.success).toBe(true);
    });

    it("devrait gérer des montants avec beaucoup de décimales", () => {
      const result = createEcheanceSchema.safeParse({
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.123456789,
        date_echeance: "2024-03-15",
        statut: "en attente",
      });
      expect(result.success).toBe(true);
    });

    it("devrait gérer des dates au format ISO complet", () => {
      const result = createEcheanceSchema.safeParse({
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15T10:30:45.123Z",
        statut: "en attente",
      });
      expect(result.success).toBe(true);
    });

    it("devrait gérer des caractères Unicode dans la description", () => {
      const result = createEcheanceSchema.safeParse({
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "en attente",
        description: "Paiement avec émojis 🎉 et caractères spéciaux éàü",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter description de 255 caractères exactement", () => {
      const result = createEcheanceSchema.safeParse({
        utilisateur_id: 1,
        abonnement_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "en attente",
        description: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });
  });
});
