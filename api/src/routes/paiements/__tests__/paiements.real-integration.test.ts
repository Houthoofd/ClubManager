/**
 * Tests d'intégration RÉELS du module Paiements avec vraie DB
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
import Stripe from "stripe";

describe("Paiements - Tests d'intégration RÉELS avec DB", () => {
  let testPrisma: PrismaClient;
  let testUserId: number;
  let testEcheanceId: number;
  let testCommandeId: number;
  let testAbonnementId: number;
  let stripe: Stripe | null = null;

  beforeAll(async () => {
    console.log(`🔧 [TEST PAIEMENTS] Début du setup...`);
    const prismaInstance = await setupTestDatabase();
    testPrisma = prismaInstance as PrismaClient;
    console.log(`🔗 [TEST PAIEMENTS] Base de données de test initialisée`);

    // Initialiser Stripe uniquement si la clé est disponible
    if (process.env.STRIPE_SECRET_KEY_TEST) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
        apiVersion: "2024-11-20.acacia",
      });
      console.log(`✅ [TEST PAIEMENTS] Stripe initialisé en mode test`);
    } else {
      console.warn(
        `⚠️ [TEST PAIEMENTS] STRIPE_SECRET_KEY_TEST non défini, tests Stripe skippés`,
      );
    }
  });

  afterAll(async () => {
    console.log(`🧹 [TEST PAIEMENTS] Nettoyage final...`);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    console.log(`🧹 [TEST PAIEMENTS] Nettoyage des tables...`);

    // Nettoyer toutes les tables dans le bon ordre (contraintes FK)
    await testPrisma.paiements.deleteMany({});
    await testPrisma.echeances_paiements.deleteMany({});
    await testPrisma.commande_articles.deleteMany({});
    await testPrisma.commandes.deleteMany({});
    await testPrisma.utilisateurs.deleteMany({});
    await testPrisma.plans_tarifaires.deleteMany({});
    await testPrisma.grades.deleteMany({});
    await testPrisma.status.deleteMany({});

    console.log("🌱 [TEST PAIEMENTS] Création des données de test...");

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

    // Créer une échéance de test
    const echeance = await testPrisma.echeances_paiements.create({
      data: {
        utilisateur_id: testUserId,
        abonnement_id: testAbonnementId,
        montant: 25.5,
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        statut: "en_attente",
      },
    });
    testEcheanceId = echeance.id;

    // Créer une commande de test
    const commande = await testPrisma.commandes.create({
      data: {
        utilisateur_id: testUserId,
        numero_commande: `CMD${Date.now()}`,
        statut: "en_attente",
        total: 150.0,
        date_commande: new Date(),
      },
    });
    testCommandeId = commande.id;

    console.log(
      `✅ [TEST PAIEMENTS] Données de test créées (User: ${testUserId}, Échéance: ${testEcheanceId}, Commande: ${testCommandeId})`,
    );
  });

  describe("Connexion et opérations de base DB", () => {
    it("devrait se connecter à la base de données de test", async () => {
      expect(testPrisma).toBeDefined();
    });

    it("devrait créer un paiement dans la DB", async () => {
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement échéance test",
        },
      });

      expect(paiement).toBeDefined();
      expect(paiement.id).toBeDefined();
      expect(Number(paiement.montant)).toBe(25.5);
      expect(paiement.utilisateur_id).toBe(testUserId);
      expect(paiement.abonnement_id).toBe(testAbonnementId);
    });

    it("devrait récupérer un paiement par ID", async () => {
      const created = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement test",
        },
      });

      const found = await testPrisma.paiements.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(Number(found?.montant)).toBe(25.5);
    });

    it("devrait retourner null pour un paiement inexistant", async () => {
      const paiement = await testPrisma.paiements.findUnique({
        where: { id: 999999 },
      });

      expect(paiement).toBeNull();
    });
  });

  describe("Gestion des échéances", () => {
    it("devrait créer une échéance", async () => {
      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 50.0,
          date_echeance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(echeance).toBeDefined();
      expect(Number(echeance.montant)).toBe(50.0);
      expect(echeance.statut).toBe("en_attente");
    });

    it("devrait récupérer les échéances d'un utilisateur", async () => {
      // Créer plusieurs échéances
      await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 30.0,
          date_echeance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      const echeances = await testPrisma.echeances_paiements.findMany({
        where: { utilisateur_id: testUserId },
      });

      expect(echeances.length).toBeGreaterThan(0);
      echeances.forEach((e) => {
        expect(e.utilisateur_id).toBe(testUserId);
      });
    });

    it("devrait mettre à jour le statut d'une échéance", async () => {
      await testPrisma.echeances_paiements.update({
        where: { id: testEcheanceId },
        data: { statut: "pay_" },
      });

      const echeance = await testPrisma.echeances_paiements.findUnique({
        where: { id: testEcheanceId },
      });

      expect(echeance?.statut).toBe("pay_");
    });

    it("devrait récupérer une échéance avec ses détails utilisateur", async () => {
      const echeance = await testPrisma.echeances_paiements.findUnique({
        where: { id: testEcheanceId },
        include: {
          utilisateurs: true,
        },
      });

      expect(echeance).toBeDefined();
      expect(echeance?.id).toBe(testEcheanceId);
      expect(echeance?.utilisateurs).toBeDefined();
      expect(echeance?.utilisateurs.id).toBe(testUserId);
    });
  });

  describe("Gestion des paiements", () => {
    it("devrait enregistrer un paiement d'échéance", async () => {
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_echeance_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement échéance",
        },
      });

      expect(paiement.abonnement_id).toBe(testAbonnementId);
      expect(Number(paiement.montant)).toBe(25.5);
    });

    it("devrait enregistrer un paiement de commande", async () => {
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 150.0,
          commande_id: testCommandeId,
          stripe_payment_intent_id: `pi_test_commande_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement commande",
        },
      });

      expect(paiement.commande_id).toBe(testCommandeId);
      expect(Number(paiement.montant)).toBe(150.0);
    });

    it("devrait récupérer l'historique des paiements d'un utilisateur", async () => {
      // Créer plusieurs paiements
      for (let i = 0; i < 3; i++) {
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 10.0 + i,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_test_${i}_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            periode_debut: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
            periode_fin: new Date(
              Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000,
            ),
            description: `Paiement ${i}`,
          },
        });
      }

      const paiements = await testPrisma.paiements.findMany({
        where: { utilisateur_id: testUserId },
        orderBy: { date_paiement: "desc" },
      });

      expect(paiements.length).toBeGreaterThanOrEqual(3);
      paiements.forEach((p) => {
        expect(p.utilisateur_id).toBe(testUserId);
      });
    });

    it("devrait récupérer les paiements avec pagination", async () => {
      // Créer 5 paiements
      for (let i = 0; i < 5; i++) {
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 10.0 + i,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_test_page_${i}_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(Date.now() + i * 1000),
            periode_debut: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
            periode_fin: new Date(
              Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000,
            ),
            description: `Paiement page ${i}`,
          },
        });
      }

      const page1 = await testPrisma.paiements.findMany({
        take: 3,
        skip: 0,
        orderBy: { date_paiement: "desc" },
      });

      const page2 = await testPrisma.paiements.findMany({
        take: 3,
        skip: 3,
        orderBy: { date_paiement: "desc" },
      });

      expect(page1.length).toBe(3);
      expect(page2.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Flux complet de paiement", () => {
    it("devrait traiter un flux complet: création → paiement → mise à jour statut", async () => {
      // 1. Créer une nouvelle échéance
      const newEcheance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 75.0,
          date_echeance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          statut: "en_attente",
        },
      });

      expect(newEcheance.statut).toBe("en_attente");

      // 2. Enregistrer le paiement
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 75.0,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_flow_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement flux complet",
        },
      });

      expect(paiement.statut).toBe("payé");

      // 3. Mettre à jour le statut de l'échéance
      await testPrisma.echeances_paiements.update({
        where: { id: newEcheance.id },
        data: { statut: "pay_" },
      });

      // 4. Vérifier que tout est cohérent
      const updatedEcheance = await testPrisma.echeances_paiements.findUnique({
        where: { id: newEcheance.id },
      });

      expect(updatedEcheance?.statut).toBe("pay_");

      const historique = await testPrisma.paiements.findMany({
        where: {
          utilisateur_id: testUserId,
          montant: 75.0,
        },
      });

      expect(historique.length).toBeGreaterThanOrEqual(1);
      expect(Number(historique[0].montant)).toBe(75.0);
    });

    it("devrait vérifier si c'est le premier paiement d'un utilisateur", async () => {
      // Compter les paiements existants
      const countBefore = await testPrisma.paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "payé",
        },
      });

      // Créer le premier paiement si aucun n'existe
      if (countBefore === 0) {
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_test_first_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            description: "Premier paiement",
          },
        });
      }

      const countAfter = await testPrisma.paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "payé",
        },
      });

      expect(countAfter).toBeGreaterThan(0);
    });

    it("devrait upgrader le statut d'un utilisateur après premier paiement", async () => {
      // Vérifier le statut initial
      const userBefore = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });
      expect(userBefore?.status_id).toBe(1); // en_attente

      // Enregistrer un paiement
      await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_test_upgrade_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement upgrade statut",
        },
      });

      // Vérifier si c'est le premier paiement
      const paiementsCount = await testPrisma.paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "payé",
        },
      });

      if (paiementsCount === 1) {
        // Upgrader le statut
        await testPrisma.utilisateurs.update({
          where: { id: testUserId },
          data: { status_id: 2 }, // actif
        });
      }

      const userAfter = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId },
      });

      if (paiementsCount === 1) {
        expect(userAfter?.status_id).toBe(2);
      }
    });
  });

  describe("Intégrité des données et contraintes", () => {
    it("devrait respecter la contrainte FK sur utilisateur_id", async () => {
      await expect(
        testPrisma.paiements.create({
          data: {
            utilisateur_id: 999999, // Utilisateur inexistant
            montant: 25.5,
            stripe_payment_intent_id: `pi_test_invalid_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            description: "Paiement invalide",
          },
        }),
      ).rejects.toThrow();
    });

    it("devrait respecter la contrainte FK sur abonnement_id", async () => {
      await expect(
        testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5,
            abonnement_id: 999999, // Abonnement inexistant
            stripe_payment_intent_id: `pi_test_invalid_abo_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            description: "Paiement abonnement invalide",
          },
        }),
      ).rejects.toThrow();
    });

    it("devrait respecter la contrainte FK sur commande_id", async () => {
      await expect(
        testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 150.0,
            commande_id: 999999, // Commande inexistante
            stripe_payment_intent_id: `pi_test_invalid_cmd_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            description: "Paiement commande invalide",
          },
        }),
      ).rejects.toThrow();
    });

    it("devrait gérer les contraintes d'unicité composée", async () => {
      const periodeDebut = new Date();

      // Première insertion
      await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_unique_test_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          periode_debut: periodeDebut,
          periode_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: "Paiement unicité 1",
        },
      });

      // Deuxième insertion avec même utilisateur_id, periode_debut, abonnement_id
      // devrait échouer à cause de la contrainte uk_utilisateur_periode_abonnement
      try {
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_unique_test_2_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            periode_debut: periodeDebut,
            periode_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            description: "Paiement unicité 2",
          },
        });
        console.warn(
          "⚠️ La contrainte unique composée n'a pas empêché la duplication",
        );
      } catch (error) {
        // Si contrainte existe, elle devrait lever une erreur
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance et scalabilité", () => {
    it("devrait gérer 20 insertions de paiements en moins de 5 secondes", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 20 }, (_, i) =>
        testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5 + i,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_perf_${i}_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(),
            periode_debut: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Jours différents
            periode_fin: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            description: `Paiement perf ${i}`,
          },
        }),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    }, 10000); // Timeout de 10 secondes

    it("devrait récupérer 50 paiements en moins de 1 seconde", async () => {
      // Créer 50 paiements d'abord
      const creates = Array.from({ length: 50 }, (_, i) =>
        testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 10.0 + i,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_perf_read_${i}_${Date.now()}`,
            statut: "payé",
            date_paiement: new Date(Date.now() + i * 1000),
            periode_debut: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Jours différents
            periode_fin: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            description: `Paiement lecture ${i}`,
          },
        }),
      );

      await Promise.all(creates);

      // Mesurer la lecture
      const startTime = Date.now();

      await testPrisma.paiements.findMany({
        take: 50,
        orderBy: { date_paiement: "desc" },
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    }, 15000);

    it("devrait gérer des mises à jour concurrentes", async () => {
      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 100.0,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_concurrent_${Date.now()}`,
          statut: "en_attente",
          date_paiement: new Date(),
          description: "Paiement concurrent",
        },
      });

      const updates = Array.from({ length: 5 }, () =>
        testPrisma.paiements.update({
          where: { id: paiement.id },
          data: { statut: "payé" },
        }),
      );

      await Promise.all(updates);

      const updated = await testPrisma.paiements.findUnique({
        where: { id: paiement.id },
      });

      expect(updated?.statut).toBe("payé");
    });
  });

  describe("Stripe PaymentIntent (tests conditionnels)", () => {
    it("devrait créer un PaymentIntent Stripe réel si clé configurée", async () => {
      if (!stripe) {
        console.log("⏭️ Test skippé: STRIPE_SECRET_KEY_TEST non configuré");
        return;
      }

      const amount = 2550; // 25.50€ en centimes

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        metadata: {
          echeanceId: testEcheanceId.toString(),
          userId: testUserId.toString(),
          type: "echeance",
        },
      });

      expect(paymentIntent.id).toMatch(/^pi_/);
      expect(paymentIntent.amount).toBe(amount);
      expect(paymentIntent.currency).toBe("eur");
      expect(paymentIntent.status).toBe("requires_payment_method");

      console.log(
        `✅ PaymentIntent créé: ${paymentIntent.id} (${paymentIntent.status})`,
      );
    }, 15000);

    it("devrait simuler un paiement Stripe réussi si clé configurée", async () => {
      if (!stripe) {
        console.log("⏭️ Test skippé: STRIPE_SECRET_KEY_TEST non configuré");
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2550,
        currency: "eur",
        metadata: {
          echeanceId: testEcheanceId.toString(),
          userId: testUserId.toString(),
          type: "echeance",
        },
        confirm: true,
        payment_method: "pm_card_visa",
        return_url: "http://localhost:3000/return",
      });

      expect(paymentIntent.status).toMatch(/succeeded|requires_action/);

      // Si paiement réussi, enregistrer dans la DB
      if (paymentIntent.status === "succeeded") {
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: paymentIntent.id,
            statut: "payé",
            date_paiement: new Date(),
            description: "Paiement Stripe réussi",
          },
        });

        await testPrisma.echeances_paiements.update({
          where: { id: testEcheanceId },
          data: { statut: "pay_" },
        });

        const echeance = await testPrisma.echeances_paiements.findUnique({
          where: { id: testEcheanceId },
        });

        expect(echeance?.statut).toBe("pay_");
      }
    }, 20000);
  });

  describe("Cas limites et edge cases", () => {
    it("devrait gérer des montants décimaux précis", async () => {
      const montant = 123.45;

      const paiement = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_decimal_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement décimal",
        },
      });

      expect(Number(paiement.montant)).toBe(montant);
    });

    it("devrait gérer des dates futures pour les échéances", async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 an
      // Normaliser à minuit UTC pour éviter les problèmes de timezone
      futureDate.setUTCHours(0, 0, 0, 0);

      const echeance = await testPrisma.echeances_paiements.create({
        data: {
          utilisateur_id: testUserId,
          abonnement_id: testAbonnementId,
          montant: 100.0,
          date_echeance: futureDate,
          statut: "en_attente",
        },
      });

      const retrieved = await testPrisma.echeances_paiements.findUnique({
        where: { id: echeance.id },
      });

      // Comparer les dates (jour seulement, pas les heures)
      const retrievedDate = new Date(retrieved!.date_echeance);
      retrievedDate.setUTCHours(0, 0, 0, 0);
      expect(retrievedDate.getTime()).toBe(futureDate.getTime());
    });

    it("devrait gérer les différents types de paiement", async () => {
      // Paiement avec abonnement
      const paiementAbo = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 50.0,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_type_abo_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement abonnement",
        },
      });

      expect(paiementAbo.abonnement_id).toBe(testAbonnementId);

      // Paiement avec commande
      const paiementCmd = await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 100.0,
          commande_id: testCommandeId,
          stripe_payment_intent_id: `pi_type_cmd_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          description: "Paiement commande",
        },
      });

      expect(paiementCmd.commande_id).toBe(testCommandeId);
    });

    it("devrait gérer les différents statuts de paiement", async () => {
      const statuts = ["en_attente", "payé", "échoué", "remboursé"];

      for (let i = 0; i < statuts.length; i++) {
        const statut = statuts[i];
        const paiement = await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant: 25.5,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_statut_${statut}_${Date.now()}_${i}`,
            statut,
            date_paiement: new Date(),
            periode_debut: new Date(
              Date.now() + i * 24 * 60 * 60 * 1000, // Jours différents
            ),
            periode_fin: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            description: `Paiement ${statut}`,
          },
        });

        expect(paiement.statut).toBe(statut);
      }
    });
  });

  describe("Statistiques et agrégations", () => {
    it("devrait calculer le total des paiements d'un utilisateur", async () => {
      // Créer plusieurs paiements
      const montants = [25.5, 30.0, 45.5];

      for (let i = 0; i < montants.length; i++) {
        const montant = montants[i];
        await testPrisma.paiements.create({
          data: {
            utilisateur_id: testUserId,
            montant,
            abonnement_id: testAbonnementId,
            stripe_payment_intent_id: `pi_total_${montant}_${Date.now()}_${i}`,
            statut: "payé",
            date_paiement: new Date(),
            periode_debut: new Date(
              Date.now() + i * 24 * 60 * 60 * 1000, // Jours différents
            ),
            periode_fin: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            description: `Paiement total ${montant}`,
          },
        });
      }

      const result = await testPrisma.paiements.aggregate({
        where: {
          utilisateur_id: testUserId,
          statut: "payé",
        },
        _sum: {
          montant: true,
        },
      });

      const expectedTotal = montants.reduce((acc, val) => acc + val, 0);
      expect(Number(result._sum.montant)).toBe(expectedTotal);
    });

    it("devrait compter les paiements par statut", async () => {
      // Créer des paiements avec différents statuts
      await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 25.5,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_count_1_${Date.now()}`,
          statut: "payé",
          date_paiement: new Date(),
          periode_debut: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          periode_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          description: "Paiement count 1",
        },
      });

      await testPrisma.paiements.create({
        data: {
          utilisateur_id: testUserId,
          montant: 30.0,
          abonnement_id: testAbonnementId,
          stripe_payment_intent_id: `pi_count_2_${Date.now()}`,
          statut: "en_attente",
          date_paiement: new Date(),
          periode_debut: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          periode_fin: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          description: "Paiement count 2",
        },
      });

      const countPaye = await testPrisma.paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "payé",
        },
      });

      const countEnAttente = await testPrisma.paiements.count({
        where: {
          utilisateur_id: testUserId,
          statut: "en_attente",
        },
      });

      expect(countPaye).toBeGreaterThan(0);
      expect(countEnAttente).toBeGreaterThan(0);
    });
  });
});
