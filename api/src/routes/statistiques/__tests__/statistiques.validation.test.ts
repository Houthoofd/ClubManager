/**
 * Tests de validation pour le module Statistiques
 * Tests des schémas Zod et validation des données
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  simpleUtilisateurIdSchema,
  joursHistoriqueSchema,
  moisHistoriqueSchema,
  periodeSchema,
} from "../core/validators/statistiques.schema.js";

describe("Statistiques Module - Tests de Validation", () => {
  // ==================== Validation ID Utilisateur ====================
  describe("Validation simpleUtilisateurIdSchema", () => {
    it("devrait accepter un ID utilisateur valide", () => {
      const result = simpleUtilisateurIdSchema.safeParse(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait accepter un grand ID utilisateur", () => {
      const result = simpleUtilisateurIdSchema.safeParse(999999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID utilisateur négatif", () => {
      const result = simpleUtilisateurIdSchema.safeParse(-1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("devrait rejeter un ID utilisateur à zéro", () => {
      const result = simpleUtilisateurIdSchema.safeParse(0);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID utilisateur null", () => {
      const result = simpleUtilisateurIdSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID utilisateur undefined", () => {
      const result = simpleUtilisateurIdSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une chaîne de caractères", () => {
      const result = simpleUtilisateurIdSchema.safeParse("abc");

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet", () => {
      const result = simpleUtilisateurIdSchema.safeParse({ id: 1 });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un tableau", () => {
      const result = simpleUtilisateurIdSchema.safeParse([1, 2, 3]);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter NaN", () => {
      const result = simpleUtilisateurIdSchema.safeParse(NaN);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter Infinity", () => {
      const result = simpleUtilisateurIdSchema.safeParse(Infinity);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les nombres décimaux", () => {
      const result = simpleUtilisateurIdSchema.safeParse(1.5);

      expect(result.success).toBe(false);
    });

    it("devrait avoir un message d'erreur descriptif", () => {
      const result = simpleUtilisateurIdSchema.safeParse(-1);

      if (!result.success) {
        expect(result.error.issues[0].message).toBeTruthy();
        expect(typeof result.error.issues[0].message).toBe("string");
      }
    });
  });

  // ==================== Validation Jours Historique ====================
  describe("Validation joursHistoriqueSchema", () => {
    it("devrait accepter 1 jour", () => {
      const result = joursHistoriqueSchema.safeParse(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait accepter 30 jours", () => {
      const result = joursHistoriqueSchema.safeParse(30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(30);
      }
    });

    it("devrait accepter 365 jours (maximum)", () => {
      const result = joursHistoriqueSchema.safeParse(365);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(365);
      }
    });

    it("devrait avoir une valeur par défaut", () => {
      const result = joursHistoriqueSchema.safeParse(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeGreaterThan(0);
        expect(result.data).toBeLessThanOrEqual(365);
      }
    });

    it("devrait rejeter 0 jour", () => {
      const result = joursHistoriqueSchema.safeParse(0);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre négatif", () => {
      const result = joursHistoriqueSchema.safeParse(-10);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter plus de 365 jours", () => {
      const result = joursHistoriqueSchema.safeParse(366);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter 1000 jours", () => {
      const result = joursHistoriqueSchema.safeParse(1000);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter NaN", () => {
      const result = joursHistoriqueSchema.safeParse(NaN);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter Infinity", () => {
      const result = joursHistoriqueSchema.safeParse(Infinity);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les chaînes de caractères", () => {
      const result = joursHistoriqueSchema.safeParse("30");

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les nombres décimaux", () => {
      const result = joursHistoriqueSchema.safeParse(30.5);

      expect(result.success).toBe(false);
    });
  });

  // ==================== Validation Mois Historique ====================
  describe("Validation moisHistoriqueSchema", () => {
    it("devrait accepter 1 mois", () => {
      const result = moisHistoriqueSchema.safeParse(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait accepter 12 mois", () => {
      const result = moisHistoriqueSchema.safeParse(12);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(12);
      }
    });

    it("devrait accepter 36 mois (maximum)", () => {
      const result = moisHistoriqueSchema.safeParse(36);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(36);
      }
    });

    it("devrait avoir une valeur par défaut", () => {
      const result = moisHistoriqueSchema.safeParse(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeGreaterThan(0);
        expect(result.data).toBeLessThanOrEqual(36);
      }
    });

    it("devrait rejeter 0 mois", () => {
      const result = moisHistoriqueSchema.safeParse(0);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre négatif", () => {
      const result = moisHistoriqueSchema.safeParse(-6);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter plus de 36 mois", () => {
      const result = moisHistoriqueSchema.safeParse(37);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter 100 mois", () => {
      const result = moisHistoriqueSchema.safeParse(100);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter NaN", () => {
      const result = moisHistoriqueSchema.safeParse(NaN);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter Infinity", () => {
      const result = moisHistoriqueSchema.safeParse(Infinity);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les chaînes de caractères", () => {
      const result = moisHistoriqueSchema.safeParse("12");

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les nombres décimaux", () => {
      const result = moisHistoriqueSchema.safeParse(12.5);

      expect(result.success).toBe(false);
    });
  });

  // ==================== Validation Période ====================
  describe("Validation periodeSchema", () => {
    it("devrait accepter une période valide", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-12-31"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter seulement dateDebut", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-01-01"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter seulement dateFin", () => {
      const result = periodeSchema.safeParse({
        dateFin: new Date("2024-12-31"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter une période sans dates (optionnelles)", () => {
      const result = periodeSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("devrait rejeter dateDebut après dateFin", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-12-31"),
        dateFin: new Date("2024-01-01"),
      });

      expect(result.success).toBe(false);
    });

    it("devrait accepter des dates identiques", () => {
      const date = new Date("2024-06-15");
      const result = periodeSchema.safeParse({
        dateDebut: date,
        dateFin: date,
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter dateDebut invalide", () => {
      const result = periodeSchema.safeParse({
        dateDebut: "invalid-date",
        dateFin: new Date("2024-12-31"),
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter dateFin invalide", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-01-01"),
        dateFin: "invalid-date",
      });

      expect(result.success).toBe(false);
    });

    it("devrait accepter des dates futures", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2025-01-01"),
        dateFin: new Date("2025-12-31"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter des dates passées", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2020-01-01"),
        dateFin: new Date("2020-12-31"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter dateDebut comme string", () => {
      const result = periodeSchema.safeParse({
        dateDebut: "2024-01-01",
        dateFin: new Date("2024-12-31"),
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter dateFin comme timestamp", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-01-01"),
        dateFin: Date.now(),
      });

      expect(result.success).toBe(false);
    });
  });

  // ==================== Validation des Cas Limites ====================
  describe("Cas Limites de Validation", () => {
    it("devrait gérer les valeurs limites de joursHistorique", () => {
      const min = joursHistoriqueSchema.safeParse(1);
      const max = joursHistoriqueSchema.safeParse(365);

      expect(min.success).toBe(true);
      expect(max.success).toBe(true);
    });

    it("devrait gérer les valeurs limites de moisHistorique", () => {
      const min = moisHistoriqueSchema.safeParse(1);
      const max = moisHistoriqueSchema.safeParse(36);

      expect(min.success).toBe(true);
      expect(max.success).toBe(true);
    });

    it("devrait rejeter les valeurs juste au-dessus des limites", () => {
      const jours = joursHistoriqueSchema.safeParse(366);
      const mois = moisHistoriqueSchema.safeParse(37);

      expect(jours.success).toBe(false);
      expect(mois.success).toBe(false);
    });

    it("devrait rejeter les valeurs juste en-dessous des limites", () => {
      const joursZero = joursHistoriqueSchema.safeParse(0);
      const moisZero = moisHistoriqueSchema.safeParse(0);

      expect(joursZero.success).toBe(false);
      expect(moisZero.success).toBe(false);
    });
  });

  // ==================== Messages d'Erreur ====================
  describe("Messages d'Erreur de Validation", () => {
    it("devrait fournir un message clair pour ID invalide", () => {
      const result = simpleUtilisateurIdSchema.safeParse(-1);

      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      }
    });

    it("devrait fournir un message clair pour jours invalide", () => {
      const result = joursHistoriqueSchema.safeParse(1000);

      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toBeTruthy();
      }
    });

    it("devrait fournir un message clair pour mois invalide", () => {
      const result = moisHistoriqueSchema.safeParse(100);

      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toBeTruthy();
      }
    });

    it("devrait fournir un message clair pour période invalide", () => {
      const result = periodeSchema.safeParse({
        dateDebut: new Date("2024-12-31"),
        dateFin: new Date("2024-01-01"),
      });

      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toBeTruthy();
      }
    });
  });

  // ==================== Coercition et Transformation ====================
  describe("Coercition et Transformation", () => {
    it("devrait appliquer les valeurs par défaut correctement", () => {
      const jours = joursHistoriqueSchema.safeParse(undefined);
      const mois = moisHistoriqueSchema.safeParse(undefined);

      expect(jours.success).toBe(true);
      expect(mois.success).toBe(true);

      if (jours.success) {
        expect(typeof jours.data).toBe("number");
      }
      if (mois.success) {
        expect(typeof mois.data).toBe("number");
      }
    });

    it("ne devrait pas convertir automatiquement les strings en numbers", () => {
      const result = simpleUtilisateurIdSchema.safeParse("123");

      expect(result.success).toBe(false);
    });

    it("ne devrait pas arrondir les décimaux", () => {
      const jours = joursHistoriqueSchema.safeParse(30.7);
      const mois = moisHistoriqueSchema.safeParse(12.3);

      expect(jours.success).toBe(false);
      expect(mois.success).toBe(false);
    });
  });

  // ==================== Sécurité ====================
  describe("Sécurité de la Validation", () => {
    it("devrait rejeter les injections SQL dans les IDs", () => {
      const malicious = simpleUtilisateurIdSchema.safeParse(
        "1; DROP TABLE users;" as any,
      );

      expect(malicious.success).toBe(false);
    });

    it("devrait rejeter les objets malveillants", () => {
      const malicious = simpleUtilisateurIdSchema.safeParse({
        toString: () => "1",
        valueOf: () => 1,
      });

      expect(malicious.success).toBe(false);
    });

    it("devrait rejeter les tentatives de prototype pollution", () => {
      const malicious = joursHistoriqueSchema.safeParse({
        __proto__: { polluted: true },
      } as any);

      expect(malicious.success).toBe(false);
    });

    it("devrait valider strictement les types", () => {
      const bool = simpleUtilisateurIdSchema.safeParse(true);
      const func = joursHistoriqueSchema.safeParse(() => 30);

      expect(bool.success).toBe(false);
      expect(func.success).toBe(false);
    });
  });

  // ==================== Compatibilité ====================
  describe("Compatibilité et Interopérabilité", () => {
    it("devrait être compatible avec le parsing JSON", () => {
      const data = JSON.parse('{"utilisateurId": 123}');
      const result = simpleUtilisateurIdSchema.safeParse(data.utilisateurId);

      expect(result.success).toBe(true);
    });

    it("devrait gérer les dates ISO string après parsing", () => {
      const isoString = "2024-01-01T00:00:00.000Z";
      const date = new Date(isoString);
      const result = periodeSchema.safeParse({
        dateDebut: date,
        dateFin: new Date("2024-12-31"),
      });

      expect(result.success).toBe(true);
    });

    it("devrait valider les données après transformation", () => {
      const id = parseInt("123");
      const result = simpleUtilisateurIdSchema.safeParse(id);

      expect(result.success).toBe(true);
    });
  });

  // ==================== Tests de Régression ====================
  describe("Tests de Régression", () => {
    it("ne devrait pas accepter 0 comme ID valide", () => {
      const result = simpleUtilisateurIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("ne devrait pas accepter les nombres négatifs", () => {
      const result = simpleUtilisateurIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait maintenir la cohérence entre min et max", () => {
      const minJours = joursHistoriqueSchema.safeParse(1);
      const maxJours = joursHistoriqueSchema.safeParse(365);
      const minMois = moisHistoriqueSchema.safeParse(1);
      const maxMois = moisHistoriqueSchema.safeParse(36);

      expect(minJours.success).toBe(true);
      expect(maxJours.success).toBe(true);
      expect(minMois.success).toBe(true);
      expect(maxMois.success).toBe(true);
    });
  });
});
