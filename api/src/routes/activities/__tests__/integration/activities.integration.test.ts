/**
 * 🧪 Tests d'Intégration - Activities
 *
 * Tests d'intégration avec base de données pour activities
 */

import { ActivitiesService } from "../../core/services/activities.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";

describe("Activities - Tests d'Intégration", () => {
  let service: ActivitiesService;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    service = new ActivitiesService();
    // Nettoyage des données de test
    await prisma.activities.deleteMany({});
  });

  describe("Cycle de vie complet", () => {
    it("devrait créer, lire, mettre à jour et supprimer un activities", async () => {
      // CREATE
      const created = await service.create({
        name: "Test Activities",
        // Ajoutez les champs requis
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();

      // READ
      const found = await service.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Activities");

      // UPDATE
      const updated = await service.update(created.id, {
        name: "Updated Activities",
      });
      expect(updated.name).toBe("Updated Activities");

      // DELETE
      await service.delete(created.id);
      const deleted = await service.findById(created.id);
      expect(deleted).toBeNull();
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      // Créer des données de test
      for (let i = 1; i <= 25; i++) {
        await prisma.activities.create({
          data: { name: `Test ${i}` },
        });
      }
    });

    it("devrait paginer correctement", async () => {
      const page1 = await service.findAll({ limit: 10, offset: 0 });
      const page2 = await service.findAll({ limit: 10, offset: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe("Contraintes de données", () => {
    it("devrait respecter les contraintes d'unicité", async () => {
      // Implémentez selon vos contraintes
    });

    it("devrait valider les données requises", async () => {
      // Implémentez selon vos validations
    });
  });
});
