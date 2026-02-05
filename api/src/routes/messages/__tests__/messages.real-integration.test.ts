/**
 * Tests d'intégration réelle pour le module Messages
 * Tests avec connexion réelle à la base de données (à exécuter manuellement)
 * Ces tests nécessitent une configuration DB de test
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Real Integration Tests", () => {
  let messageClient: Message;
  let testTypeId: number;
  let testMessageId: number;

  // Ces tests sont skip par défaut car ils nécessitent une DB réelle
  // Pour les exécuter: npm test -- --testPathPattern=real-integration

  beforeAll(async () => {
    // Initialiser le client avec la vraie connexion DB
    // messageClient = new Message();
    // await messageClient.connect();
  });

  afterAll(async () => {
    // Nettoyer les données de test
    // if (testTypeId) {
    //   await messageClient.supprimerTypeMessage(testTypeId);
    // }
    // await messageClient.disconnect();
  });

  describe.skip("CRUD complet des types de messages", () => {
    it("devrait créer un type de message dans la base réelle", async () => {
      const typeData = {
        nom: `Test Integration ${Date.now()}`,
        description: "Type créé lors des tests d'intégration",
        categorie: "test",
        template: "Bonjour {nom}, ceci est un test.",
        actif: true,
      };

      const created = await messageClient.creerTypeMessage(typeData as any);

      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.nom).toBe(typeData.nom);

      testTypeId = created.id;
    });

    it("devrait récupérer tous les types de messages", async () => {
      const types = await messageClient.obtenirTousLesTypesDeMessages();

      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types.find((t: any) => t.id === testTypeId)).toBeDefined();
    });

    it("devrait mettre à jour le type de message créé", async () => {
      const updateData = {
        description: "Description mise à jour lors du test",
        actif: false,
      };

      const updated = await messageClient.modifierTypeMessage(
        testTypeId,
        updateData as any
      );

      expect(updated).toBeDefined();
      expect(updated.description).toBe(updateData.description);
      expect(updated.actif).toBe(false);
    });

    it("devrait supprimer le type de message", async () => {
      const result = await messageClient.supprimerTypeMessage(testTypeId);

      expect(result.success).toBe(true);

      // Vérifier que le type a bien été supprimé
      const types = await messageClient.obtenirTousLesTypesDeMessages();
      expect(types.find((t: any) => t.id === testTypeId)).toBeUndefined();
    });
  });

  describe.skip("Envoi de messages réels", () => {
    beforeAll(async () => {
      // Créer un type de message pour les tests d'envoi
      const typeData = {
        nom: `Type Test Envoi ${Date.now()}`,
        description: "Type pour tester l'envoi",
        categorie: "test",
        template: "Test d'envoi pour {nom}",
        actif: true,
      };

      const created = await messageClient.creerTypeMessage(typeData as any);
      testTypeId = created.id;
    });

    it("devrait envoyer un message à un destinataire", async () => {
      const messageData = {
        type_message_id: testTypeId,
        destinataires: ["test@example.com"],
        sujet: "Test d'intégration",
        contenu: "Ceci est un message de test d'intégration",
        variables: {
          nom: "Utilisateur Test",
        },
      };

      const results = await messageClient.envoyerMessageAvecEmails(
        messageData as any
      );

      expect(results).toHaveLength(1);
      expect(results[0].statut).toBe("envoye");

      testMessageId = results[0].id;
    });

    it("devrait récupérer l'historique incluant le message envoyé", async () => {
      // Attendre un peu pour que le message soit bien enregistré
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const history = await messageClient.getMessageHistory(1);

      expect(Array.isArray(history)).toBe(true);
      const sentMessage = history.find((m: any) => m.id === testMessageId);
      expect(sentMessage).toBeDefined();
    });

    it("devrait mettre à jour le statut du message", async () => {
      const updated = await messageClient.updateMessageStatus(
        testMessageId,
        "lu"
      );

      expect(updated.statut).toBe("lu");
      expect(updated.date_lecture).toBeDefined();
    });
  });

  describe.skip("Tests de performance avec données réelles", () => {
    it("devrait gérer l'envoi de 100 messages en moins de 30 secondes", async () => {
      const destinataires = Array.from(
        { length: 100 },
        (_, i) => `test${i}@example.com`
      );

      const messageData = {
        type_message_id: testTypeId,
        destinataires,
        sujet: "Test de performance",
        contenu: "Message de test en masse",
      };

      const startTime = Date.now();
      const results = await messageClient.envoyerMessageAvecEmails(
        messageData as any
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(30000);
      console.log(`Envoi de 100 messages en ${duration}ms`);
    });

    it("devrait récupérer l'historique de 1000+ messages rapidement", async () => {
      const startTime = Date.now();
      const history = await messageClient.getMessageHistory(1);
      const duration = Date.now() - startTime;

      expect(Array.isArray(history)).toBe(true);
      expect(duration).toBeLessThan(2000);
      console.log(
        `Récupération de ${history.length} messages en ${duration}ms`
      );
    });
  });

  describe.skip("Tests de concurrence réelle", () => {
    it("devrait gérer 10 créations simultanées de types", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        messageClient.creerTypeMessage({
          nom: `Type Concurrent ${i} ${Date.now()}`,
          description: `Description ${i}`,
          categorie: "test",
          actif: true,
        } as any)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.id > 0)).toBe(true);

      // Nettoyer
      for (const result of results) {
        await messageClient.supprimerTypeMessage(result.id);
      }
    });

    it("devrait gérer 5 mises à jour simultanées du même type", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        messageClient.modifierTypeMessage(testTypeId, {
          description: `Update concurrent ${i} ${Date.now()}`,
        } as any)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.id === testTypeId)).toBe(true);
    });
  });

  describe.skip("Tests de rappels de paiement réels", () => {
    it("devrait envoyer un rappel de paiement complet", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "test@example.com",
        nom: "Jean Dupont Test",
        montant: 150.5,
        date_echeance: "2024-12-31",
      };

      const result = await messageClient.envoyerRappelPaiementAvecEmail(
        rappelData
      );

      expect(result.statut).toBe("envoye");
      expect(result.message_id).toBeGreaterThan(0);
      expect(result.email_id).toBeDefined();
    });

    it("devrait envoyer 10 rappels en masse", async () => {
      const rappels = Array.from({ length: 10 }, (_, i) => ({
        utilisateur_id: i + 1,
        email: `user${i + 1}@example.com`,
        nom: `User ${i + 1}`,
        montant: 100 + i * 10,
        date_echeance: "2024-12-31",
      }));

      const startTime = Date.now();
      const promises = rappels.map((rappel) =>
        messageClient.envoyerRappelPaiementAvecEmail(rappel)
      );
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.statut === "envoye")).toBe(true);
      console.log(`Envoi de 10 rappels en ${duration}ms`);
    });
  });

  describe.skip("Tests de diagnostic réel", () => {
    it("devrait vérifier la structure de la table types_messages", async () => {
      const structure = await messageClient.queryAsync(
        "DESCRIBE types_messages",
        []
      );

      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);

      const colonnes = structure.map((s: any) => s.Field);
      expect(colonnes).toContain("id");
      expect(colonnes).toContain("nom");
      expect(colonnes).toContain("description");
      expect(colonnes).toContain("categorie");
      expect(colonnes).toContain("template");
      expect(colonnes).toContain("actif");
    });

    it("devrait vérifier la structure de la table messages", async () => {
      const structure = await messageClient.queryAsync("DESCRIBE messages", []);

      expect(Array.isArray(structure)).toBe(true);

      const colonnes = structure.map((s: any) => s.Field);
      expect(colonnes).toContain("id");
      expect(colonnes).toContain("type_message_id");
      expect(colonnes).toContain("utilisateur_id");
      expect(colonnes).toContain("destinataire");
      expect(colonnes).toContain("sujet");
      expect(colonnes).toContain("contenu");
      expect(colonnes).toContain("statut");
      expect(colonnes).toContain("date_envoi");
      expect(colonnes).toContain("date_lecture");
    });

    it("devrait calculer des statistiques réelles", async () => {
      const stats = await messageClient.queryAsync(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'envoye' THEN 1 ELSE 0 END) as envoyes,
          SUM(CASE WHEN statut = 'echec' THEN 1 ELSE 0 END) as echecs,
          SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) as lus
        FROM messages`,
        []
      );

      expect(stats).toHaveLength(1);
      expect(stats[0].total).toBeGreaterThanOrEqual(0);

      if (stats[0].total > 0) {
        const tauxSucces = (stats[0].envoyes / stats[0].total) * 100;
        const tauxLecture =
          stats[0].envoyes > 0 ? (stats[0].lus / stats[0].envoyes) * 100 : 0;

        console.log(`Statistiques réelles:`);
        console.log(`- Total messages: ${stats[0].total}`);
        console.log(`- Taux de succès: ${tauxSucces.toFixed(2)}%`);
        console.log(`- Taux de lecture: ${tauxLecture.toFixed(2)}%`);
      }
    });
  });

  describe.skip("Tests de résilience", () => {
    it("devrait gérer la tentative de création d'un doublon", async () => {
      const typeData = {
        nom: "Type Unique Test",
        description: "Test de contrainte unique",
        categorie: "test",
        actif: true,
      };

      const first = await messageClient.creerTypeMessage(typeData as any);
      expect(first.id).toBeGreaterThan(0);

      // Tentative de créer un doublon
      await expect(
        messageClient.creerTypeMessage(typeData as any)
      ).rejects.toThrow();

      // Nettoyer
      await messageClient.supprimerTypeMessage(first.id);
    });

    it("devrait gérer la suppression d'un type inexistant", async () => {
      const fakeId = 999999;

      await expect(
        messageClient.supprimerTypeMessage(fakeId)
      ).rejects.toThrow();
    });

    it("devrait gérer une mise à jour d'un type inexistant", async () => {
      const fakeId = 999999;

      await expect(
        messageClient.modifierTypeMessage(fakeId, { nom: "Test" } as any)
      ).rejects.toThrow();
    });
  });

  describe.skip("Tests de rollback et transactions", () => {
    it("devrait rollback en cas d'erreur lors d'un envoi multiple", async () => {
      const messageData = {
        type_message_id: 999999, // ID inexistant
        destinataires: ["user1@example.com", "user2@example.com"],
        sujet: "Test rollback",
        contenu: "Contenu",
      };

      await expect(
        messageClient.envoyerMessageAvecEmails(messageData as any)
      ).rejects.toThrow();

      // Vérifier qu'aucun message n'a été enregistré
      const history = await messageClient.getMessageHistory(1);
      const testMessages = history.filter(
        (m: any) => m.sujet === "Test rollback"
      );
      expect(testMessages).toHaveLength(0);
    });
  });
});
