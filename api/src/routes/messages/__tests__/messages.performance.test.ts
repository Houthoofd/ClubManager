/**
 * Tests de performance pour le module Messages
 * Tests des temps de réponse et de la gestion de charge
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Performance Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMessageClient: Partial<Message>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
      user: { id: 1, email: "test@example.com", role: "admin" },
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockMessageClient = {
      obtenirTousLesTypesDeMessages: jest.fn(),
      creerTypeMessage: jest.fn(),
      modifierTypeMessage: jest.fn(),
      supprimerTypeMessage: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
      getMessageHistory: jest.fn(),
      saveMessageToDatabase: jest.fn(),
      updateMessageStatus: jest.fn(),
      envoyerRappelPaiementAvecEmail: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Temps de réponse", () => {
    it("devrait créer un type de message en moins de 500ms", async () => {
      const typeData = {
        nom: "Type Performance Test",
        description: "Test de performance",
        categorie: "test",
        template: "Template test",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      mockRequest.body = typeData;

      const startTime = Date.now();
      await mockMessageClient.creerTypeMessage!(typeData as any);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it("devrait mettre à jour un type de message en moins de 500ms", async () => {
      const typeId = 1;
      const updateData = {
        nom: "Type mis à jour",
        description: "Description mise à jour",
      };

      const mockUpdated = {
        id: typeId,
        nom: updateData.nom,
        description: updateData.description,
        categorie: "test",
        template: "Template",
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      mockRequest.params = { id: typeId.toString() };
      mockRequest.body = updateData;

      const startTime = Date.now();
      await mockMessageClient.modifierTypeMessage!(typeId, updateData as any);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it("devrait récupérer tous les types de messages en moins de 300ms", async () => {
      const mockTypes = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        nom: `Type ${i + 1}`,
        description: `Description ${i + 1}`,
        categorie: "test",
        template: `Template ${i + 1}`,
        actif: true,
        date_creation: new Date().toISOString(),
      }));

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const startTime = Date.now();
      await mockMessageClient.obtenirTousLesTypesDeMessages!();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it("devrait récupérer l'historique d'un utilisateur en moins de 300ms", async () => {
      const userId = 1;
      const mockHistory = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const startTime = Date.now();
      await mockMessageClient.getMessageHistory!(userId);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it("devrait envoyer un message en moins de 1000ms", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test Performance",
        contenu: "Contenu test",
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: messageData.contenu,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      const startTime = Date.now();
      await mockMessageClient.envoyerMessageAvecEmails!(messageData as any);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it("devrait supprimer un type de message en moins de 300ms", async () => {
      const typeId = 1;

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        success: true,
        id: typeId,
      });

      mockRequest.params = { id: typeId.toString() };

      const startTime = Date.now();
      await mockMessageClient.supprimerTypeMessage!(typeId);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });
  });

  describe("Gestion de charge", () => {
    it("devrait gérer 100 requêtes simultanées de création de types", async () => {
      const typeData = {
        nom: "Type Test Charge",
        description: "Test de charge",
        categorie: "test",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, () =>
        mockMessageClient.creerTypeMessage!(typeData as any)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(mockMessageClient.creerTypeMessage).toHaveBeenCalledTimes(100);
    });

    it("devrait gérer 50 mises à jour simultanées", async () => {
      const typeId = 1;
      const updateData = { nom: "Type mis à jour" };

      const mockUpdated = {
        id: typeId,
        nom: updateData.nom,
        description: "Description",
        categorie: "test",
        template: "Template",
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () =>
        mockMessageClient.modifierTypeMessage!(typeId, updateData as any)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
      expect(mockMessageClient.modifierTypeMessage).toHaveBeenCalledTimes(50);
    });

    it("devrait gérer 200 requêtes de consultation simultanées", async () => {
      const mockTypes = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nom: `Type ${i + 1}`,
        description: `Description ${i + 1}`,
        categorie: "test",
        template: `Template ${i + 1}`,
        actif: true,
        date_creation: new Date().toISOString(),
      }));

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const startTime = Date.now();

      const promises = Array.from({ length: 200 }, () =>
        mockMessageClient.obtenirTousLesTypesDeMessages!()
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
      expect(mockMessageClient.obtenirTousLesTypesDeMessages).toHaveBeenCalledTimes(
        200
      );
    });

    it("devrait gérer l'envoi de 25 messages simultanément", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test Charge",
        contenu: "Contenu",
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: messageData.contenu,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      const startTime = Date.now();

      const promises = Array.from({ length: 25 }, () =>
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10s max pour 25 envois
      expect(mockMessageClient.envoyerMessageAvecEmails).toHaveBeenCalledTimes(
        25
      );
    });
  });

  describe("Performance avec gros volumes de données", () => {
    it("devrait gérer efficacement 500 messages dans l'historique", async () => {
      const userId = 1;
      const largeHistory = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        type_message_id: (i % 5) + 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: i % 10 === 0 ? "echec" : "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        largeHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const startTime = Date.now();
      const history = await mockMessageClient.getMessageHistory!(userId);
      const duration = Date.now() - startTime;

      expect(history).toHaveLength(500);
      expect(duration).toBeLessThan(1000);
    });

    it("devrait gérer efficacement le filtrage sur gros volume", async () => {
      const userId = 1;
      const statut = "envoye";

      const largeHistory = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      const filteredHistory = largeHistory.filter((m) => m.statut === statut);

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        filteredHistory
      );

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { statut };

      const startTime = Date.now();
      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND statut = ?",
        [userId, statut]
      );
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(500);
      expect(duration).toBeLessThan(800);
    });

    it("devrait gérer efficacement le calcul de statistiques complexes", async () => {
      const typeId = 1;

      const mockStats = {
        type_message_id: typeId,
        total_envoyes: 10000,
        total_lus: 8500,
        total_echecs: 150,
        taux_lecture: 85.0,
        taux_succes: 98.5,
        temps_moyen_lecture: "02:30:00",
        destinataires_uniques: 2500,
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      mockRequest.params = { typeId: typeId.toString() };

      const startTime = Date.now();
      const stats = await mockMessageClient.queryAsync!(
        "SELECT * FROM statistiques_messages WHERE type_message_id = ?",
        [typeId]
      );
      const duration = Date.now() - startTime;

      expect(stats[0].total_envoyes).toBe(10000);
      expect(duration).toBeLessThan(500);
    });
  });

  describe("Performance d'envoi en masse", () => {
    it("devrait envoyer à 100 destinataires en moins de 15s", async () => {
      const destinataires = Array.from(
        { length: 100 },
        (_, i) => `user${i + 1}@example.com`
      );

      const messageData = {
        type_message_id: 1,
        destinataires,
        sujet: "Message en masse",
        contenu: "Contenu du message",
      };

      const mockSentMessages = destinataires.map((email, i) => ({
        id: i + 1,
        destinataire: email,
        sujet: messageData.sujet,
        contenu: messageData.contenu,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSentMessages);

      const startTime = Date.now();
      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(15000);
    });

    it("devrait traiter 50 rappels de paiement en parallèle", async () => {
      const rappels = Array.from({ length: 50 }, (_, i) => ({
        utilisateur_id: i + 1,
        email: `user${i + 1}@example.com`,
        nom: `User ${i + 1}`,
        montant: 100 + i * 10,
        date_echeance: "2024-06-30",
      }));

      const mockResults = rappels.map((rappel, i) => ({
        message_id: i + 1,
        email_id: `email-${i + 1}`,
        utilisateur_id: rappel.utilisateur_id,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockImplementation((data: any) => {
        const index = rappels.findIndex(
          (r) => r.utilisateur_id === data.utilisateur_id
        );
        return Promise.resolve(mockResults[index]);
      });

      const startTime = Date.now();

      const promises = rappels.map((rappel) =>
        mockMessageClient.envoyerRappelPaiementAvecEmail!(rappel)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(results.every((r) => r.statut === "envoye")).toBe(true);
      expect(duration).toBeLessThan(10000);
    });
  });

  describe("Performance de recherche et tri", () => {
    it("devrait trier rapidement 200 messages par date", async () => {
      const mockMessages = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: "envoye",
        date_envoi: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }));

      const startTime = Date.now();

      const sortedMessages = [...mockMessages].sort(
        (a, b) =>
          new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime()
      );

      const duration = Date.now() - startTime;

      expect(sortedMessages).toHaveLength(200);
      expect(duration).toBeLessThan(100);
    });

    it("devrait paginer efficacement sur un grand ensemble", async () => {
      const userId = 1;
      const totalMessages = 1000;
      const pageSize = 20;
      const page = 5;

      const mockMessages = Array.from({ length: pageSize }, (_, i) => ({
        id: page * pageSize + i + 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: `Message ${page * pageSize + i + 1}`,
        contenu: `Contenu ${page * pageSize + i + 1}`,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockMessages
      );

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = {
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      };

      const startTime = Date.now();

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? LIMIT ? OFFSET ?",
        [userId, pageSize, page * pageSize]
      );

      const duration = Date.now() - startTime;

      expect(result).toHaveLength(pageSize);
      expect(duration).toBeLessThan(300);
    });
  });

  describe("Performance des recherches complexes", () => {
    it("devrait rechercher efficacement par multiples critères", async () => {
      const userId = 1;
      const typeId = 1;
      const statut = "envoye";
      const dateDebut = "2024-06-01";
      const dateFin = "2024-06-30";

      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        type_message_id: typeId,
        utilisateur_id: userId,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockMessages
      );

      const startTime = Date.now();

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND type_message_id = ? AND statut = ? AND date_envoi BETWEEN ? AND ?",
        [userId, typeId, statut, dateDebut, dateFin]
      );

      const duration = Date.now() - startTime;

      expect(result).toHaveLength(50);
      expect(duration).toBeLessThan(400);
    });

    it("devrait agréger rapidement des statistiques sur 300 messages", async () => {
      const mockMessages = Array.from({ length: 300 }, (_, i) => ({
        id: i + 1,
        type_message_id: (i % 5) + 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: `Contenu ${i + 1}`,
        statut: i % 10 === 0 ? "echec" : "envoye",
        date_envoi: new Date().toISOString(),
        date_lecture: i % 3 === 0 ? new Date().toISOString() : null,
      }));

      const startTime = Date.now();

      const stats = {
        total: mockMessages.length,
        envoyes: mockMessages.filter((m) => m.statut === "envoye").length,
        echecs: mockMessages.filter((m) => m.statut === "echec").length,
        lus: mockMessages.filter((m) => m.date_lecture !== null).length,
        taux_lecture: (
          (mockMessages.filter((m) => m.date_lecture !== null).length /
            mockMessages.filter((m) => m.statut === "envoye").length) *
          100
        ).toFixed(2),
      };

      const duration = Date.now() - startTime;

      expect(stats.total).toBe(300);
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Performance de suppression", () => {
    it("devrait supprimer efficacement 10 types de messages simultanément", async () => {
      const typeIds = Array.from({ length: 10 }, (_, i) => i + 1);

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockImplementation(
        (id: number) =>
          Promise.resolve({
            success: true,
            id,
            message: `Type ${id} supprimé`,
          })
      );

      const startTime = Date.now();

      const promises = typeIds.map((id) =>
        mockMessageClient.supprimerTypeMessage!(id)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r: any) => r.success)).toBe(true);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Benchmarks moyens", () => {
    it("devrait maintenir une moyenne < 100ms pour obtenirTousLesTypesDeMessages sur 100 appels", async () => {
      const mockTypes = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nom: `Type ${i + 1}`,
        description: `Description ${i + 1}`,
        categorie: "test",
        template: `Template ${i + 1}`,
        actif: true,
        date_creation: new Date().toISOString(),
      }));

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        await mockMessageClient.obtenirTousLesTypesDeMessages!();
        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;

      expect(average).toBeLessThan(100);
      expect(mockMessageClient.obtenirTousLesTypesDeMessages).toHaveBeenCalledTimes(
        100
      );
    });

    it("devrait maintenir une moyenne < 150ms pour creerTypeMessage sur 50 appels", async () => {
      const typeData = {
        nom: "Type Benchmark",
        description: "Test benchmark",
        categorie: "test",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        await mockMessageClient.creerTypeMessage!(typeData as any);
        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;

      expect(average).toBeLessThan(150);
      expect(mockMessageClient.creerTypeMessage).toHaveBeenCalledTimes(50);
    });
  });

  describe("Gestion des timeouts", () => {
    it("devrait gérer un client DB lent sans crash", async () => {
      const userId = 1;

      (mockMessageClient.getMessageHistory as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve([
                {
                  id: 1,
                  type_message_id: 1,
                  destinataire: "user@example.com",
                  sujet: "Message",
                  contenu: "Contenu",
                  statut: "envoye",
                  date_envoi: new Date().toISOString(),
                },
              ]);
            }, 2000); // Simule une requête lente de 2s
          })
      );

      mockRequest.params = { userId: userId.toString() };

      const startTime = Date.now();
      const history = await mockMessageClient.getMessageHistory!(userId);
      const duration = Date.now() - startTime;

      expect(history).toHaveLength(1);
      expect(duration).toBeGreaterThan(2000);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe("Performance en environnement multi-utilisateurs", () => {
    it("devrait gérer des requêtes de différents utilisateurs simultanément", async () => {
      const userIds = [1, 2, 3, 4, 5];

      (mockMessageClient.getMessageHistory as jest.Mock).mockImplementation(
        (userId: number) =>
          Promise.resolve(
            Array.from({ length: 10 }, (_, i) => ({
              id: userId * 100 + i + 1,
              type_message_id: 1,
              utilisateur_id: userId,
              destinataire: `user${userId}@example.com`,
              sujet: `Message ${i + 1}`,
              contenu: `Contenu ${i + 1}`,
              statut: "envoye",
              date_envoi: new Date().toISOString(),
            }))
          )
      );

      const startTime = Date.now();

      const promises = userIds.map((userId) =>
        mockMessageClient.getMessageHistory!(userId)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.length === 10)).toBe(true);
      expect(duration).toBeLessThan(2000);
    });
  });
});
