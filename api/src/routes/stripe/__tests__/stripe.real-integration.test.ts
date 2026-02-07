/**
 * Tests d'intégration réels pour le module Stripe
 * Tests avec base de données réelle
 *
 * IMPORTANT: Ces tests nécessitent:
 * - Une base de données de test configurée (DATABASE_URL)
 * - Les clés Stripe configurées (STRIPE_SECRET_KEY et STRIPE_PUBLISHABLE_KEY)
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

// Vérifier si on doit skip AVANT d'importer les modules
const SKIP_REAL_DB_TESTS =
  !process.env.DATABASE_URL ||
  process.env.SKIP_REAL_DB_TESTS === "true" ||
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_PUBLISHABLE_KEY;

if (SKIP_REAL_DB_TESTS) {
  // Tests mockés si pas de DB ou clés Stripe
  describe("Stripe Module - Tests d'intégration réels (DB) - SKIPPED", () => {
    it("devrait skip les tests car DB ou clés Stripe non configurées", () => {
      console.log("⚠️ Tests d'intégration réels Stripe ignorés");
      console.log("   Raisons possibles:");
      console.log(
        "   - DATABASE_URL non configurée:",
        !process.env.DATABASE_URL,
      );
      console.log(
        "   - STRIPE_SECRET_KEY non configurée:",
        !process.env.STRIPE_SECRET_KEY,
      );
      console.log(
        "   - STRIPE_PUBLISHABLE_KEY non configurée:",
        !process.env.STRIPE_PUBLISHABLE_KEY,
      );
      console.log(
        "   - SKIP_REAL_DB_TESTS activé:",
        process.env.SKIP_REAL_DB_TESTS === "true",
      );

      expect(true).toBe(true);
    });
  });
} else {
  // Importer les modules SEULEMENT si on ne skip pas
  const MysqlConnector = (
    await import("../../../db/connector/mysqlconnector.js")
  ).default;
  const { PaymentService } =
    await import("../core/services/payment.service.js");
  const { StatusUpgradeService } =
    await import("../core/services/status-upgrade.service.js");
  const { Paiements } =
    await import("../../../db/clients/paiements/paiements.js");
  const { Magasin } = await import("../../../db/clients/magasin/magasin.js");

  describe("Stripe Module - Tests d'intégration réels (DB)", () => {
    let mysqlConnector: typeof MysqlConnector extends new (
      ...args: any[]
    ) => infer R
      ? R
      : never;
    let paymentService: InstanceType<typeof PaymentService>;
    let statusUpgradeService: InstanceType<typeof StatusUpgradeService>;
    let paiementsClient: InstanceType<typeof Paiements>;
    let magasinClient: InstanceType<typeof Magasin>;

    beforeAll(async () => {
      mysqlConnector = MysqlConnector.getInstance();
      paymentService = PaymentService.getInstance();
      statusUpgradeService = StatusUpgradeService.getInstance();
      paiementsClient = new Paiements();
      magasinClient = new Magasin();

      // Attendre que la connexion MySQL soit prête
      try {
        await mysqlConnector.waitForConnection(10000);
        console.log(
          "✅ Connexion à la base de données de test établie (Stripe)",
        );
      } catch (error) {
        console.error(
          "❌ Échec de la connexion à la base de données (Stripe):",
          error,
        );
        throw error;
      }
    });

    afterAll(async () => {
      if (mysqlConnector) {
        // Fermer les connexions MySQL proprement
        try {
          await mysqlConnector.closePool();
          console.log("🔚 Nettoyage des connexions DB Stripe terminé");
        } catch (error) {
          console.error("⚠️ Erreur lors de la fermeture du pool:", error);
        }
      }
    });

    // ==================== TESTS RÉELS - PAIEMENTS ====================
    describe("Paiements - Tests réels", () => {
      it("devrait récupérer les paiements depuis la DB réelle", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        expect(paiements).toBeDefined();
        expect(Array.isArray(paiements)).toBe(true);

        if (paiements && paiements.length > 0) {
          expect(paiements[0]).toHaveProperty("id");
          expect(paiements[0]).toHaveProperty("user_id");
          expect(paiements[0]).toHaveProperty("montant");
          expect(typeof paiements[0].id).toBe("number");
          expect(typeof paiements[0].user_id).toBe("number");
          expect(typeof paiements[0].montant).toBe("number");
        }
      });

      it("devrait avoir des IDs uniques pour chaque paiement", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        if (paiements && paiements.length > 0) {
          const ids = paiements.map((p) => p.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      });

      it("devrait avoir des montants positifs", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        if (paiements && paiements.length > 0) {
          paiements.forEach((paiement) => {
            expect(paiement.montant).toBeGreaterThan(0);
          });
        }
      });

      it("devrait gérer une lecture répétée (idempotence)", async () => {
        const paiements1 = await paiementsClient.obtenirLesTousLesPaiements();
        const paiements2 = await paiementsClient.obtenirLesTousLesPaiements();

        expect(paiements1).toEqual(paiements2);
      });
    });

    // ==================== TESTS RÉELS - SERVICES ====================
    describe("Services - Tests réels avec DB", () => {
      it("devrait initialiser correctement PaymentService", () => {
        expect(paymentService).toBeDefined();
        expect(typeof paymentService.verifierEcheance).toBe("function");
        expect(typeof paymentService.confirmerPaiementEcheance).toBe(
          "function",
        );
      });

      it("devrait initialiser correctement StatusUpgradeService", () => {
        expect(statusUpgradeService).toBeDefined();
        expect(typeof statusUpgradeService.upgraderStatutUtilisateur).toBe(
          "function",
        );
      });

      it("devrait retourner invalid pour une échéance inexistante", async () => {
        const result = await paymentService.verifierEcheance(999999, 1);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("valid");
        expect(result.valid).toBe(false);
      });
    });

    // ==================== TESTS RÉELS - PERFORMANCE ====================
    describe("Performance - Tests réels", () => {
      it("devrait récupérer tous les paiements en moins de 1 seconde", async () => {
        const startTime = Date.now();
        await paiementsClient.obtenirLesTousLesPaiements();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(1000);
      });

      it("devrait gérer 5 requêtes concurrentes de lecture", async () => {
        const startTime = Date.now();
        const promises = Array.from({ length: 5 }, () =>
          paiementsClient.obtenirLesTousLesPaiements(),
        );

        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toBeDefined();
        expect(results.length).toBe(5);
        expect(endTime - startTime).toBeLessThan(2000);
      });
    });

    // ==================== TESTS RÉELS - COHÉRENCE DES DONNÉES ====================
    describe("Cohérence des données - Tests réels", () => {
      it("devrait avoir des IDs positifs pour tous les paiements", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        if (paiements && paiements.length > 0) {
          paiements.forEach((paiement) => {
            expect(paiement.id).toBeGreaterThan(0);
            expect(paiement.user_id).toBeGreaterThan(0);
          });
        }
      });

      it("ne devrait pas avoir de données NULL inattendues", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        if (paiements && paiements.length > 0) {
          paiements.forEach((paiement) => {
            expect(paiement.id).toBeDefined();
            expect(paiement.user_id).toBeDefined();
            expect(paiement.montant).toBeDefined();
            expect(paiement.statut).toBeDefined();
          });
        }
      });

      it("devrait avoir des montants valides", async () => {
        const paiements = await paiementsClient.obtenirLesTousLesPaiements();

        if (paiements && paiements.length > 0) {
          paiements.forEach((paiement) => {
            expect(paiement.montant).toBeGreaterThan(0);
            expect(typeof paiement.montant).toBe("number");
            expect(isFinite(paiement.montant)).toBe(true);
          });
        }
      });
    });

    // ==================== TESTS RÉELS - RÉSILIENCE ====================
    describe("Résilience - Tests réels", () => {
      it("devrait pouvoir récupérer les données après plusieurs lectures", async () => {
        // Plusieurs lectures successives
        await paiementsClient.obtenirLesTousLesPaiements();
        await paiementsClient.obtenirLesTousLesPaiements();
        await paiementsClient.obtenirLesTousLesPaiements();

        const finalPaiements =
          await paiementsClient.obtenirLesTousLesPaiements();

        expect(finalPaiements).toBeDefined();
        expect(Array.isArray(finalPaiements)).toBe(true);
      });
    });
  });
}
