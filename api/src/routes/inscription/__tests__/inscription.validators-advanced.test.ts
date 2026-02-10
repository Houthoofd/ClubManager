/**
 * Tests avancés des validateurs pour le module Inscription
 * Tests approfondis des schémas Zod et des transformations
 */

import { describe, it, expect } from "@jest/globals";
import {
  inscriptionSchema,
  verificationEmailSchema,
} from "@clubmanager/types/validators";

describe("Inscription Validators - Tests avancés", () => {
  // ==================== EMAIL VERIFICATION SCHEMA ====================
  describe("verificationEmailSchema - Tests avancés", () => {
    it("devrait valider un email simple", () => {
      const result = verificationEmailSchema.safeParse({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait transformer l'email en minuscules", () => {
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

    it("devrait transformer puis valider (trim → lowercase → validate)", () => {
      const result = verificationEmailSchema.safeParse({
        email: "  TEST@EXAMPLE.COM  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait accepter les emails avec sous-domaines", () => {
      const result = verificationEmailSchema.safeParse({
        email: "user@mail.example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les emails avec tirets", () => {
      const result = verificationEmailSchema.safeParse({
        email: "user@my-domain.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les emails avec points", () => {
      const result = verificationEmailSchema.safeParse({
        email: "first.last@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les emails avec plus (+)", () => {
      const result = verificationEmailSchema.safeParse({
        email: "user+tag@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les emails avec underscores", () => {
      const result = verificationEmailSchema.safeParse({
        email: "first_last@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email sans @", () => {
      const result = verificationEmailSchema.safeParse({
        email: "notanemail",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email sans domaine", () => {
      const result = verificationEmailSchema.safeParse({
        email: "user@",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email sans partie locale", () => {
      const result = verificationEmailSchema.safeParse({
        email: "@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop court (< 5 caractères)", () => {
      const result = verificationEmailSchema.safeParse({
        email: "a@b",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop long (> 255 caractères)", () => {
      const longEmail = `${"a".repeat(250)}@example.com`;

      const result = verificationEmailSchema.safeParse({
        email: longEmail,
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email vide", () => {
      const result = verificationEmailSchema.safeParse({
        email: "",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email avec espaces au milieu", () => {
      const result = verificationEmailSchema.safeParse({
        email: "test @example.com",
      });

      expect(result.success).toBe(false);
    });
  });

  // ==================== INSCRIPTION SCHEMA - NOM/PRÉNOM ====================
  describe("inscriptionSchema - Nom et Prénom", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait valider un nom simple", () => {
      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("devrait trim le nom", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "  Dupont  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Dupont");
      }
    });

    it("devrait accepter un nom d'un seul caractère", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "A",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter un nom de 100 caractères", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "A".repeat(100),
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom de 101 caractères", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "A".repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it("devrait accepter les noms avec accents", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Müller",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les noms avec apostrophes", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "O'Connor",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les noms avec traits d'union", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Dupont-Durand",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les noms avec espaces", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Van Der Berg",
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter les noms avec chiffres", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Dupont123",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter les noms avec caractères spéciaux interdits", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Dupont@#$",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide après trim", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("devrait accepter les caractères cyrilliques", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "Иванов",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les caractères arabes", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "محمد",
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter les caractères chinois", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "王",
      });

      expect(result.success).toBe(true);
    });
  });

  // ==================== INSCRIPTION SCHEMA - EMAIL ====================
  describe("inscriptionSchema - Email", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait transformer l'email en minuscules", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        email: "TEST@EXAMPLE.COM",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait trim l'email", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        email: "  test@example.com  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait appliquer trim puis lowercase", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        email: "  TEST@EXAMPLE.COM  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait accepter un email de 5 caractères minimum", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        email: "a@b.co", // 6 caractères, format valide
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email de 4 caractères", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        email: "a@bc",
      });

      expect(result.success).toBe(false);
    });
  });

  // ==================== INSCRIPTION SCHEMA - MOT DE PASSE ====================
  describe("inscriptionSchema - Mot de passe", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait accepter un mot de passe valide", () => {
      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("devrait accepter un mot de passe de 8 caractères minimum", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "SecP@ss1",
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un mot de passe de 7 caractères", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "Sec@ss1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/8 caractères/i);
      }
    });

    it("devrait rejeter un mot de passe sans majuscule", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "securepass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/majuscule/i);
      }
    });

    it("devrait rejeter un mot de passe sans minuscule", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "SECUREPASS123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/minuscule/i);
      }
    });

    it("devrait rejeter un mot de passe sans chiffre", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "SecurePass!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/chiffre/i);
      }
    });

    it("devrait rejeter un mot de passe sans caractère spécial", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/spécial/i);
      }
    });

    it("devrait accepter différents caractères spéciaux", () => {
      const specialChars = [
        "!",
        "@",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "(",
        ")",
        "-",
        "_",
        "+",
        "=",
      ];

      specialChars.forEach((char) => {
        const result = inscriptionSchema.safeParse({
          ...validData,
          password: `SecureP${char}ss123`,
        });

        expect(result.success).toBe(true);
      });
    });

    it("devrait accepter un mot de passe complexe", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "C0mpl3x!P@ssw0rd#2023",
      });

      expect(result.success).toBe(true);
    });
  });

  // ==================== INSCRIPTION SCHEMA - DATE ====================
  describe("inscriptionSchema - Date de naissance", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait accepter une date au format YYYY-MM-DD", () => {
      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un format de date invalide (DD/MM/YYYY)", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        date: "15/01/1990",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide (mois 13)", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        date: "1990-13-01",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide (jour 32)", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        date: "1990-01-32",
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter le 29 février pour une année non bissextile", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        date: "1990-02-29",
      });

      expect(result.success).toBe(false);
    });

    it("devrait accepter le 29 février pour une année bissextile", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        date: "1992-02-29",
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter une date dans le futur", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: dateString,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/futur/i);
      }
    });

    it("devrait rejeter un âge inférieur à 5 ans", () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate(),
      );
      const dateString = twoYearsAgo.toISOString().split("T")[0];

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: dateString,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("5");
      }
    });

    it("devrait accepter un âge de 5 ans exactement", () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: fiveYearsAgo.toISOString().split("T")[0],
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter un âge de 120 ans exactement", () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: oneHundredTwentyYearsAgo.toISOString().split("T")[0],
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un âge supérieur à 120 ans", () => {
      const today = new Date();
      const tooOld = new Date(
        today.getFullYear() - 150,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: tooOld.toISOString().split("T")[0],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/120 ans/i);
      }
    });
  });

  // ==================== INSCRIPTION SCHEMA - ABONNEMENT ====================
  describe("inscriptionSchema - Abonnement", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait accepter abonnement = 1", () => {
      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("devrait accepter un abonnement positif", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        abonnement: 5,
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter abonnement = 0", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        abonnement: 0,
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un abonnement négatif", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        abonnement: -1,
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

    it("devrait rejeter un abonnement string", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        abonnement: "1",
      });

      expect(result.success).toBe(false);
    });
  });

  // ==================== INSCRIPTION SCHEMA - GENRE ====================
  describe("inscriptionSchema - Genre", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait accepter genre = 1", () => {
      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("devrait accepter genre = 2", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        genre: 2,
      });

      expect(result.success).toBe(true);
    });

    it("devrait rejeter genre = 0", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        genre: 0,
      });

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un genre négatif", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        genre: -1,
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

    it("devrait rejeter un genre string", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        genre: "1",
      });

      expect(result.success).toBe(false);
    });
  });

  // ==================== CHAMPS MANQUANTS ====================
  describe("inscriptionSchema - Champs requis", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait rejeter si le nom est manquant", () => {
      const { nom, ...dataWithoutNom } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutNom);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si le prénom est manquant", () => {
      const { prenom, ...dataWithoutPrenom } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutPrenom);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si l'email est manquant", () => {
      const { email, ...dataWithoutEmail } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutEmail);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si le mot de passe est manquant", () => {
      const { password, ...dataWithoutPassword } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutPassword);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si la date est manquante", () => {
      const { date, ...dataWithoutDate } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutDate);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si l'abonnement est manquant", () => {
      const { abonnement, ...dataWithoutAbonnement } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutAbonnement);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter si le genre est manquant", () => {
      const { genre, ...dataWithoutGenre } = validData;
      const result = inscriptionSchema.safeParse(dataWithoutGenre);

      expect(result.success).toBe(false);
    });
  });

  // ==================== TRANSFORMATION COMPLÈTE ====================
  describe("inscriptionSchema - Transformations complètes", () => {
    it("devrait appliquer toutes les transformations", () => {
      const result = inscriptionSchema.safeParse({
        nom: "  DUPONT  ",
        prenom: "  JEAN  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("DUPONT");
        expect(result.data.prenom).toBe("JEAN");
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("devrait préserver les données valides", () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      const result = inscriptionSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  // ==================== MESSAGES D'ERREUR ====================
  describe("Messages d'erreur personnalisés", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait fournir un message d'erreur clair pour le nom", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        nom: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeTruthy();
        expect(typeof result.error.issues[0].message).toBe("string");
      }
    });

    it("devrait fournir un message d'erreur clair pour le mot de passe", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        password: "weak",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(10);
      }
    });

    it("devrait fournir un message d'erreur clair pour l'âge", () => {
      const today = new Date();
      const tooYoung = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionSchema.safeParse({
        ...validData,
        date: tooYoung.toISOString().split("T")[0],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toMatch(/âge|ans/i);
      }
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge cases avancés", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("devrait gérer null", () => {
      const result = inscriptionSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it("devrait gérer undefined", () => {
      const result = inscriptionSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it("devrait gérer un objet vide", () => {
      const result = inscriptionSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("devrait gérer un array", () => {
      const result = inscriptionSchema.safeParse([validData]);

      expect(result.success).toBe(false);
    });

    it("devrait gérer une string", () => {
      const result = inscriptionSchema.safeParse("string");

      expect(result.success).toBe(false);
    });

    it("devrait gérer un number", () => {
      const result = inscriptionSchema.safeParse(123);

      expect(result.success).toBe(false);
    });

    it("devrait ignorer les champs supplémentaires", () => {
      const result = inscriptionSchema.safeParse({
        ...validData,
        extraField: "should be ignored",
        anotherExtra: 123,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("extraField");
        expect(result.data).not.toHaveProperty("anotherExtra");
      }
    });
  });
});
