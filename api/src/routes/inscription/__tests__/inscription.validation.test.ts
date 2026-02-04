/**
 * Tests de validation avancés pour les schémas Zod du module Inscription
 * Tests approfondis des règles de validation
 */

import { describe, it, expect } from "@jest/globals";
import {
  verificationEmailSchema,
  inscriptionSchema,
  type InscriptionData,
  type VerificationEmailData,
} from "../core/validators/inscription.schema.js";

describe("Inscription - Tests de validation Zod", () => {
  // ==================== VERIFICATION EMAIL SCHEMA ====================
  describe("verificationEmailSchema", () => {
    describe("Cas valides", () => {
      it("devrait valider un email simple", () => {
        const result = verificationEmailSchema.safeParse({
          email: "test@example.com",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
        }
      });

      it("devrait normaliser l'email en lowercase", () => {
        const result = verificationEmailSchema.safeParse({
          email: "TEST@EXAMPLE.COM",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
        }
      });

      it("devrait trim les espaces", () => {
        const result = verificationEmailSchema.safeParse({
          email: "  test@example.com  ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
        }
      });

      it("devrait accepter un email avec sous-domaine", () => {
        const result = verificationEmailSchema.safeParse({
          email: "user@mail.example.com",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un email avec tiret", () => {
        const result = verificationEmailSchema.safeParse({
          email: "jean-pierre@example.com",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un email avec point", () => {
        const result = verificationEmailSchema.safeParse({
          email: "jean.pierre@example.com",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un email avec chiffres", () => {
        const result = verificationEmailSchema.safeParse({
          email: "user123@example.com",
        });

        expect(result.success).toBe(true);
      });
    });

    describe("Cas invalides", () => {
      it("devrait rejeter un email manquant", () => {
        const result = verificationEmailSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("requis");
        }
      });

      it("devrait rejeter un email null", () => {
        const result = verificationEmailSchema.safeParse({ email: null });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email vide", () => {
        const result = verificationEmailSchema.safeParse({ email: "" });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email sans @", () => {
        const result = verificationEmailSchema.safeParse({
          email: "testexample.com",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("email");
        }
      });

      it("devrait rejeter un email sans domaine", () => {
        const result = verificationEmailSchema.safeParse({ email: "test@" });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email sans partie locale", () => {
        const result = verificationEmailSchema.safeParse({
          email: "@example.com",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email trop court", () => {
        const result = verificationEmailSchema.safeParse({ email: "a@bc" });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email trop long (>255)", () => {
        const longEmail = "a".repeat(250) + "@test.com";
        const result = verificationEmailSchema.safeParse({ email: longEmail });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un email avec espaces au milieu", () => {
        const result = verificationEmailSchema.safeParse({
          email: "test test@example.com",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un type invalide (nombre)", () => {
        const result = verificationEmailSchema.safeParse({ email: 123 });

        expect(result.success).toBe(false);
      });
    });
  });

  // ==================== INSCRIPTION SCHEMA ====================
  describe("inscriptionSchema", () => {
    const validData: InscriptionData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    describe("Validation globale", () => {
      it("devrait valider un objet complet valide", () => {
        const result = inscriptionSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it("devrait rejeter un objet vide", () => {
        const result = inscriptionSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });

    // ==================== VALIDATION NOM ====================
    describe("Validation du nom", () => {
      it("devrait accepter un nom simple", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "Dupont",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un nom avec tiret", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "Martin-Dupont",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un nom avec apostrophe", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "O'Connor",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un nom avec espace", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "De La Fontaine",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un nom avec accents", () => {
        const noms = ["Müller", "François", "José", "Zoë"];
        noms.forEach((nom) => {
          const result = inscriptionSchema.safeParse({ ...validData, nom });
          expect(result.success).toBe(true);
        });
      });

      it("devrait trim les espaces du nom", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "  Dupont  ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nom).toBe("Dupont");
        }
      });

      it("devrait rejeter un nom vide", () => {
        const result = inscriptionSchema.safeParse({ ...validData, nom: "" });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un nom avec uniquement des espaces", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "   ",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un nom trop long (>100)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "a".repeat(101),
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un nom avec des chiffres", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: "Dupont123",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un nom avec des caractères spéciaux", () => {
        const nomsInvalides = ["Dupont@", "Martin#", "Test$", "User%"];
        nomsInvalides.forEach((nom) => {
          const result = inscriptionSchema.safeParse({ ...validData, nom });
          expect(result.success).toBe(false);
        });
      });

      it("devrait rejeter un nom null", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: null,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un type invalide (nombre)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          nom: 123,
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== VALIDATION PRENOM ====================
    describe("Validation du prénom", () => {
      it("devrait accepter un prénom simple", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "Jean",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un prénom composé", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "Jean-Pierre",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un prénom avec accents", () => {
        const prenoms = ["François", "José", "André", "Zoë"];
        prenoms.forEach((prenom) => {
          const result = inscriptionSchema.safeParse({ ...validData, prenom });
          expect(result.success).toBe(true);
        });
      });

      it("devrait trim les espaces du prénom", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "  Jean  ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.prenom).toBe("Jean");
        }
      });

      it("devrait rejeter un prénom vide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un prénom trop long (>100)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "a".repeat(101),
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un prénom avec des chiffres", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          prenom: "Jean123",
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== VALIDATION EMAIL ====================
    describe("Validation de l'email", () => {
      it("devrait accepter un email valide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          email: "test@example.com",
        });

        expect(result.success).toBe(true);
      });

      it("devrait normaliser l'email en lowercase", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          email: "TEST@EXAMPLE.COM",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
        }
      });

      it("devrait trim les espaces de l'email", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          email: "  test@example.com  ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
        }
      });

      it("devrait rejeter un email invalide", () => {
        const emailsInvalides = [
          "invalid",
          "test@",
          "@example.com",
          "test..test@example.com",
        ];

        emailsInvalides.forEach((email) => {
          const result = inscriptionSchema.safeParse({ ...validData, email });
          expect(result.success).toBe(false);
        });
      });
    });

    // ==================== VALIDATION MOT DE PASSE ====================
    describe("Validation du mot de passe", () => {
      it("devrait accepter un mot de passe valide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "SecureP@ss123",
        });

        expect(result.success).toBe(true);
      });

      it("devrait rejeter un mot de passe trop court (<8)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "Short1!",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("8 caractères");
        }
      });

      it("devrait rejeter un mot de passe sans majuscule", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "lowercase123!",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("majuscule");
        }
      });

      it("devrait rejeter un mot de passe sans minuscule", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "UPPERCASE123!",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("minuscule");
        }
      });

      it("devrait rejeter un mot de passe sans chiffre", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "NoNumber!",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("chiffre");
        }
      });

      it("devrait rejeter un mot de passe sans caractère spécial", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "NoSpecial123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("spécial");
        }
      });

      it("devrait accepter différents caractères spéciaux", () => {
        const passwords = [
          "Valid@Pass1",
          "Valid#Pass2",
          "Valid$Pass3",
          "Valid%Pass4",
          "Valid&Pass5",
          "Valid*Pass6",
          "Valid!Pass7",
        ];

        passwords.forEach((password) => {
          const result = inscriptionSchema.safeParse({ ...validData, password });
          expect(result.success).toBe(true);
        });
      });

      it("devrait rejeter un mot de passe trop long (>128)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: "A1!a" + "a".repeat(125),
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== VALIDATION DATE ====================
    describe("Validation de la date", () => {
      it("devrait accepter une date valide au format YYYY-MM-DD", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          date: "1990-01-15",
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un âge de 5 ans exactement", () => {
        const date5YearsAgo = new Date();
        date5YearsAgo.setFullYear(date5YearsAgo.getFullYear() - 5);
        date5YearsAgo.setDate(date5YearsAgo.getDate() - 1);

        const result = inscriptionSchema.safeParse({
          ...validData,
          date: date5YearsAgo.toISOString().split("T")[0],
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter un âge de 120 ans exactement", () => {
        const date120YearsAgo = new Date();
        date120YearsAgo.setFullYear(date120YearsAgo.getFullYear() - 120);
        date120YearsAgo.setDate(date120YearsAgo.getDate() + 1);

        const result = inscriptionSchema.safeParse({
          ...validData,
          date: date120YearsAgo.toISOString().split("T")[0],
        });

        expect(result.success).toBe(true);
      });

      it("devrait rejeter une date au mauvais format", () => {
        const datesInvalides = [
          "15/01/1990",
          "1990/01/15",
          "15-01-1990",
          "01-15-1990",
        ];

        datesInvalides.forEach((date) => {
          const result = inscriptionSchema.safeParse({ ...validData, date });
          expect(result.success).toBe(false);
        });
      });

      it("devrait rejeter une date invalide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          date: "2023-02-30",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un âge trop jeune (<5 ans)", () => {
        const dateTooRecent = new Date();
        dateTooRecent.setFullYear(dateTooRecent.getFullYear() - 3);

        const result = inscriptionSchema.safeParse({
          ...validData,
          date: dateTooRecent.toISOString().split("T")[0],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("âge");
        }
      });

      it("devrait rejeter un âge trop vieux (>120 ans)", () => {
        const dateVeryOld = new Date();
        dateVeryOld.setFullYear(dateVeryOld.getFullYear() - 121);

        const result = inscriptionSchema.safeParse({
          ...validData,
          date: dateVeryOld.toISOString().split("T")[0],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("âge");
        }
      });

      it("devrait rejeter une date dans le futur", () => {
        const futurDate = new Date();
        futurDate.setFullYear(futurDate.getFullYear() + 1);

        const result = inscriptionSchema.safeParse({
          ...validData,
          date: futurDate.toISOString().split("T")[0],
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== VALIDATION ABONNEMENT ====================
    describe("Validation de l'abonnement", () => {
      it("devrait accepter un abonnement valide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          abonnement: 1,
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter différents IDs d'abonnement", () => {
        const abonnements = [1, 2, 5, 10, 100];

        abonnements.forEach((abonnement) => {
          const result = inscriptionSchema.safeParse({
            ...validData,
            abonnement,
          });
          expect(result.success).toBe(true);
        });
      });

      it("devrait rejeter un abonnement négatif", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          abonnement: -1,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un abonnement à zéro", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          abonnement: 0,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un abonnement décimal", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          abonnement: 1.5,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un type invalide (string)", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          abonnement: "1",
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== VALIDATION GENRE ====================
    describe("Validation du genre", () => {
      it("devrait accepter un genre valide", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          genre: 1,
        });

        expect(result.success).toBe(true);
      });

      it("devrait accepter différents IDs de genre", () => {
        const genres = [1, 2, 3];

        genres.forEach((genre) => {
          const result = inscriptionSchema.safeParse({ ...validData, genre });
          expect(result.success).toBe(true);
        });
      });

      it("devrait rejeter un genre négatif", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          genre: -1,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un genre à zéro", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          genre: 0,
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter un genre décimal", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          genre: 1.5,
        });

        expect(result.success).toBe(false);
      });
    });

    // ==================== CAS LIMITES ====================
    describe("Cas limites", () => {
      it("devrait gérer un objet avec des propriétés supplémentaires", () => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          extraField: "should be stripped",
          role: "admin",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty("extraField");
          expect(result.data).not.toHaveProperty("role");
        }
      });

      it("devrait retourner plusieurs erreurs si plusieurs champs invalides", () => {
        const result = inscriptionSchema.safeParse({
          nom: "",
          prenom: "",
          email: "invalid",
          password: "weak",
          date: "invalid",
          abonnement: -1,
          genre: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
        }
      });
    });
  });
});
