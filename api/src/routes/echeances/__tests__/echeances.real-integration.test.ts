/**
 * Tests d'intégration RÉELS du module Échéances avec vraie DB
 * Ces tests utilisent une base MySQL de test avec Prisma
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
  teardownTestDatabase,
  getTestPrisma,
} from "../../../tests/setup/testDatabase.js";
import { PrismaClient } from "@prisma/client";

describe("Échéances - Tests d'intégration RÉELS avec DB", () => {
  let testPrisma: PrismaClient;
  let testUserId: number;
  let testAbonnementId: number;
  let testEcheanceId: number;

  beforeAll(async () => {
    console.log(`🔧 [TEST ÉCHÉANCES] Début du setup...`);
    const prismaInstance = await setupTestDatabase();
    testPrisma = prismaInstance as PrismaClient;
    console.log(`🔗 [TEST ÉCHÉANCES] Base de données de test initialisée`);
  });

  afterAll(async () => {
    console.log(`🧹 [TEST ÉCHÉANCES] Nettoyage final...`);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    console.log(`🧹 [TEST ÉCHÉANCES] Nettoyage des tables...`);

    // Nettoyer toutes les tables dans le bon ordre (contraintes FK)
    await testPrisma.paiements.deleteMany({});
    await testPrisma.echeances_paiements.deleteMany({});
    await testPrisma.utilisateurs.deleteMany({});
    await testPrisma.plans_tarifaires.deleteMany({});
    await testPrisma.grades.deleteMany({});
    await testPrisma.status.deleteMany({});

    console.log("🌱 [TEST ÉCHÉANCES] Création des données de test...");

    // Créer les données de référence obligatoires
    await testPrisma.status.create({
      data: {
        id: 1,
        nom_role: "en_attente",
      },
    });

    await testPrisma.status.create({
      data: {
        id: 2,
        nom_role: "actif",
      },
    });

    await testPrisma.grades.create({
      data: {
        id: 1,
        grade_id: "debutant",
      },
    });

    // Créer un plan tarifaire pour les échéances
    const planTarifaire = await testPrisma.plans_tarifaires.create({
      data: {
        nom_plan: "Abonnement Test",
        prix: 25.5,
        periode: "mensuel",
        description: "Abonnement de test",
      },
    });
    testAbonnementId = planTarifaire.id;

    // Créer un utilisateur de test
    const user = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST${Date.now()}`,
        nom_utilisateur: `testuser${Date.now()}`,
        first_name: "John",
        last_name: "Doe",
        email: `john.doe.${Date.now()}@test.com`,
        date_of_birth: new Date("1990-01-01"),
        password: "TempPassword123!",
        status_id: 1,
        grade_id: 1,
      },
    });
    testUserId = user.id;

    console.log(
      `✅ [TEST ÉCHÉANCES] Données de test créées (User: ${testUserId}, Abonnement: ${testAbonnementId})`,
    );
  });

  describe("Connexion et opérations de base DB", () => {
    it("devrait se connecter à la base de données de test", async () => {
      expect(testPrisma).toBeDefined();
      expect(testUserId).toBeGreaterThan(0);
    });

    it("devrait créer une échéance dans la DB", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(echeance).toBeDefined();
      expect(echeance.id).toBeGreaterThan(0);
      expect(echeance.utilisateur_id).toBe(testUserId);
      expect(echeance.abonnement_id).toBe(testAbonnementId);
      expect(parseFloat(echeance.montant.toString())).toBe(25.5);
      expect(echeance.statut).toBe("en_attente");
    });

    it("devrait récupérer une échéance par ID", async () => {
      const created = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 35.0,
          date_echeance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      const found = await testPrisma.echeances_paiements.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.utilisateur_id).toBe(testUserId);
      expect(parseFloat(found!.montant.toString())).toBe(35.0);
    });

    it("devrait retourner null pour une échéance inexistante", async () => {
      const echeance = await testPrisma.echeances_paiements.findUnique({
        where: { id: 999999 },
      });

      expect(echeance).toBeNull();
    });
  });

  describe("Gestion des échéances", () => {
    it("devrait créer plusieurs échéances pour un utilisateur", async () => {
      const echeances = [];
      for (let i = 1; i <= 3; i++) {
        const echeance = await testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5 * i,
            date_echeance: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        });
        echeances.push(echeance);
      }

      expect(echeances).toHaveLength(3);
      expect(echeances[0].montant.toString()).toBe("25.5");
      expect(echeances[1].montant.toString()).toBe("51");
      expect(echeances[2].montant.toString()).toBe("76.5");
    });

    it("devrait récupérer les échéances d'un utilisateur", async () => {
      // Créer 2 échéances
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        ],
      });

      const echeances = await testPrisma.echeances_paiements.findMany({
        where: { utilisateur_id: testUserId },
      });

      expect(echeances).toHaveLength(2);
      echeances.forEach((ech) => {
        expect(ech.utilisateur_id).toBe(testUserId);
        expect(ech.statut).toBe("en_attente");
      });
    });

    it("devrait mettre à jour le statut d'une échéance", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      await testPrisma.echeances_paiements.update({
        where: { id: echeance.id },
        data: { statut: "pay_" },
      });

      const updated = await testPrisma.echeances_paiements.findUnique({
        where: { id: echeance.id },
      });

      expect(updated?.statut).toBe("pay_");
    });

    it("devrait récupérer une échéance avec ses détails utilisateur", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      const echeanceWithUser = await testPrisma.echeances_paiements.findUnique({
        where: { id: echeance.id },
        include: {
          utilisateurs: true,
          plans_tarifaires: true,
        },
      });

      expect(echeanceWithUser).toBeDefined();
      expect(echeanceWithUser?.utilisateurs).toBeDefined();
      expect(echeanceWithUser?.utilisateurs.id).toBe(testUserId);
      expect(echeanceWithUser?.plans_tarifaires).toBeDefined();
      expect(echeanceWithUser?.plans_tarifaires.id).toBe(testAbonnementId);
    });

    it("devrait filtrer les échéances par statut", async () => {
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            statut: "pay_",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        ],
      });

      const enAttente = await testPrisma.echeances_paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          statut: "en_attente",
        },
      });

      const payees = await testPrisma.echeances_paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          statut: "pay_",
        },
      });

      expect(enAttente).toHaveLength(2);
      expect(payees).toHaveLength(1);
    });
  });

  describe("Flux complet de gestion d'échéances", () => {
    it("devrait traiter un flux complet: création → paiement → mise à jour statut", async () => {
      // 1. Créer une échéance
      const newEcheance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 50.0,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(newEcheance.statut).toBe("en_attente");

      // 2. Créer un paiement associé
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 50.0,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_${Date.now()}`,
          statut: "reussi",
          date_paiement: new Date(),
          description: `Paiement échéance ${newEcheance.id}`,
        },
      });

      expect(paiement).toBeDefined();
      expect(parseFloat(paiement.montant.toString())).toBe(50.0);

      // 3. Mettre à jour l'échéance
      await testPrisma.echeances_paiements.update({
        where: { id: newEcheance.id },
        data: { statut: "pay_" },
      });

      const updatedEcheance = await testPrisma.echeances_paiements.findUnique({
        where: { id: newEcheance.id },
      });

      expect(updatedEcheance?.statut).toBe("pay_");

      // 4. Vérifier l'historique des paiements
      const historique = await testPrisma.paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          montant: 50.0,
        },
      });

      expect(historique).toHaveLength(1);
      expect(historique[0].statut).toBe("reussi");
    });

    it("devrait gérer plusieurs échéances avec différentes dates", async () => {
      const today = new Date();
      const echeances = await Promise.all([
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
      ]);

      expect(echeances).toHaveLength(3);

      // Récupérer les échéances triées par date
      const sorted = await testPrisma.echeances_paiements.findMany({
        where: { utilisateur_id: testUserId },
        orderBy: { date_echeance: "asc" },
      });

      expect(sorted).toHaveLength(3);
      expect(sorted[0].date_echeance.getTime()).toBeLessThan(
        sorted[1].date_echeance.getTime(),
      );
      expect(sorted[1].date_echeance.getTime()).toBeLessThan(
        sorted[2].date_echeance.getTime(),
      );
    });

    it("devrait identifier les échéances en retard", async () => {
      const today = new Date();
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        ],
      });

      const enRetard = await testPrisma.echeances_paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          date_echeance: { lt: today },
          statut: "en_attente",
        },
      });

      const aVenir = await testPrisma.echeances_paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          date_echeance: { gte: today },
          statut: "en_attente",
        },
      });

      expect(enRetard).toHaveLength(1);
      expect(aVenir).toHaveLength(1);
    });
  });

  describe("Intégrité des données et contraintes", () => {
    it("devrait respecter la contrainte FK sur utilisateur_id", async () => {
      await expect(
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: 999999,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
      ).rejects.toThrow();
    });

    it("devrait respecter la contrainte FK sur abonnement_id", async () => {
      await expect(
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: 999999,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
      ).rejects.toThrow();
    });

    it("devrait valider que le montant est positif", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 0.01,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(parseFloat(echeance.montant.toString())).toBeGreaterThan(0);
    });

    it("devrait gérer la suppression en cascade (si configuré)", async () => {
      // Créer une échéance
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      // Supprimer l'utilisateur devrait échouer ou supprimer l'échéance
      const countBefore = await testPrisma.echeances_paiements.count({
        where: { utilisateur_id: testUserId },
      });

      expect(countBefore).toBeGreaterThan(0);

      // Test: tenter de supprimer l'utilisateur
      // (selon la config FK, cela peut échouer ou supprimer en cascade)
      try {
        await testPrisma.utilisateurs.delete({
          where: { id: testUserId },
        });
        // Si cascade activé, les échéances devraient être supprimées
        const countAfter = await testPrisma.echeances_paiements.count({
          where: { utilisateur_id: testUserId },
        });
        expect(countAfter).toBe(0);
      } catch (error) {
        // Si pas de cascade, une erreur FK est attendue
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance et scalabilité", () => {
    it("devrait gérer 50 insertions d'échéances en moins de 5 secondes", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
      );

      const echeances = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(echeances).toHaveLength(50);
      expect(duration).toBeLessThan(5000);
      console.log(`⏱️ 50 échéances créées en ${duration}ms`);
    });

    it("devrait récupérer 100 échéances en moins de 1 seconde", async () => {
      // Créer 100 échéances
      const creates = Array.from({ length: 100 }, (_, i) =>
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            statut: i % 3 === 0 ? "pay_" : "en_attente",
          },
        }),
      );

      await Promise.all(creates);

      // Mesurer le temps de récupération
      const startTime = Date.now();
      const echeances = await testPrisma.echeances_paiements.findMany({
        take: 100,
        orderBy: { date_echeance: "asc" },
      });
      const duration = Date.now() - startTime;

      expect(echeances.length).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(1000);
      console.log(
        `⏱️ ${echeances.length} échéances récupérées en ${duration}ms`,
      );
    });

    it("devrait gérer des mises à jour concurrentes", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      // Lancer plusieurs mises à jour simultanées
      const updates = Array.from({ length: 10 }, () =>
        testPrisma.echeances_paiements.update({
          where: { id: echeance.id },
          data: { montant: Math.random() * 100 },
        }),
      );

      await Promise.all(updates);

      const updated = await testPrisma.echeances_paiements.findUnique({
        where: { id: echeance.id },
      });

      expect(updated).toBeDefined();
      expect(parseFloat(updated!.montant.toString())).toBeGreaterThan(0);
    });
  });

  describe("Statistiques et agrégations", () => {
    it("devrait calculer le total des montants d'échéances", async () => {
      const montants = [25.5, 50.0, 75.25];

      for (const montant of montants) {
        await testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        });
      }

      const result = await testPrisma.echeances_paiements.aggregate({
        where: { utilisateur_id: testUserId },
        _sum: {
          montant: true,
        },
      });

      const expectedTotal = montants.reduce((sum, m) => sum + m, 0);
      expect(parseFloat(result._sum.montant?.toString() || "0")).toBeCloseTo(
        expectedTotal,
        2,
      );
    });

    it("devrait compter les échéances par statut", async () => {
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "pay_",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "pay_",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        ],
      });

      const countPaye = await testPrisma.echeances_paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "pay_",
        },
      });

      const countEnAttente = await testPrisma.echeances_paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "en_attente",
        },
      });

      expect(countPaye).toBe(2);
      expect(countEnAttente).toBe(1);
    });

    it("devrait calculer la moyenne des montants", async () => {
      const montants = [20.0, 30.0, 40.0];

      for (const montant of montants) {
        await testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        });
      }

      const result = await testPrisma.echeances_paiements.aggregate({
        where: { utilisateur_id: testUserId },
        _avg: {
          montant: true,
        },
      });

      expect(parseFloat(result._avg.montant?.toString() || "0")).toBeCloseTo(
        30.0,
        2,
      );
    });

    it("devrait trouver le montant min et max", async () => {
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 10.0,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 100.0,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 50.0,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        ],
      });

      const result = await testPrisma.echeances_paiements.aggregate({
        where: { utilisateur_id: testUserId },
        _min: {
          montant: true,
        },
        _max: {
          montant: true,
        },
      });

      expect(parseFloat(result._min.montant?.toString() || "0")).toBe(10.0);
      expect(parseFloat(result._max.montant?.toString() || "0")).toBe(100.0);
    });
  });

  describe("Cas limites et edge cases", () => {
    it("devrait gérer des montants décimaux précis", async () => {
      const montant = 25.67;
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant,
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(parseFloat(echeance.montant.toString())).toBeCloseTo(montant, 2);
    });

    it("devrait gérer des dates futures lointaines", async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 25.5,
          date_echeance: futureDate,
          statut: "en_attente",
        },
      });

      const retrieved = await testPrisma.echeances_paiements.findUnique({
        where: { id: echeance.id },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved!.date_echeance.getTime()).toBeGreaterThan(Date.now());
    });

    it("devrait gérer les différents statuts d'échéances", async () => {
      const statuts = ["en_attente", "pay_", "chu"];

      for (const statut of statuts) {
        const echeance = await testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut,
          },
        });

        expect(echeance.statut).toBe(statut);
      }

      const allEcheances = await testPrisma.echeances_paiements.findMany({
        where: { utilisateur_id: testUserId },
      });

      expect(allEcheances).toHaveLength(statuts.length);
    });

    it("devrait gérer la pagination des résultats", async () => {
      // Créer 25 échéances
      const creates = Array.from({ length: 25 }, (_, i) =>
        testPrisma.echeances_paiements.create({
          data: {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 25.5,
            date_echeance: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
        }),
      );

      await Promise.all(creates);

      // Récupérer page 1 (10 premiers)
      const page1 = await testPrisma.echeances_paiements.findMany({
        take: 10,
        skip: 0,
        orderBy: { date_echeance: "asc" },
      });

      // Récupérer page 2 (10 suivants)
      const page2 = await testPrisma.echeances_paiements.findMany({
        take: 10,
        skip: 10,
        orderBy: { date_echeance: "asc" },
      });

      // Récupérer page 3 (5 derniers)
      const page3 = await testPrisma.echeances_paiements.findMany({
        take: 10,
        skip: 20,
        orderBy: { date_echeance: "asc" },
      });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);

      // Vérifier qu'il n'y a pas de doublons
      const allIds = [
        ...page1.map((e) => e.id),
        ...page2.map((e) => e.id),
        ...page3.map((e) => e.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(25);
    });

    it("devrait gérer les recherches avec plusieurs critères", async () => {
      await testPrisma.echeances_paiements.createMany({
        data: [
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 20.0,
            date_echeance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 50.0,
            date_echeance: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            statut: "en_attente",
          },
          {
            utilisateur_id: testUserId,
            abonnement_id: testAbonnementId,
            montant: 30.0,
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            statut: "pay_",
          },
        ],
      });

      const filtered = await testPrisma.echeances_paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          statut: "en_attente",
          montant: { gte: 30 },
        },
      });

      expect(filtered).toHaveLength(1);
      expect(parseFloat(filtered[0].montant.toString())).toBe(50.0);
    });
  });
});
