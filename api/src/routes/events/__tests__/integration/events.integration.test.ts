/**
 * 🧪 Tests d'Intégration - Events
 *
 * Tests d'intégration avec base de données pour events
 */

import { EventsService } from "../../core/services/events.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";

describe("Events - Tests d'Intégration", () => {
  let service: EventsService;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    service = new EventsService();
    // Nettoyage des données de test
    await prisma.events.deleteMany({});
  });

  describe("Cycle de vie complet", () => {
    it("devrait créer, lire, mettre à jour et supprimer un events", async () => {
      // CREATE
      const created = await service.create({
        name: "Test Events",
        // Ajoutez les champs requis
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();

      // READ
      const found = await service.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Events");

      // UPDATE
      const updated = await service.update(created.id, {
        name: "Updated Events",
      });
      expect(updated.name).toBe("Updated Events");

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
        await prisma.events.create({
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
