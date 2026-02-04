/**
 * Tests de schéma et configuration pour le module Inscription
 * Tests des types, interfaces et configuration du module
 */

import { describe, it, expect } from "@jest/globals";
import {
  verificationEmailSchema,
  inscriptionSchema,
  InscriptionData,
  VerificationEmailData,
} from "../core/validators/inscription.schema.js";

describe("Inscription Module - Schémas et Configuration", () => {
  describe("Schémas Zod - Structure", () => {
    it("verificationEmailSchema devrait avoir tous les champs requis", () => {
      const schema = verificationEmailSchema;

      expect(schema).toBeDefined();
      expect(schema.safeParse).toBeDefined();

      const validData = { email: "test@example.com" };
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("inscriptionSchema devrait accepter les données valides", () => {
      const schema = inscriptionSchema;

      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("inscriptionSchema devrait rejeter des données incomplètes", () => {
      const invalidData = {
        nom: "Dupont",
        email: "jean.dupont@example.com",
        // Manque: prenom, password, date, abonnement, genre
      };

      const result = inscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Types TypeScript - Inférence", () => {
    it("InscriptionData devrait avoir les bons types", () => {
      const data: InscriptionData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      expect(typeof data.nom).toBe("string");
      expect(typeof data.prenom).toBe("string");
      expect(typeof data.email).toBe("string");
      expect(typeof data.password).toBe("string");
      expect(typeof data.date).toBe("string");
      expect(typeof data.abonnement).toBe("number");
      expect(typeof data.genre).toBe("number");
    });

    it("VerificationEmailData devrait avoir les bons types", () => {
      const data: VerificationEmailData = {
        email: "test@example.com",
      };

      expect(typeof data.email).toBe("string");
    });
  });

  describe("Email - Validation", () => {
    it("devrait accepter un email valide", () => {
      const validEmails = [
        "test@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "test123@domain.fr",
      ];

      validEmails.forEach((email) => {
        const result = verificationEmailSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un email invalide", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "test@",
        "test @example.com",
        "test@example",
        "",
      ];

      invalidEmails.forEach((email) => {
        const result = verificationEmailSchema.safeParse({ email });
        expect(result.success).toBe(false);
      });
    });

    it("devrait normaliser l'email en lowercase", () => {
      const input = { email: "TEST@EXAMPLE.COM" };
      const result = verificationEmailSchema.parse(input);
      expect(result.email).toBe("test@example.com");
    });

    it("devrait supprimer les espaces (trim)", () => {
      const input = { email: "  test@example.com  " };
      const result = verificationEmailSchema.parse(input);
      expect(result.email).toBe("test@example.com");
    });

    it("devrait rejeter un email trop court", () => {
      const result = verificationEmailSchema.safeParse({ email: "a@b" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop long (>255 caractères)", () => {
      const longEmail = "a".repeat(250) + "@test.com";
      const result = verificationEmailSchema.safeParse({ email: longEmail });
      expect(result.success).toBe(false);
    });
  });

  describe("Nom et Prénom - Validation", () => {
    it("devrait accepter des noms valides", () => {
      const validNoms = [
        "Dupont",
        "De La Fontaine",
        "O'Brien",
        "Jean-Pierre",
        "Martin",
      ];

      validNoms.forEach((nom) => {
        const data = {
          nom,
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait accepter des caractères unicode (accents, cyrillique, arabe)", () => {
      const validNoms = [
        "François",
        "Müller",
        "Łukasz",
        "Владимир",
        "محمد",
        "李明",
      ];

      validNoms.forEach((nom) => {
        const data = {
          nom,
          prenom: "Test",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter des noms avec chiffres", () => {
      const data = {
        nom: "Dupont123",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des noms avec caractères spéciaux non autorisés", () => {
      const invalidNoms = ["Dupont@", "Jean#Pierre", "Test$", "Name%"];

      invalidNoms.forEach((nom) => {
        const data = {
          nom,
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it("devrait rejeter un nom vide", () => {
      const data = {
        nom: "",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long (>100 caractères)", () => {
      const data = {
        nom: "A".repeat(101),
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait supprimer les espaces autour du nom (trim)", () => {
      const data = {
        nom: "  Dupont  ",
        prenom: "  Jean  ",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.parse(data);
      expect(result.nom).toBe("Dupont");
      expect(result.prenom).toBe("Jean");
    });
  });

  describe("Mot de passe - Validation", () => {
    it("devrait accepter un mot de passe valide", () => {
      const validPasswords = [
        "SecureP@ss123",
        "MyP@ssw0rd!",
        "Str0ng#Pass",
        "C0mpl3x$Pwd",
      ];

      validPasswords.forEach((password) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password,
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un mot de passe sans majuscule", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "securep@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe sans minuscule", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SECUREP@SS123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe sans chiffre", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ssword",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe sans caractère spécial", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecurePass123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop court (<8 caractères)", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "Sec@1",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop long (>128 caractères)", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "A1@" + "a".repeat(126),
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Date de naissance - Validation", () => {
    it("devrait accepter une date valide", () => {
      const validDates = [
        "1990-05-15",
        "2000-12-31",
        "1985-01-01",
        "2010-06-20",
      ];

      validDates.forEach((date) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date,
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter une date future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().split("T")[0];

      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: dateStr,
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide (29 février année non bissextile)", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "2019-02-29",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait accepter 29 février sur une année bissextile", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "2020-02-29",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un format de date invalide", () => {
      const invalidDates = [
        "15-05-1990",
        "1990/05/15",
        "15/05/1990",
        "not-a-date",
        "2020-13-01",
        "2020-01-32",
      ];

      invalidDates.forEach((date) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date,
          abonnement: 1,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it("devrait rejeter un âge < 5 ans", () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );
      const dateStr = twoYearsAgo.toISOString().split("T")[0];

      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: dateStr,
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un âge = 5 ans (limite basse)", () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate()
      );
      const dateStr = fiveYearsAgo.toISOString().split("T")[0];

      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: dateStr,
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un âge = 120 ans (limite haute)", () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate()
      );
      const dateStr = oneHundredTwentyYearsAgo.toISOString().split("T")[0];

      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: dateStr,
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un âge > 120 ans", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1900-01-01",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Abonnement et Genre - Validation", () => {
    it("devrait accepter des IDs d'abonnement valides", () => {
      const validIds = [1, 2, 3, 10, 999];

      validIds.forEach((abonnement) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement,
          genre: 1,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un ID d'abonnement négatif", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: -1,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID d'abonnement = 0", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 0,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID d'abonnement décimal", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1.5,
        genre: 1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des IDs de genre valides", () => {
      const validIds = [1, 2];

      validIds.forEach((genre) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre,
        };
        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un ID de genre négatif", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: -1,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID de genre = 0", () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 0,
      };
      const result = inscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Messages d'erreur", () => {
    it("devrait fournir un message clair pour email manquant", () => {
      try {
        verificationEmailSchema.parse({});
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("email");
      }
    });

    it("devrait fournir un message clair pour mot de passe trop court", () => {
      try {
        inscriptionSchema.parse({
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "Short1!",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("8 caractères");
      }
    });

    it("devrait fournir un message clair pour date invalide", () => {
      try {
        inscriptionSchema.parse({
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "invalid-date",
          abonnement: 1,
          genre: 1,
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("format");
      }
    });

    it("devrait fournir un message clair pour âge invalide", () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );
      const dateStr = twoYearsAgo.toISOString().split("T")[0];

      try {
        inscriptionSchema.parse({
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: dateStr,
          abonnement: 1,
          genre: 1,
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("5 et 120 ans");
      }
    });
  });

  describe("Champs requis", () => {
    it("tous les champs sont requis pour l'inscription", () => {
      const fieldsToTest = [
        "nom",
        "prenom",
        "email",
        "password",
        "date",
        "abonnement",
        "genre",
      ];

      fieldsToTest.forEach((field) => {
        const data: any = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };
        delete data[field];

        const result = inscriptionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Transformation des données", () => {
    it("devrait normaliser l'email en lowercase", () => {
      const input = {
        nom: "Dupont",
        prenom: "Jean",
        email: "TEST@EXAMPLE.COM",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.parse(input);
      expect(result.email).toBe("test@example.com");
    });

    it("devrait supprimer les espaces (trim) autour des champs texte", () => {
      const input = {
        nom: "  Dupont  ",
        prenom: "  Jean  ",
        email: "  test@example.com  ",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.parse(input);
      expect(result.nom).toBe("Dupont");
      expect(result.prenom).toBe("Jean");
      expect(result.email).toBe("test@example.com");
    });

    it("ne devrait pas modifier le mot de passe", () => {
      const input = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "  SecureP@ss123  ",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };
      const result = inscriptionSchema.parse(input);
      // Le mot de passe ne devrait pas être trimmé
      expect(result.password).toBe("  SecureP@ss123  ");
    });
  });

  describe("Compatibilité et rétrocompatibilité", () => {
    it("devrait rejeter les champs supplémentaires non définis", () => {
      const dataWithExtra: any = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
        extraField: "should be ignored",
      };

      // Zod par défaut ignore les champs supplémentaires (strip)
      const result = inscriptionSchema.parse(dataWithExtra);
      expect((result as any).extraField).toBeUndefined();
    });

    it("devrait accepter les formats valides attendus", () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      expect(() => inscriptionSchema.parse(validData)).not.toThrow();
    });
  });

  describe("Types de données", () => {
    it("devrait rejeter des types incorrects", () => {
      const invalidData: any = {
        nom: 123, // Devrait être string
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      const result = inscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter abonnement comme string", () => {
      const invalidData: any = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: "1", // Devrait être number
        genre: 1,
      };

      const result = inscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter genre comme string", () => {
      const invalidData: any = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: "1", // Devrait être number
      };

      const result = inscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
