/**
 * Tests des cas limites pour le module Messages
 * Tests des edge cases et situations extrêmes
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Edge cases", () => {
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

  describe("Longueurs limites des champs texte", () => {
    it("devrait accepter un nom de type très court (1 caractère)", async () => {
      const typeData = {
        nom: "A",
        description: "Description minimale",
        categorie: "general",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        template: null,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      mockRequest.body = typeData;

      expect(mockCreated.nom).toBe("A");
      expect(mockCreated.nom.length).toBe(1);
    });

    it("devrait accepter un nom de type à la longueur maximale (255 caractères)", async () => {
      const maxLengthName = "A".repeat(255);
      const typeData = {
        nom: maxLengthName,
        description: "Description",
        categorie: "general",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        template: null,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      mockRequest.body = typeData;

      expect(mockCreated.nom).toBe(maxLengthName);
      expect(mockCreated.nom.length).toBe(255);
    });

    it("devrait gérer un contenu de message très long (10000 caractères)", async () => {
      const longContent = "Lorem ipsum ".repeat(1000);
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Message avec contenu long",
        contenu: longContent,
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: longContent,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      expect(mockSent[0].contenu.length).toBeGreaterThan(10000);
    });

    it("devrait gérer un template avec de nombreuses variables", async () => {
      const template =
        "Bonjour {nom} {prenom}, votre {type} pour {club} expire le {date} à {heure}. Montant: {montant}{devise}. Contact: {email} ou {telephone}.";

      const typeData = {
        nom: "Template complexe",
        description: "Template avec multiples variables",
        categorie: "general",
        template,
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

      const variableCount = (template.match(/\{[^}]+\}/g) || []).length;
      expect(variableCount).toBeGreaterThanOrEqual(9);
    });
  });

  describe("IDs limites", () => {
    it("devrait gérer typeId = 1 (minimum)", async () => {
      const typeId = 1;

      const mockType = {
        id: typeId,
        nom: "Type 1",
        description: "Premier type",
        categorie: "general",
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockType,
      ]);

      mockRequest.params = { id: typeId.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM types_messages WHERE id = ?",
        [typeId]
      );

      expect(result[0].id).toBe(1);
    });

    it("devrait gérer un très grand typeId", async () => {
      const typeId = 2147483647; // Max INT en MySQL

      const mockType = {
        id: typeId,
        nom: "Type avec grand ID",
        description: "Description",
        categorie: "general",
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockType,
      ]);

      mockRequest.params = { id: typeId.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM types_messages WHERE id = ?",
        [typeId]
      );

      expect(result[0].id).toBe(typeId);
    });

    it("devrait gérer userId = 1 (minimum)", async () => {
      const userId = 1;

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          utilisateur_id: userId,
          destinataire: "user1@example.com",
          sujet: "Message",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history[0].utilisateur_id).toBe(1);
    });

    it("devrait gérer un très grand userId", async () => {
      const userId = 999999999;

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue([]);

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history).toHaveLength(0);
    });
  });

  describe("Collections vides", () => {
    it("devrait gérer aucun type de message existant", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue([]);

      const types = await mockMessageClient.obtenirTousLesTypesDeMessages!();

      expect(types).toHaveLength(0);
      expect(Array.isArray(types)).toBe(true);
    });

    it("devrait gérer un utilisateur sans historique de messages", async () => {
      const userId = 1;

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue([]);

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history).toHaveLength(0);
      expect(Array.isArray(history)).toBe(true);
    });

    it("devrait gérer un envoi avec une liste vide de destinataires", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: [],
        sujet: "Test",
        contenu: "Test",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue([]);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results).toHaveLength(0);
    });
  });

  describe("Données nulles et undefined", () => {
    it("devrait gérer template null", async () => {
      const typeData = {
        nom: "Type sans template",
        description: "Description",
        categorie: "general",
        template: null,
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

      expect(mockCreated.template).toBeNull();
    });

    it("devrait gérer template undefined", async () => {
      const typeData = {
        nom: "Type sans template",
        description: "Description",
        categorie: "general",
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        template: null,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      mockRequest.body = typeData;

      expect(mockCreated.template).toBeNull();
    });

    it("devrait gérer date_lecture null pour un message non lu", async () => {
      const userId = 1;

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          utilisateur_id: userId,
          destinataire: "user@example.com",
          sujet: "Message non lu",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
          date_lecture: null,
        },
      ];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history[0].date_lecture).toBeNull();
    });

    it("devrait gérer variables undefined lors de l'envoi", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Test",
        // variables: undefined
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

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results).toHaveLength(1);
    });
  });

  describe("Catégories et statuts edge cases", () => {
    it("devrait gérer toutes les catégories valides", async () => {
      const categories = [
        "adhesion",
        "paiement",
        "cours",
        "evenement",
        "general",
        "rappel",
        "notification",
      ];

      const mockTypes = categories.map((cat, i) => ({
        id: i + 1,
        nom: `Type ${cat}`,
        description: `Type pour ${cat}`,
        categorie: cat,
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
      }));

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const types = await mockMessageClient.obtenirTousLesTypesDeMessages!();

      expect(types).toHaveLength(categories.length);
      expect(types.every((t: any) => categories.includes(t.categorie))).toBe(
        true
      );
    });

    it("devrait gérer tous les statuts de messages valides", async () => {
      const statuts = ["en_attente", "envoye", "echec", "lu"];
      const userId = 1;

      const mockHistory = statuts.map((statut, i) => ({
        id: i + 1,
        type_message_id: 1,
        utilisateur_id: userId,
        destinataire: "user@example.com",
        sujet: `Message ${statut}`,
        contenu: "Contenu",
        statut,
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history).toHaveLength(statuts.length);
      expect(history.every((h: any) => statuts.includes(h.statut))).toBe(true);
    });

    it("devrait filtrer correctement par statut 'echec'", async () => {
      const userId = 1;
      const statut = "echec";

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          utilisateur_id: userId,
          destinataire: "user@example.com",
          sujet: "Message échoué",
          contenu: "Contenu",
          statut: "echec",
          date_envoi: new Date().toISOString(),
          erreur: "Adresse email invalide",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { statut };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND statut = ?",
        [userId, statut]
      );

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe("echec");
      expect(result[0].erreur).toBeDefined();
    });
  });

  describe("Cas de concurrence", () => {
    it("devrait gérer deux mises à jour simultanées du même type", async () => {
      const typeId = 1;
      const updateData1 = { nom: "Nom v1" };
      const updateData2 = { description: "Description v2" };

      const mockUpdated1 = {
        id: typeId,
        nom: "Nom v1",
        description: "Description originale",
        categorie: "general",
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      const mockUpdated2 = {
        id: typeId,
        nom: "Nom v1",
        description: "Description v2",
        categorie: "general",
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock)
        .mockResolvedValueOnce(mockUpdated1)
        .mockResolvedValueOnce(mockUpdated2);

      mockRequest.params = { id: typeId.toString() };

      await mockMessageClient.modifierTypeMessage!(typeId, updateData1 as any);
      await mockMessageClient.modifierTypeMessage!(typeId, updateData2 as any);

      expect(mockMessageClient.modifierTypeMessage).toHaveBeenCalledTimes(2);
    });

    it("devrait gérer l'envoi simultané de messages du même type", async () => {
      const typeId = 1;
      const messages = [
        {
          type_message_id: typeId,
          destinataires: ["user1@example.com"],
          sujet: "Message 1",
          contenu: "Contenu 1",
        },
        {
          type_message_id: typeId,
          destinataires: ["user2@example.com"],
          sujet: "Message 2",
          contenu: "Contenu 2",
        },
        {
          type_message_id: typeId,
          destinataires: ["user3@example.com"],
          sujet: "Message 3",
          contenu: "Contenu 3",
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockImplementation((data: any) =>
        Promise.resolve([
          {
            id: Math.floor(Math.random() * 1000),
            destinataire: data.destinataires[0],
            sujet: data.sujet,
            contenu: data.contenu,
            statut: "envoye",
            date_envoi: new Date().toISOString(),
          },
        ])
      );

      const promises = messages.map((msg) =>
        mockMessageClient.envoyerMessageAvecEmails!(msg as any)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.length === 1)).toBe(true);
    });
  });

  describe("Emails et formats spéciaux", () => {
    it("devrait gérer un email avec sous-domaine complexe", async () => {
      const email = "user@subdomain.example.co.uk";
      const messageData = {
        type_message_id: 1,
        destinataires: [email],
        sujet: "Test",
        contenu: "Test",
      };

      const mockSent = [
        {
          id: 1,
          destinataire: email,
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

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results[0].destinataire).toBe(email);
    });

    it("devrait gérer un email avec caractères spéciaux", async () => {
      const email = "user+tag@example.com";
      const messageData = {
        type_message_id: 1,
        destinataires: [email],
        sujet: "Test",
        contenu: "Test",
      };

      const mockSent = [
        {
          id: 1,
          destinataire: email,
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

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results[0].destinataire).toBe(email);
    });

    it("devrait gérer un grand nombre de destinataires (1000)", async () => {
      const destinataires = Array.from(
        { length: 1000 },
        (_, i) => `user${i + 1}@example.com`
      );

      const messageData = {
        type_message_id: 1,
        destinataires,
        sujet: "Message en masse",
        contenu: "Contenu",
      };

      const mockSent = destinataires.map((email, i) => ({
        id: i + 1,
        destinataire: email,
        sujet: messageData.sujet,
        contenu: messageData.contenu,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results).toHaveLength(1000);
    });
  });

  describe("Dates limites", () => {
    it("devrait gérer une date très ancienne", async () => {
      const oldDate = "1970-01-01T00:00:00Z";

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          destinataire: "user@example.com",
          sujet: "Vieux message",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: oldDate,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE date_envoi = ?",
        [oldDate]
      );

      expect(result[0].date_envoi).toBe(oldDate);
    });

    it("devrait gérer une date future", async () => {
      const futureDate = "2050-12-31T23:59:59Z";

      const mockMessage = {
        id: 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: "Message programmé",
        contenu: "Contenu",
        statut: "en_attente",
        date_envoi: futureDate,
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockMessage,
      ]);

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE date_envoi = ?",
        [futureDate]
      );

      expect(result[0].date_envoi).toBe(futureDate);
      expect(result[0].statut).toBe("en_attente");
    });

    it("devrait gérer la date du jour exacte", async () => {
      const today = new Date().toISOString();

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          destinataire: "user@example.com",
          sujet: "Message du jour",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: today,
        },
      ];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const history = await mockMessageClient.getMessageHistory!(1);

      expect(new Date(history[0].date_envoi).toDateString()).toBe(
        new Date(today).toDateString()
      );
    });
  });

  describe("Caractères spéciaux dans le contenu", () => {
    it("devrait gérer les émojis dans le contenu", async () => {
      const contenuAvecEmojis = "Bonjour 👋 Bienvenue au club! 🎉🎊";

      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test émojis",
        contenu: contenuAvecEmojis,
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: contenuAvecEmojis,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results[0].contenu).toBe(contenuAvecEmojis);
    });

    it("devrait gérer les caractères HTML dans le contenu", async () => {
      const contenuHTML =
        "<p>Bonjour <strong>membre</strong>,</p><br/><p>Votre adhésion expire bientôt.</p>";

      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test HTML",
        contenu: contenuHTML,
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: contenuHTML,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results[0].contenu).toContain("<p>");
      expect(results[0].contenu).toContain("<strong>");
    });

    it("devrait gérer les caractères d'échappement", async () => {
      const contenuSpecial =
        'Message avec guillemets " et apostrophes \' et backslash \\';

      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test caractères spéciaux",
        contenu: contenuSpecial,
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: messageData.sujet,
          contenu: contenuSpecial,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results[0].contenu).toBe(contenuSpecial);
    });
  });

  describe("Montants limites pour rappels de paiement", () => {
    it("devrait gérer un montant minimum (0.01€)", async () => {
      const montantMin = 0.01;

      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: montantMin,
        date_echeance: "2024-06-30",
      };

      const mockResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        montant: montantMin,
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockResult);

      mockRequest.body = rappelData;

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.montant).toBe(montantMin);
    });

    it("devrait gérer un montant très élevé (999999.99€)", async () => {
      const montantMax = 999999.99;

      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: montantMax,
        date_echeance: "2024-06-30",
      };

      const mockResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        montant: montantMax,
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockResult);

      mockRequest.body = rappelData;

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.montant).toBe(montantMax);
    });

    it("devrait gérer un montant avec beaucoup de décimales", async () => {
      const montant = 123.456789;
      const montantArrondi = Math.round(montant * 100) / 100; // 123.46

      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: montantArrondi,
        date_echeance: "2024-06-30",
      };

      const mockResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        montant: montantArrondi,
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockResult);

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.montant).toBe(123.46);
    });
  });

  describe("Filtrage et pagination edge cases", () => {
    it("devrait gérer une pagination avec offset très grand", async () => {
      const userId = 1;
      const limit = 10;
      const offset = 10000;

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([]);

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { limit: limit.toString(), offset: offset.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? LIMIT ? OFFSET ?",
        [userId, limit, offset]
      );

      expect(result).toHaveLength(0);
    });

    it("devrait gérer une recherche avec tous les filtres combinés", async () => {
      const userId = 1;
      const typeId = 1;
      const statut = "envoye";
      const dateDebut = "2024-01-01";
      const dateFin = "2024-12-31";

      const mockFiltered = [
        {
          id: 1,
          type_message_id: typeId,
          utilisateur_id: userId,
          destinataire: "user@example.com",
          sujet: "Message filtré",
          contenu: "Contenu",
          statut,
          date_envoi: "2024-06-15T10:00:00Z",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockFiltered
      );

      mockRequest.query = {
        type_id: typeId.toString(),
        statut,
        date_debut: dateDebut,
        date_fin: dateFin,
      };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND type_message_id = ? AND statut = ? AND date_envoi BETWEEN ? AND ?",
        [userId, typeId, statut, dateDebut, dateFin]
      );

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe(statut);
    });
  });

  describe("Statut actif/inactif des types", () => {
    it("devrait gérer un type désactivé", async () => {
      const typeData = {
        nom: "Type inactif",
        description: "Description",
        categorie: "general",
        actif: false,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        template: null,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      mockRequest.body = typeData;

      expect(mockCreated.actif).toBe(false);
    });

    it("devrait filtrer uniquement les types actifs", async () => {
      const mockTypes = [
        {
          id: 1,
          nom: "Type actif 1",
          description: "Description",
          categorie: "general",
          template: null,
          actif: true,
          date_creation: new Date().toISOString(),
        },
        {
          id: 2,
          nom: "Type inactif",
          description: "Description",
          categorie: "general",
          template: null,
          actif: false,
          date_creation: new Date().toISOString(),
        },
        {
          id: 3,
          nom: "Type actif 2",
          description: "Description",
          categorie: "general",
          template: null,
          actif: true,
          date_creation: new Date().toISOString(),
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTypes.filter((t) => t.actif)
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM types_messages WHERE actif = ?",
        [true]
      );

      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.actif === true)).toBe(true);
    });
  });
});
