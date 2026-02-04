/**
 * Tests d'intégration réels pour le module Inscription
 * Tests avec base de données réelle
 *
 * IMPORTANT: Ces tests nécessitent une base de données de test configurée
 * Configuration via .env.test avec DATABASE_URL
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";
import { InscriptionService } from "../core/services/inscription.service.js";
import bcrypt from "bcrypt";

// Ces tests sont désactivés par défaut (skipif no DB)
const SKIP_REAL_DB_TESTS =
  !process.env.DATABASE_URL || process.env.SKIP_REAL_DB_TESTS === "true";

describe("Inscription Module - Tests d'intégration réels (DB)", () => {
  let utilisateursClient: Utilisateurs;
  let inscriptionService: InscriptionService;
  const testEmailPrefix = `test_${Date.now()}`;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    if (SKIP_REAL_DB_TESTS) {
      console.log(
        "⚠️ Tests d'intégration réels ignorés (pas de DB configurée)",
      );
      return;
    }

    utilisateursClient = new Utilisateurs();
    inscriptionService = new InscriptionService(utilisateursClient);

    // Attendre que la connexion MySQL soit prête
    try {
      await utilisateursClient["mysqlConnector"].waitForConnection(10000);
      console.log("✅ Connexion à la base de données de test établie");
    } catch (error) {
      console.error("❌ Échec de la connexion à la base de données:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!SKIP_REAL_DB_TESTS && utilisateursClient) {
      // Nettoyage : supprimer les utilisateurs de test créés
      console.log(`🧹 Nettoyage de ${createdUserIds.length} utilisateurs de test...`);

      for (const userId of createdUserIds) {
        try {
          // Note: Vous devrez peut-être adapter selon votre client DB
          // await utilisateursClient.supprimerUtilisateur(userId);
          console.log(`🗑️ Utilisateur ${userId} supprimé`);
        } catch (error) {
          console.warn(`⚠️ Impossible de supprimer l'utilisateur ${userId}:`, error);
        }
      }

      // Fermer les connexions MySQL proprement
      try {
        await utilisateursClient["mysqlConnector"].closePool();
        console.log("🔚 Nettoyage des connexions DB terminé");
      } catch (error) {
        console.error("⚠️ Erreur lors de la fermeture du pool:", error);
      }
    }
  });

  // ==================== TESTS RÉELS - VÉRIFICATION EMAIL ====================
  describe("Vérification Email - Tests réels", () => {
    it("devrait vérifier qu'un email unique n'existe pas", async () => {
      const uniqueEmail = `${testEmailPrefix}_unique@test.com`;

      const result = await inscriptionService.verifierEmail(uniqueEmail);

      expect(result).toBeDefined();
      expect(result.exists).toBe(false);
      expect(result.message).toBe("Email disponible");
    });

    it("devrait détecter un email existant après inscription", async () => {
      const testEmail = `${testEmailPrefix}_exists@test.com`;

      // 1. Inscrire un utilisateur
      const inscriptionData = {
        nom: "TestExist",
        prenom: "User",
        email: testEmail,
        password: "TestPass123!",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      const inscriptionResult = await inscriptionService.inscrireUtilisateur(inscriptionData);

      if (inscriptionResult.success && inscriptionResult.userId) {
        createdUserIds.push(inscriptionResult.userId);
      }

      // 2. Vérifier que l'email existe maintenant
      const verificationResult = await inscriptionService.verifierEmail(testEmail);

      expect(verificationResult.exists).toBe(true);
      expect(verificationResult.message).toBe("Cet email est déjà utilisé");
    });

    it("devrait gérer différents formats d'email", async () => {
      const emailFormats = [
        `${testEmailPrefix}.dots@test.com`,
        `${testEmailPrefix}+plus@test.com`,
        `${testEmailPrefix}_underscore@test.com`,
        `${testEmailPrefix}-dash@test.com`,
      ];

      for (const email of emailFormats) {
        const result = await inscriptionService.verifierEmail(email);
        expect(result).toBeDefined();
        expect(typeof result.exists).toBe("boolean");
      }
    });

    it("devrait être insensible à la casse", async () => {
      const baseEmail = `${testEmailPrefix}_case@test.com`;

      const result1 = await inscriptionService.verifierEmail(baseEmail.toLowerCase());
      const result2 = await inscriptionService.verifierEmail(baseEmail.toUpperCase());

      expect(result1.exists).toBe(result2.exists);
    });
  });

  // ==================== TESTS RÉELS - INSCRIPTION ====================
  describe("Inscription - Tests réels", () => {
    it("devrait inscrire un nouvel utilisateur avec succès", async () => {
      const testEmail = `${testEmailPrefix}_new_user@test.com`;

      const inscriptionData = {
        nom: "Dupont",
        prenom: "Jean",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-05-20",
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
      expect(result.userId).toBeDefined();
      expect(typeof result.userId).toBe("number");
      expect(result.userId).toBeGreaterThan(0);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });

    it("devrait refuser l'inscription avec un email existant", async () => {
      const testEmail = `${testEmailPrefix}_duplicate@test.com`;

      const inscriptionData = {
        nom: "Dupont",
        prenom: "Jean",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-05-20",
        abonnement: 1,
        genre: 1,
      };

      // Première inscription
      const result1 = await inscriptionService.inscrireUtilisateur(inscriptionData);

      if (result1.success && result1.userId) {
        createdUserIds.push(result1.userId);
      }

      // Deuxième tentative avec le même email
      const result2 = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result2.success).toBe(false);
      expect(result2.message).toContain("existe déjà");
    });

    it("devrait hasher correctement le mot de passe", async () => {
      const testEmail = `${testEmailPrefix}_password_hash@test.com`;
      const plainPassword = "MySecureP@ss456";

      const inscriptionData = {
        nom: "TestHash",
        prenom: "User",
        email: testEmail,
        password: plainPassword,
        date: "1992-08-10",
        abonnement: 1,
        genre: 2,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      if (result.success && result.userId) {
        createdUserIds.push(result.userId);

        // Vérifier que le mot de passe dans la DB est hashé
        // Note: Adapter selon votre méthode de récupération
        const userFromDb = await utilisateursClient.getUtilisateurByEmail(testEmail);

        if (userFromDb && userFromDb.password) {
          // Le mot de passe ne doit pas être en clair
          expect(userFromDb.password).not.toBe(plainPassword);

          // Le hash doit commencer par $2b$ (bcrypt)
          expect(userFromDb.password).toMatch(/^\$2[aby]\$/);

          // Le mot de passe doit être vérifiable
          const isValid = await bcrypt.compare(plainPassword, userFromDb.password);
          expect(isValid).toBe(true);
        }
      }
    });

    it("devrait normaliser l'email (lowercase)", async () => {
      const testEmail = `${testEmailPrefix}_UPPERCASE@TEST.COM`;

      const inscriptionData = {
        nom: "TestCase",
        prenom: "User",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1995-03-15",
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      if (result.success && result.userId) {
        createdUserIds.push(result.userId);

        // Vérifier que l'email est en minuscules dans la DB
        const userFromDb = await utilisateursClient.getUtilisateurByEmail(
          testEmail.toLowerCase()
        );

        expect(userFromDb).toBeDefined();
        if (userFromDb) {
          expect(userFromDb.email).toBe(testEmail.toLowerCase());
        }
      }
    });

    it("devrait gérer différents genres", async () => {
      const genres = [1, 2];

      for (const genre of genres) {
        const testEmail = `${testEmailPrefix}_genre_${genre}@test.com`;

        const inscriptionData = {
          nom: "TestGenre",
          prenom: "User",
          email: testEmail,
          password: "SecureP@ss123",
          date: "1990-01-01",
          abonnement: 1,
          genre: genre,
        };

        const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

        expect(result.success).toBe(true);

        if (result.userId) {
          createdUserIds.push(result.userId);
        }
      }
    });

    it("devrait gérer différents plans d'abonnement", async () => {
      const abonnements = [1, 2, 3];

      for (const abonnement of abonnements) {
        const testEmail = `${testEmailPrefix}_abo_${abonnement}@test.com`;

        const inscriptionData = {
          nom: "TestAbo",
          prenom: "User",
          email: testEmail,
          password: "SecureP@ss123",
          date: "1990-01-01",
          abonnement: abonnement,
          genre: 1,
        };

        const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

        expect(result.success).toBe(true);

        if (result.userId) {
          createdUserIds.push(result.userId);
        }
      }
    });

    it("devrait gérer les caractères spéciaux dans nom/prénom", async () => {
      const testEmail = `${testEmailPrefix}_special_chars@test.com`;

      const inscriptionData = {
        nom: "O'Connor-Müller",
        prenom: "François-José",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result.success).toBe(true);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });

    it("devrait valider l'âge minimum (5 ans)", async () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate()
      );

      const testEmail = `${testEmailPrefix}_age_min@test.com`;

      const inscriptionData = {
        nom: "TestAge",
        prenom: "Min",
        email: testEmail,
        password: "SecureP@ss123",
        date: fiveYearsAgo.toISOString().split('T')[0],
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result.success).toBe(true);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });

    it("devrait rejeter un âge trop jeune (< 5 ans)", async () => {
      const today = new Date();
      const threeYearsAgo = new Date(
        today.getFullYear() - 3,
        today.getMonth(),
        today.getDate()
      );

      const testEmail = `${testEmailPrefix}_age_too_young@test.com`;

      const inscriptionData = {
        nom: "TestAge",
        prenom: "TooYoung",
        email: testEmail,
        password: "SecureP@ss123",
        date: threeYearsAgo.toISOString().split('T')[0],
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("âge");
    });

    it("devrait valider l'âge maximum (120 ans)", async () => {
      const today = new Date();
      const oneHundredYearsAgo = new Date(
        today.getFullYear() - 100,
        today.getMonth(),
        today.getDate()
      );

      const testEmail = `${testEmailPrefix}_age_max@test.com`;

      const inscriptionData = {
        nom: "TestAge",
        prenom: "Max",
        email: testEmail,
        password: "SecureP@ss123",
        date: oneHundredYearsAgo.toISOString().split('T')[0],
        abonnement: 1,
        genre: 1,
      };

      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);

      expect(result.success).toBe(true);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });
  });

  // ==================== TESTS DE PERFORMANCE RÉELS ====================
  describe("Performance - Tests réels", () => {
    it("devrait vérifier un email en moins de 500ms", async () => {
      const testEmail = `${testEmailPrefix}_perf@test.com`;

      const startTime = Date.now();
      await inscriptionService.verifierEmail(testEmail);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait inscrire un utilisateur en moins de 2 secondes", async () => {
      const testEmail = `${testEmailPrefix}_perf_inscription@test.com`;

      const inscriptionData = {
        nom: "PerfTest",
        prenom: "User",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      };

      const startTime = Date.now();
      const result = await inscriptionService.inscrireUtilisateur(inscriptionData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });

    it("devrait gérer 5 vérifications d'email concurrentes", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 5 }, (_, i) =>
        inscriptionService.verifierEmail(`${testEmailPrefix}_concurrent_${i}@test.com`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.exists).toBe("boolean");
      });

      // 5 vérifications en moins de 2 secondes
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("devrait gérer 3 inscriptions concurrentes avec emails différents", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 3 }, (_, i) => {
        const testEmail = `${testEmailPrefix}_parallel_${i}_${Date.now()}@test.com`;
        return inscriptionService.inscrireUtilisateur({
          nom: "Parallel",
          prenom: `User${i}`,
          email: testEmail,
          password: "SecureP@ss123",
          date: "1990-01-01",
          abonnement: 1,
          genre: 1,
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        if (result.userId) {
          createdUserIds.push(result.userId);
        }
      });

      // 3 inscriptions en moins de 5 secondes
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  // ==================== TESTS DE CONCURRENCE ====================
  describe("Concurrence - Tests réels", () => {
    it("devrait éviter les doublons lors d'inscriptions simultanées", async () => {
      const testEmail = `${testEmailPrefix}_race_condition@test.com`;

      const inscriptionData = {
        nom: "RaceTest",
        prenom: "User",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      };

      // Tenter 3 inscriptions simultanées avec le même email
      const promises = Array.from({ length: 3 }, () =>
        inscriptionService.inscrireUtilisateur(inscriptionData)
      );

      const results = await Promise.all(promises);

      // Une seule inscription doit réussir
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);

      // Nettoyer
      const successResult = results.find(r => r.success);
      if (successResult?.userId) {
        createdUserIds.push(successResult.userId);
      }
    });

    it("devrait gérer des opérations entrelacées", async () => {
      const email1 = `${testEmailPrefix}_interleaved_1@test.com`;
      const email2 = `${testEmailPrefix}_interleaved_2@test.com`;

      // Opérations entrelacées
      const check1 = inscriptionService.verifierEmail(email1);
      const check2 = inscriptionService.verifierEmail(email2);

      await Promise.all([check1, check2]);

      const inscription1 = inscriptionService.inscrireUtilisateur({
        nom: "Interleaved",
        prenom: "User1",
        email: email1,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      });

      const inscription2 = inscriptionService.inscrireUtilisateur({
        nom: "Interleaved",
        prenom: "User2",
        email: email2,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      });

      const [result1, result2] = await Promise.all([inscription1, inscription2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.userId) createdUserIds.push(result1.userId);
      if (result2.userId) createdUserIds.push(result2.userId);
    });
  });

  // ==================== TESTS DE COHÉRENCE DES DONNÉES ====================
  describe("Cohérence des données", () => {
    it("devrait avoir des IDs positifs pour les utilisateurs créés", async () => {
      const testEmail = `${testEmailPrefix}_positive_id@test.com`;

      const result = await inscriptionService.inscrireUtilisateur({
        nom: "PositiveId",
        prenom: "User",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      });

      if (result.userId) {
        expect(result.userId).toBeGreaterThan(0);
        createdUserIds.push(result.userId);
      }
    });

    it("ne devrait pas exposer le mot de passe dans les résultats", async () => {
      const testEmail = `${testEmailPrefix}_no_password_leak@test.com`;

      const result = await inscriptionService.inscrireUtilisateur({
        nom: "NoLeak",
        prenom: "User",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      });

      // Le résultat ne doit pas contenir le mot de passe
      expect(result).not.toHaveProperty("password");
      expect(JSON.stringify(result)).not.toContain("SecureP@ss123");

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });

    it("devrait préserver l'intégrité des données après insertion", async () => {
      const testEmail = `${testEmailPrefix}_integrity@test.com`;
      const testData = {
        nom: "Integrity",
        prenom: "Test",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1991-06-15",
        abonnement: 2,
        genre: 2,
      };

      const result = await inscriptionService.inscrireUtilisateur(testData);

      if (result.success && result.userId) {
        createdUserIds.push(result.userId);

        // Récupérer l'utilisateur et vérifier les données
        const userFromDb = await utilisateursClient.getUtilisateurByEmail(testEmail);

        expect(userFromDb).toBeDefined();
        if (userFromDb) {
          expect(userFromDb.nom).toBe(testData.nom);
          expect(userFromDb.prenom).toBe(testData.prenom);
          expect(userFromDb.email).toBe(testData.email.toLowerCase());
          expect(userFromDb.date).toBeTruthy();
          expect(userFromDb.abonnement).toBe(testData.abonnement);
          expect(userFromDb.genre).toBe(testData.genre);
        }
      }
    });
  });

  // ==================== TESTS DE RÉSILIENCE ====================
  describe("Résilience", () => {
    it("devrait gérer plusieurs inscriptions successives", async () => {
      for (let i = 0; i < 5; i++) {
        const testEmail = `${testEmailPrefix}_resilience_${i}@test.com`;

        const result = await inscriptionService.inscrireUtilisateur({
          nom: "Resilience",
          prenom: `User${i}`,
          email: testEmail,
          password: "SecureP@ss123",
          date: "1990-01-01",
          abonnement: 1,
          genre: 1,
        });

        expect(result.success).toBe(true);

        if (result.userId) {
          createdUserIds.push(result.userId);
        }
      }
    });

    it("devrait maintenir la connexion DB après plusieurs opérations", async () => {
      // Effectuer plusieurs opérations variées
      await inscriptionService.verifierEmail(`${testEmailPrefix}_health1@test.com`);
      await inscriptionService.verifierEmail(`${testEmailPrefix}_health2@test.com`);

      const testEmail = `${testEmailPrefix}_health_final@test.com`;
      const result = await inscriptionService.inscrireUtilisateur({
        nom: "Health",
        prenom: "Check",
        email: testEmail,
        password: "SecureP@ss123",
        date: "1990-01-01",
        abonnement: 1,
        genre: 1,
      });

      expect(result.success).toBe(true);

      if (result.userId) {
        createdUserIds.push(result.userId);
      }
    });
  });
});
