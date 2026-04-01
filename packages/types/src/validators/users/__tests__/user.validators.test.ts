/**
 * Tests pour les validators utilisateurs
 * Test de tous les schémas Zod dans user.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createUserSchema,
  updateUserSchema,
  softDeleteUserSchema,
  restoreUserSchema,
  updatePasswordSchema,
  updateEmailSchema,
  updateProfileSchema,
  anonymizeUserSchema,
} from "../user.validators.js";

describe("User Validators", () => {
  describe("createUserSchema", () => {
    it("devrait valider un utilisateur valide avec tous les champs", () => {
      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "SecureP@ssw0rd",
        date_of_birth: "1990-05-15",
        telephone: "+33612345678",
        adresse: "123 Rue de la Paix, Paris",
        genre_id: 1,
        grade_id: 2,
        abonnement_id: 3,
        status_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe("Jean");
        expect(result.data.email).toBe("jean.dupont@example.com");
      }
    });

    it("devrait valider un utilisateur avec champs optionnels absents", () => {
      const validUser = {
        first_name: "Marie",
        last_name: "Martin",
        email: "marie.martin@test.fr",
        password: "Password123!",
        date_of_birth: "1995-03-20",
        genre_id: 2,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom avec accents et traits d'union", () => {
      const validUser = {
        first_name: "Jean-François",
        last_name: "O'Connor",
        email: "jf@example.com",
        password: "Password123",
        date_of_birth: "1988-01-01",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide (sans @)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jeandupont.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("devrait rejeter un email invalide (sans domaine)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop court (< 5 caractères)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "a@b",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop court (< 8 caractères)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "Pass12",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("devrait valider un mot de passe de 8 caractères exactement", () => {
      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass1234",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom invalide (avec chiffres)", () => {
      const invalidUser = {
        first_name: "Jean123",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("first_name");
      }
    });

    it("devrait rejeter un nom invalide (avec caractères spéciaux)", () => {
      const invalidUser = {
        first_name: "Jean@",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop court (< 2 caractères)", () => {
      const invalidUser = {
        first_name: "J",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un âge trop jeune (< 5 ans)", () => {
      const today = new Date();
      const fourYearsAgo = new Date(
        today.getFullYear() - 4,
        today.getMonth(),
        today.getDate(),
      );
      const dateStr = fourYearsAgo.toISOString().split("T")[0];

      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: dateStr,
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait valider un âge de 5 ans exactement", () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate(),
      );
      const dateStr = fiveYearsAgo.toISOString().split("T")[0];

      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: dateStr,
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un âge trop vieux (> 120 ans)", () => {
      const today = new Date();
      const tooOld = new Date(
        today.getFullYear() - 121,
        today.getMonth(),
        today.getDate(),
      );
      const dateStr = tooOld.toISOString().split("T")[0];

      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: dateStr,
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait valider un âge de 120 ans exactement", () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );
      const dateStr = oneHundredTwentyYearsAgo.toISOString().split("T")[0];

      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: dateStr,
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom d'utilisateur trop court (< 3 caractères)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        nom_utilisateur: "jd",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom d'utilisateur avec caractères spéciaux", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        nom_utilisateur: "jean-dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait valider un nom d'utilisateur avec underscores", () => {
      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        nom_utilisateur: "jean_dupont_123",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si first_name est manquant", () => {
      const invalidUser = {
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si last_name est manquant", () => {
      const invalidUser = {
        first_name: "Jean",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si email est manquant", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si password est manquant", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        date_of_birth: "1990-05-15",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si genre_id est manquant", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si date_of_birth est manquante", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "SecurePassword",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait valider un téléphone avec format international", () => {
      const validUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        telephone: "+33 6 12 34 56 78",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un téléphone invalide", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        telephone: "123",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une adresse trop courte (< 5 caractères)", () => {
      const invalidUser = {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "SecurePassword",
        date_of_birth: "1990-05-15",
        adresse: "Rue",
        genre_id: 1,
      };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema", () => {
    it("devrait valider une mise à jour partielle valide", () => {
      const validUpdate = {
        id: 1,
        first_name: "Jean",
        email: "jean.nouveau@example.com",
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.first_name).toBe("Jean");
      }
    });

    it("devrait valider une mise à jour avec seulement l'id", () => {
      const validUpdate = {
        id: 42,
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de tous les champs", () => {
      const validUpdate = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        nom_utilisateur: "jean_d",
        email: "jean@example.com",
        password: "NewPassword123",
        date_of_birth: "1990-01-01",
        telephone: "+33612345678",
        adresse: "123 Rue de Paris",
        genre_id: 1,
        grade_id: 2,
        abonnement_id: 3,
        status_id: 1,
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        first_name: "Jean",
        email: "jean@example.com",
      };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        first_name: "Jean",
      };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        email: "invalid-email",
      };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop court en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        password: "short",
      };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait valider grade_id à null", () => {
      const validUpdate = {
        id: 1,
        grade_id: null,
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider abonnement_id à null", () => {
      const validUpdate = {
        id: 1,
        abonnement_id: null,
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de téléphone", () => {
      const validUpdate = {
        id: 1,
        telephone: "+33 6 12 34 56 78",
      };
      const result = updateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom invalide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        first_name: "Jean123",
      };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("softDeleteUserSchema", () => {
    it("devrait valider une suppression valide", () => {
      const validDelete = {
        userId: 1,
        deletedBy: 2,
        reason:
          "Utilisateur a demandé la suppression de son compte conformément au RGPD",
      };
      const result = softDeleteUserSchema.safeParse(validDelete);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.deletedBy).toBe(2);
        expect(result.data.reason).toBe(
          "Utilisateur a demandé la suppression de son compte conformément au RGPD",
        );
      }
    });

    it("devrait valider une raison de 10 caractères exactement", () => {
      const validDelete = {
        userId: 1,
        deletedBy: 2,
        reason: "0123456789",
      };
      const result = softDeleteUserSchema.safeParse(validDelete);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const invalidDelete = {
        userId: 1,
        deletedBy: 2,
        reason: "Court",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("reason");
      }
    });

    it("devrait rejeter une raison de 9 caractères", () => {
      const invalidDelete = {
        userId: 1,
        deletedBy: 2,
        reason: "012345678",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const longReason = "a".repeat(501);
      const invalidDelete = {
        userId: 1,
        deletedBy: 2,
        reason: longReason,
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("reason");
      }
    });

    it("devrait valider une raison de 500 caractères exactement", () => {
      const maxReason = "a".repeat(500);
      const validDelete = {
        userId: 1,
        deletedBy: 2,
        reason: maxReason,
      };
      const result = softDeleteUserSchema.safeParse(validDelete);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidDelete = {
        deletedBy: 2,
        reason: "Raison valide de suppression",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si deletedBy est manquant", () => {
      const invalidDelete = {
        userId: 1,
        reason: "Raison valide de suppression",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si reason est manquante", () => {
      const invalidDelete = {
        userId: 1,
        deletedBy: 2,
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est 0", () => {
      const invalidDelete = {
        userId: 0,
        deletedBy: 2,
        reason: "Raison valide de suppression",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si deletedBy est négatif", () => {
      const invalidDelete = {
        userId: 1,
        deletedBy: -1,
        reason: "Raison valide de suppression",
      };
      const result = softDeleteUserSchema.safeParse(invalidDelete);
      expect(result.success).toBe(false);
    });
  });

  describe("restoreUserSchema", () => {
    it("devrait valider une restauration valide", () => {
      const validRestore = {
        userId: 1,
        restoredBy: 2,
      };
      const result = restoreUserSchema.safeParse(validRestore);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.restoredBy).toBe(2);
      }
    });

    it("devrait valider une restauration avec grands IDs", () => {
      const validRestore = {
        userId: 999999,
        restoredBy: 888888,
      };
      const result = restoreUserSchema.safeParse(validRestore);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidRestore = {
        restoredBy: 2,
      };
      const result = restoreUserSchema.safeParse(invalidRestore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si restoredBy est manquant", () => {
      const invalidRestore = {
        userId: 1,
      };
      const result = restoreUserSchema.safeParse(invalidRestore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est 0", () => {
      const invalidRestore = {
        userId: 0,
        restoredBy: 2,
      };
      const result = restoreUserSchema.safeParse(invalidRestore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si restoredBy est négatif", () => {
      const invalidRestore = {
        userId: 1,
        restoredBy: -1,
      };
      const result = restoreUserSchema.safeParse(invalidRestore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est une string", () => {
      const invalidRestore = {
        userId: "1",
        restoredBy: 2,
      };
      const result = restoreUserSchema.safeParse(invalidRestore);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("devrait valider une mise à jour de mot de passe valide", () => {
      const validUpdate = {
        userId: 1,
        oldPassword: "OldPassword123",
        newPassword: "NewPassword456",
      };
      const result = updatePasswordSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.oldPassword).toBe("OldPassword123");
        expect(result.data.newPassword).toBe("NewPassword456");
      }
    });

    it("devrait valider des mots de passe de 8 caractères", () => {
      const validUpdate = {
        userId: 1,
        oldPassword: "Pass1234",
        newPassword: "Word5678",
      };
      const result = updatePasswordSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si oldPassword est trop court", () => {
      const invalidUpdate = {
        userId: 1,
        oldPassword: "Short1",
        newPassword: "NewPassword123",
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si newPassword est trop court", () => {
      const invalidUpdate = {
        userId: 1,
        oldPassword: "OldPassword123",
        newPassword: "Short1",
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidUpdate = {
        oldPassword: "OldPassword123",
        newPassword: "NewPassword456",
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si oldPassword est manquant", () => {
      const invalidUpdate = {
        userId: 1,
        newPassword: "NewPassword456",
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si newPassword est manquant", () => {
      const invalidUpdate = {
        userId: 1,
        oldPassword: "OldPassword123",
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait valider même si oldPassword et newPassword sont identiques", () => {
      const validUpdate = {
        userId: 1,
        oldPassword: "SamePassword123",
        newPassword: "SamePassword123",
      };
      const result = updatePasswordSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un mot de passe trop long (> 255 caractères)", () => {
      const longPassword = "a".repeat(256);
      const invalidUpdate = {
        userId: 1,
        oldPassword: "OldPassword123",
        newPassword: longPassword,
      };
      const result = updatePasswordSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait valider un mot de passe de 255 caractères", () => {
      const maxPassword = "a".repeat(255);
      const validUpdate = {
        userId: 1,
        oldPassword: "OldPassword123",
        newPassword: maxPassword,
      };
      const result = updatePasswordSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe("updateEmailSchema", () => {
    it("devrait valider une mise à jour d'email valide", () => {
      const validUpdate = {
        userId: 1,
        newEmail: "nouveau.email@example.com",
      };
      const result = updateEmailSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.newEmail).toBe("nouveau.email@example.com");
      }
    });

    it("devrait valider différents formats d'email", () => {
      const emails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      emails.forEach((email) => {
        const validUpdate = {
          userId: 1,
          newEmail: email,
        };
        const result = updateEmailSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un email invalide (sans @)", () => {
      const invalidUpdate = {
        userId: 1,
        newEmail: "invalidemail.com",
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide (sans domaine)", () => {
      const invalidUpdate = {
        userId: 1,
        newEmail: "user@",
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide (domaine incomplet)", () => {
      const invalidUpdate = {
        userId: 1,
        newEmail: "user@domain",
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidUpdate = {
        newEmail: "nouveau@example.com",
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si newEmail est manquant", () => {
      const invalidUpdate = {
        userId: 1,
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop court", () => {
      const invalidUpdate = {
        userId: 1,
        newEmail: "a@b",
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop long (> 255 caractères)", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const invalidUpdate = {
        userId: 1,
        newEmail: longEmail,
      };
      const result = updateEmailSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("devrait valider une mise à jour de profil complète", () => {
      const validUpdate = {
        userId: 1,
        first_name: "Jean",
        last_name: "Dupont",
        telephone: "+33612345678",
        adresse: "123 Rue de la Paix, Paris",
        photo_url: "https://example.com/photos/user123.jpg",
      };
      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.photo_url).toBe(
          "https://example.com/photos/user123.jpg",
        );
      }
    });

    it("devrait valider avec seulement userId", () => {
      const validUpdate = {
        userId: 1,
      };
      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quelques champs optionnels", () => {
      const validUpdate = {
        userId: 1,
        first_name: "Marie",
        telephone: "+33698765432",
      };
      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une URL de photo valide (HTTPS)", () => {
      const validUpdate = {
        userId: 1,
        photo_url: "https://cdn.example.com/images/profile.png",
      };
      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une URL de photo valide (HTTP)", () => {
      const validUpdate = {
        userId: 1,
        photo_url: "http://example.com/photo.jpg",
      };
      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une photo_url invalide (pas une URL)", () => {
      const invalidUpdate = {
        userId: 1,
        photo_url: "not-a-url",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("photo_url");
      }
    });

    it("devrait rejeter une photo_url invalide (chemin relatif)", () => {
      const invalidUpdate = {
        userId: 1,
        photo_url: "/images/photo.jpg",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une photo_url trop longue (> 255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(240);
      const invalidUpdate = {
        userId: 1,
        photo_url: longUrl,
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidUpdate = {
        first_name: "Jean",
        photo_url: "https://example.com/photo.jpg",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom invalide", () => {
      const invalidUpdate = {
        userId: 1,
        first_name: "Jean123",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un téléphone invalide", () => {
      const invalidUpdate = {
        userId: 1,
        telephone: "123",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une adresse trop courte", () => {
      const invalidUpdate = {
        userId: 1,
        adresse: "Rue",
      };
      const result = updateProfileSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("anonymizeUserSchema", () => {
    it("devrait valider une anonymisation valide", () => {
      const validAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason:
          "Demande d'anonymisation RGPD suite à la demande de l'utilisateur",
      };
      const result = anonymizeUserSchema.safeParse(validAnonymize);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(1);
        expect(result.data.anonymizedBy).toBe(2);
        expect(result.data.reason).toBe(
          "Demande d'anonymisation RGPD suite à la demande de l'utilisateur",
        );
      }
    });

    it("devrait valider une raison de 10 caractères exactement", () => {
      const validAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason: "0123456789",
      };
      const result = anonymizeUserSchema.safeParse(validAnonymize);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const invalidAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason: "Court",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("reason");
      }
    });

    it("devrait rejeter une raison de 9 caractères", () => {
      const invalidAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason: "012345678",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const longReason = "a".repeat(501);
      const invalidAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason: longReason,
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("reason");
      }
    });

    it("devrait valider une raison de 500 caractères exactement", () => {
      const maxReason = "a".repeat(500);
      const validAnonymize = {
        userId: 1,
        anonymizedBy: 2,
        reason: maxReason,
      };
      const result = anonymizeUserSchema.safeParse(validAnonymize);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si userId est manquant", () => {
      const invalidAnonymize = {
        anonymizedBy: 2,
        reason: "Raison valide d'anonymisation",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si anonymizedBy est manquant", () => {
      const invalidAnonymize = {
        userId: 1,
        reason: "Raison valide d'anonymisation",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si reason est manquante", () => {
      const invalidAnonymize = {
        userId: 1,
        anonymizedBy: 2,
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId est 0", () => {
      const invalidAnonymize = {
        userId: 0,
        anonymizedBy: 2,
        reason: "Raison valide d'anonymisation",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si anonymizedBy est négatif", () => {
      const invalidAnonymize = {
        userId: 1,
        anonymizedBy: -1,
        reason: "Raison valide d'anonymisation",
      };
      const result = anonymizeUserSchema.safeParse(invalidAnonymize);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec des IDs élevés", () => {
      const validAnonymize = {
        userId: 999999,
        anonymizedBy: 888888,
        reason: "Raison valide d'anonymisation RGPD",
      };
      const result = anonymizeUserSchema.safeParse(validAnonymize);
      expect(result.success).toBe(true);
    });
  });
});
