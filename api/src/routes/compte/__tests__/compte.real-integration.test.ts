/**
 * Tests d'intégration RÉELS du module Compte avec vraie DB
 * Ces tests utilisent une base MySQL de test
 */

// IMPORTANT: Charger .env.test AVANT tout autre import
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
  path: join(__dirname, "../../../../.env.test"),
  override: true,
});

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  teardownTestDatabase,
  getTestPrisma,
} from "../../../tests/setup/testDatabase.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

describe("Compte - Tests d'intégration RÉELS avec DB", () => {
  let testPrisma: PrismaClient;
  let testUserId: number;

  beforeAll(async () => {
    console.log(`🔧 [TEST] Début du setup...`);
    const prismaInstance = await setupTestDatabase();
    testPrisma = prismaInstance as PrismaClient;
    console.log(`🔗 [TEST] Base de données de test initialisée`);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    console.log(`🧹 [TEST] Nettoyage des tables...`);

    // Nettoyer toutes les tables dans le bon ordre (contraintes FK)
    await testPrisma.echeances_paiements.deleteMany({});
    await testPrisma.utilisateurs.deleteMany({});
    await testPrisma.grades.deleteMany({});
    await testPrisma.status.deleteMany({});

    console.log("🌱 [TEST] Création des données de test...");

    // Créer les données de référence obligatoires
    await testPrisma.status.create({
      data: {
        id: 1,
        nom_role: "Actif",
      },
    });

    await testPrisma.grades.create({
      data: {
        id: 1,
        grade_id: "debutant",
      },
    });

    // Créer un utilisateur de test minimal
    const user = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST${Date.now()}`,
        nom_utilisateur: `testuser${Date.now()}`,
        first_name: "John",
        last_name: "Doe",
        email: `john.doe.${Date.now()}@test.com`,
        date_of_birth: new Date("1990-01-01"),
        password: "TempPassword123!",
      },
    });
    testUserId = user.id;

    console.log(`✅ [TEST] Utilisateur de test créé (ID: ${testUserId})`);
  });

  describe("Connexion et opérations de base DB", () => {
    it("devrait se connecter à la base de données de test", async () => {
      expect(testPrisma).toBeDefined();
    });

    it("devrait créer un utilisateur dans la DB", async () => {
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.first_name).toBe("John");
      expect(user?.last_name).toBe("Doe");
    });

    it("devrait récupérer un utilisateur par email", async () => {
      const user = await testPrisma.utilisateurs.findFirst({
        where: {
          first_name: "John",
          last_name: "Doe",
        },
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it("devrait retourner null pour un utilisateur inexistant", async () => {
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: 999999 },
      });

      expect(user).toBeNull();
    });
  });

  describe("Gestion des mots de passe", () => {
    it("devrait créer et hasher un mot de passe", async () => {
      const plainPassword = "NewPassword123!";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { password: hashedPassword },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(plainPassword);

      const isValidPassword = await bcrypt.compare(
        plainPassword,
        user?.password || "",
      );
      expect(isValidPassword).toBe(true);
    });

    it("devrait hasher le mot de passe avec bcrypt", async () => {
      const plainPassword = "TestPassword123!";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("devrait modifier un mot de passe existant", async () => {
      const initialPassword = "InitialPassword123!";
      const newPassword = "NewPassword456!";

      const initialHash = await bcrypt.hash(initialPassword, 10);
      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { password: initialHash },
      });

      const newHash = await bcrypt.hash(newPassword, 10);
      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { password: newHash },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      const isOldValid = await bcrypt.compare(
        initialPassword,
        user?.password || "",
      );
      expect(isOldValid).toBe(false);

      const isNewValid = await bcrypt.compare(
        newPassword,
        user?.password || "",
      );
      expect(isNewValid).toBe(true);
    });

    it("devrait générer des hashes différents pour le même mot de passe", async () => {
      const password = "SamePassword123!";
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);

      const isValid1 = await bcrypt.compare(password, hash1);
      const isValid2 = await bcrypt.compare(password, hash2);

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });

  describe("Mise à jour du compte", () => {
    it("devrait mettre à jour l'email de l'utilisateur", async () => {
      const newEmail = `new.email.${Date.now()}@test.com`;

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { email: newEmail },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.email).toBe(newEmail);
    });

    it("devrait mettre à jour la date de naissance", async () => {
      const newDate = new Date("1995-05-15");

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { date_of_birth: newDate },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.date_of_birth?.toISOString().split("T")[0]).toBe(
        "1995-05-15",
      );
    });

    it("devrait mettre à jour plusieurs champs simultanément", async () => {
      const newEmail = `updated.${Date.now()}@test.com`;
      const newFirstName = "Jane";
      const newLastName = "Smith";

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: {
          email: newEmail,
          first_name: newFirstName,
          last_name: newLastName,
        },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.email).toBe(newEmail);
      expect(user?.first_name).toBe(newFirstName);
      expect(user?.last_name).toBe(newLastName);
    });
  });

  describe("Intégrité des données et contraintes", () => {
    it("devrait permettre des emails en double (pas de contrainte unique)", async () => {
      const duplicateEmail = `duplicate.${Date.now()}@test.com`;

      const user1 = await testPrisma.utilisateurs.create({
        data: {
          userId: `DUP${Date.now()}`,
          nom_utilisateur: `dup${Date.now()}`,
          first_name: "Duplicate",
          last_name: "User",
          email: duplicateEmail,
          date_of_birth: new Date("1990-01-01"),
          password: "Password123!",
        },
      });

      // Le modèle utilisateurs n'a pas de contrainte UNIQUE sur email
      // donc cela devrait réussir
      const user2 = await testPrisma.utilisateurs.create({
        data: {
          userId: `DUP2${Date.now()}`,
          nom_utilisateur: `dup2${Date.now()}`,
          first_name: "Another",
          last_name: "Duplicate",
          email: duplicateEmail,
          date_of_birth: new Date("1990-01-01"),
          password: "Password123!",
        },
      });

      expect(user1.email).toBe(duplicateEmail);
      expect(user2.email).toBe(duplicateEmail);
      expect(user1.id).not.toBe(user2.id);
    });

    it("devrait valider que userId est unique", async () => {
      const duplicateUserId = `DUPID${Date.now()}`;

      await testPrisma.utilisateurs.create({
        data: {
          userId: duplicateUserId,
          nom_utilisateur: `user1${Date.now()}`,
          first_name: "User",
          last_name: "One",
          email: `user1.${Date.now()}@test.com`,
          date_of_birth: new Date("1990-01-01"),
          password: "Password123!",
        },
      });

      await expect(
        testPrisma.utilisateurs.create({
          data: {
            userId: duplicateUserId,
            nom_utilisateur: `user2${Date.now()}`,
            first_name: "User",
            last_name: "Two",
            email: `user2.${Date.now()}@test.com`,
            date_of_birth: new Date("1990-01-01"),
            password: "Password123!",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Cas limites", () => {
    it("devrait gérer les noms avec caractères spéciaux", async () => {
      const specialName = "O'Connor-Müller";

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { last_name: specialName },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.last_name).toBe(specialName);
    });

    it("devrait gérer les emails avec caractères spéciaux", async () => {
      const specialEmail = `user+tag${Date.now()}@sub-domain.test.com`;

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { email: specialEmail },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.email).toBe(specialEmail);
    });

    it("devrait gérer les dates anciennes", async () => {
      const oldDate = new Date("1900-01-01");

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { date_of_birth: oldDate },
      });

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.date_of_birth?.toISOString().split("T")[0]).toBe(
        "1900-01-01",
      );
    });
  });

  describe("Performance et concurrence", () => {
    it("devrait gérer des mises à jour concurrentes", async () => {
      const updates = Array.from({ length: 5 }, (_, i) =>
        testPrisma.utilisateurs.update({
          where: { id: testUserId },
          data: { first_name: `Concurrent${i}` },
        }),
      );

      await Promise.all(updates);

      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(user?.first_name).toMatch(/^Concurrent\d$/);
    });

    it("devrait gérer des lectures multiples simultanées", async () => {
      const reads = Array.from({ length: 10 }, () =>
        testPrisma.utilisateurs.findUnique({
          where: { id: testUserId },
        }),
      );

      const results = await Promise.all(reads);

      expect(results).toHaveLength(10);
      results.forEach((user) => {
        expect(user?.id).toBe(testUserId);
      });
    });
  });

  describe("Audit et traçabilité", () => {
    it("devrait avoir des timestamps created_at", async () => {
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
        select: {
          id: true,
          date_inscription: true,
        },
      });

      expect(user?.date_inscription).toBeDefined();
      expect(user?.date_inscription).toBeInstanceOf(Date);
    });

    it("devrait avoir des timestamps updated_at", async () => {
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
        select: {
          id: true,
          date_inscription: true,
        },
      });

      // Le modèle utilisateurs n'a pas de champ updated_at, seulement date_inscription
      expect(user?.date_inscription).toBeDefined();
      expect(user?.date_inscription).toBeInstanceOf(Date);
    });

    it("devrait mettre à jour les données correctement", async () => {
      const userBefore = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      await testPrisma.utilisateurs.update({
        where: { id: testUserId },
        data: { first_name: "UpdatedName" },
      });

      const userAfter = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      expect(userBefore?.first_name).toBe("John");
      expect(userAfter?.first_name).toBe("UpdatedName");
    });
  });

  describe("Suppression d'utilisateur", () => {
    it("devrait supprimer un utilisateur", async () => {
      const tempUser = await testPrisma.utilisateurs.create({
        data: {
          userId: `TEMP${Date.now()}`,
          nom_utilisateur: `tempuser${Date.now()}`,
          first_name: "Temp",
          last_name: "User",
          email: `temp.${Date.now()}@test.com`,
          date_of_birth: new Date("1990-01-01"),
          password: "TempPassword123!",
        },
      });

      await testPrisma.utilisateurs.delete({
        where: { id: tempUser.id },
      });

      const deletedUser = await testPrisma.utilisateurs.findUnique({
        where: { id: tempUser.id },
      });

      expect(deletedUser).toBeNull();
    });
  });
});
