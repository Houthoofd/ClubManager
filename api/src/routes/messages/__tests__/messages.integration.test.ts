/**
 * Tests d'intégration pour le module Messages
 * Tests des flux complets et des interactions entre composants
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Integration Tests (Mocked)", () => {
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

  describe("Flux complet de gestion des types de messages", () => {
    it("devrait créer un type de message avec toutes les données requises", async () => {
      const typeMessageData = {
        nom: "Rappel d'adhésion",
        description: "Message automatique pour les rappels d'adhésion",
        categorie: "adhesion",
        template: "Bonjour {nom}, votre adhésion arrive à échéance.",
        actif: true,
      };

      const mockCreatedType = {
        id: 1,
        ...typeMessageData,
        date_creation: new Date().toISOString(),
        date_modification: null,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreatedType
      );

      mockRequest.body = typeMessageData;

      expect(mockCreatedType).toBeDefined();
      expect(mockCreatedType.id).toBe(1);
      expect(mockCreatedType.nom).toBe(typeMessageData.nom);
      expect(mockCreatedType.actif).toBe(true);
    });

    it("devrait créer un type de message sans template", async () => {
      const typeMessageData = {
        nom: "Message simple",
        description: "Message sans template prédéfini",
        categorie: "general",
        actif: true,
      };

      const mockCreatedType = {
        id: 2,
        ...typeMessageData,
        template: null,
        date_creation: new Date().toISOString(),
        date_modification: null,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreatedType
      );

      mockRequest.body = typeMessageData;

      expect(mockCreatedType.template).toBeNull();
    });

    it("devrait récupérer tous les types de messages", async () => {
      const mockTypes = [
        {
          id: 1,
          nom: "Rappel d'adhésion",
          description: "Message pour les adhésions",
          categorie: "adhesion",
          template: "Template 1",
          actif: true,
          date_creation: new Date().toISOString(),
        },
        {
          id: 2,
          nom: "Confirmation de paiement",
          description: "Message pour les paiements",
          categorie: "paiement",
          template: "Template 2",
          actif: true,
          date_creation: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const result = await mockMessageClient.obtenirTousLesTypesDeMessages!();

      expect(result).toHaveLength(2);
      expect(result[0].categorie).toBe("adhesion");
      expect(result[1].categorie).toBe("paiement");
    });
  });

  describe("Flux complet de mise à jour d'un type de message", () => {
    it("devrait mettre à jour le nom et la description d'un type", async () => {
      const typeId = 1;
      const updateData = {
        nom: "Rappel d'adhésion - Mis à jour",
        description: "Description mise à jour",
      };

      const mockUpdatedType = {
        id: typeId,
        nom: updateData.nom,
        description: updateData.description,
        categorie: "adhesion",
        template: "Template original",
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdatedType
      );

      mockRequest.params = { id: typeId.toString() };
      mockRequest.body = updateData;

      expect(mockUpdatedType.nom).toBe(updateData.nom);
      expect(mockUpdatedType.description).toBe(updateData.description);
      expect(mockUpdatedType.date_modification).toBeDefined();
    });

    it("devrait désactiver un type de message", async () => {
      const typeId = 1;
      const updateData = { actif: false };

      const mockUpdatedType = {
        id: typeId,
        nom: "Type à désactiver",
        description: "Description",
        categorie: "general",
        template: null,
        actif: false,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdatedType
      );

      mockRequest.params = { id: typeId.toString() };
      mockRequest.body = updateData;

      expect(mockUpdatedType.actif).toBe(false);
    });
  });

  describe("Flux complet d'envoi de messages personnalisés", () => {
    it("devrait envoyer un message à plusieurs destinataires", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user1@example.com", "user2@example.com"],
        sujet: "Message important",
        contenu: "Ceci est un message de test",
        variables: {
          nom_club: "Club Sportif",
          date: "2024-06-15",
        },
      };

      const mockSentMessages = [
        {
          id: 1,
          destinataire: "user1@example.com",
          sujet: messageData.sujet,
          contenu: messageData.contenu,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
        {
          id: 2,
          destinataire: "user2@example.com",
          sujet: messageData.sujet,
          contenu: messageData.contenu,
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSentMessages);

      mockRequest.body = messageData;

      expect(mockSentMessages).toHaveLength(2);
      expect(mockSentMessages[0].statut).toBe("envoye");
      expect(mockSentMessages[1].statut).toBe("envoye");
    });

    it("devrait gérer l'envoi avec échecs partiels", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: [
          "valid@example.com",
          "invalid-email",
          "valid2@example.com",
        ],
        sujet: "Test",
        contenu: "Contenu test",
      };

      const mockResults = [
        {
          id: 1,
          destinataire: "valid@example.com",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
        {
          destinataire: "invalid-email",
          statut: "echec",
          erreur: "Email invalide",
        },
        {
          id: 2,
          destinataire: "valid2@example.com",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockResults);

      mockRequest.body = messageData;

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results).toHaveLength(3);
      expect(results.filter((r: any) => r.statut === "envoye")).toHaveLength(2);
      expect(results.filter((r: any) => r.statut === "echec")).toHaveLength(1);
    });
  });

  describe("Flux complet d'historique des messages", () => {
    it("devrait récupérer l'historique complet pour un utilisateur", async () => {
      const userId = 1;

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          type_nom: "Rappel d'adhésion",
          destinataire: "user@example.com",
          sujet: "Rappel",
          contenu: "Votre adhésion expire bientôt",
          statut: "envoye",
          date_envoi: "2024-06-01T10:00:00Z",
          date_lecture: null,
        },
        {
          id: 2,
          type_message_id: 2,
          type_nom: "Confirmation paiement",
          destinataire: "user@example.com",
          sujet: "Paiement reçu",
          contenu: "Nous avons bien reçu votre paiement",
          statut: "envoye",
          date_envoi: "2024-06-05T14:30:00Z",
          date_lecture: "2024-06-05T15:00:00Z",
        },
      ];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      mockRequest.params = { userId: userId.toString() };

      const history = await mockMessageClient.getMessageHistory!(userId);

      expect(history).toHaveLength(2);
      expect(history[0].statut).toBe("envoye");
      expect(history[1].date_lecture).toBeDefined();
    });

    it("devrait filtrer l'historique par type de message", async () => {
      const userId = 1;
      const typeId = 1;

      const mockFilteredHistory = [
        {
          id: 1,
          type_message_id: 1,
          type_nom: "Rappel d'adhésion",
          destinataire: "user@example.com",
          sujet: "Rappel",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: "2024-06-01T10:00:00Z",
          date_lecture: null,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockFilteredHistory
      );

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { type_id: typeId.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND type_message_id = ?",
        [userId, typeId]
      );

      expect(result).toHaveLength(1);
      expect(result[0].type_message_id).toBe(1);
    });
  });

  describe("Flux complet de rappels de paiement", () => {
    it("devrait envoyer un rappel de paiement avec email", async () => {
      const rappelData = {
        utilisateur_id: 1,
        montant: 150.0,
        date_echeance: "2024-06-30",
        email: "user@example.com",
        nom: "Jean Dupont",
      };

      const mockRappelResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockRappelResult);

      mockRequest.body = rappelData;

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.statut).toBe("envoye");
      expect(result.message_id).toBeDefined();
      expect(result.email_id).toBeDefined();
    });

    it("devrait envoyer plusieurs rappels en masse", async () => {
      const rappels = [
        {
          utilisateur_id: 1,
          email: "user1@example.com",
          montant: 100,
          date_echeance: "2024-06-30",
        },
        {
          utilisateur_id: 2,
          email: "user2@example.com",
          montant: 150,
          date_echeance: "2024-06-30",
        },
        {
          utilisateur_id: 3,
          email: "user3@example.com",
          montant: 200,
          date_echeance: "2024-06-30",
        },
      ];

      const mockResults = rappels.map((rappel, index) => ({
        message_id: index + 1,
        email_id: `email-${index + 1}`,
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

      const results = await Promise.all(
        rappels.map((rappel) =>
          mockMessageClient.envoyerRappelPaiementAvecEmail!(rappel)
        )
      );

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.statut === "envoye")).toBe(true);
    });
  });

  describe("Gestion des erreurs en cascade", () => {
    it("devrait gérer une erreur de base de données lors de la création", async () => {
      const typeMessageData = {
        nom: "Type avec erreur",
        description: "Description",
        categorie: "general",
        actif: true,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Database error: Duplicate entry")
      );

      mockRequest.body = typeMessageData;

      await expect(
        mockMessageClient.creerTypeMessage!(typeMessageData as any)
      ).rejects.toThrow("Database error");
    });

    it("devrait gérer un type de message inexistant lors de l'envoi", async () => {
      const messageData = {
        type_message_id: 999,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Test",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("Type de message introuvable"));

      mockRequest.body = messageData;

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("Type de message introuvable");
    });

    it("devrait gérer une erreur d'envoi d'email", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Test",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("SMTP connection failed"));

      mockRequest.body = messageData;

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("SMTP connection failed");
    });
  });

  describe("Scénarios multi-étapes", () => {
    it("devrait gérer le cycle complet : création type -> envoi message -> vérification historique", async () => {
      // Étape 1: Créer un type de message
      const typeData = {
        nom: "Test Cycle Complet",
        description: "Type pour test intégration",
        categorie: "test",
        template: "Bonjour {nom}",
        actif: true,
      };

      const mockCreatedType = {
        id: 10,
        ...typeData,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreatedType
      );

      const createdType = await mockMessageClient.creerTypeMessage!(
        typeData as any
      );
      expect(createdType.id).toBe(10);

      // Étape 2: Envoyer un message avec ce type
      const messageData = {
        type_message_id: createdType.id,
        destinataires: ["test@example.com"],
        sujet: "Test intégration",
        contenu: "Contenu test",
        variables: { nom: "Test User" },
      };

      const mockSentMessage = {
        id: 1,
        type_message_id: createdType.id,
        destinataire: "test@example.com",
        sujet: messageData.sujet,
        contenu: messageData.contenu,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue([mockSentMessage]);

      const sentMessages = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );
      expect(sentMessages[0].statut).toBe("envoye");

      // Étape 3: Vérifier l'historique
      const mockHistory = [mockSentMessage];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const history = await mockMessageClient.getMessageHistory!(1);
      expect(history).toHaveLength(1);
      expect(history[0].type_message_id).toBe(createdType.id);
    });

    it("devrait gérer plusieurs messages du même type pour différents utilisateurs", async () => {
      const typeId = 1;
      const utilisateurs = [
        { id: 1, email: "user1@example.com", nom: "User 1" },
        { id: 2, email: "user2@example.com", nom: "User 2" },
        { id: 3, email: "user3@example.com", nom: "User 3" },
      ];

      const mockSentMessages = utilisateurs.map((user, index) => ({
        id: index + 1,
        type_message_id: typeId,
        utilisateur_id: user.id,
        destinataire: user.email,
        sujet: `Message pour ${user.nom}`,
        contenu: `Bonjour ${user.nom}`,
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSentMessages);

      const messageData = {
        type_message_id: typeId,
        destinataires: utilisateurs.map((u) => u.email),
        sujet: "Message groupé",
        contenu: "Contenu",
      };

      const results = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.type_message_id === typeId)).toBe(
        true
      );
    });
  });

  describe("Pagination et filtrage", () => {
    it("devrait paginer l'historique des messages", async () => {
      const userId = 1;
      const limit = 10;
      const offset = 0;

      const mockPaginatedHistory = Array.from({ length: limit }, (_, i) => ({
        id: i + 1,
        type_message_id: 1,
        destinataire: "user@example.com",
        sujet: `Message ${i + 1}`,
        contenu: "Contenu",
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      }));

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockPaginatedHistory
      );

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { limit: limit.toString(), offset: offset.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? LIMIT ? OFFSET ?",
        [userId, limit, offset]
      );

      expect(result).toHaveLength(limit);
    });

    it("devrait filtrer par statut et date", async () => {
      const userId = 1;
      const statut = "envoye";
      const dateDebut = "2024-06-01";
      const dateFin = "2024-06-30";

      const mockFilteredMessages = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: "Message filtré",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: "2024-06-15T10:00:00Z",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockFilteredMessages
      );

      mockRequest.query = {
        statut,
        date_debut: dateDebut,
        date_fin: dateFin,
      };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE utilisateur_id = ? AND statut = ? AND date_envoi BETWEEN ? AND ?",
        [userId, statut, dateDebut, dateFin]
      );

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe(statut);
    });
  });

  describe("Statistiques et diagnostics", () => {
    it("devrait récupérer les statistiques d'envoi pour un type de message", async () => {
      const typeId = 1;

      const mockStats = {
        type_message_id: typeId,
        total_envoyes: 150,
        total_lus: 120,
        total_echecs: 5,
        taux_lecture: 80.0,
        taux_succes: 96.67,
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      mockRequest.params = { typeId: typeId.toString() };

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM statistiques_messages WHERE type_message_id = ?",
        [typeId]
      );

      expect(result[0].total_envoyes).toBe(150);
      expect(result[0].taux_lecture).toBeGreaterThan(0);
    });

    it("devrait fournir un diagnostic de santé du module messages", async () => {
      const mockDiagnostic = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        stats: {
          total_types_messages: 10,
          types_actifs: 8,
          messages_envoyes_24h: 234,
          taux_succes_24h: 98.5,
        },
      };

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue([
        mockDiagnostic,
      ]);

      const result = await mockMessageClient.queryAsync!(
        "SELECT 'healthy' as status",
        []
      );

      expect(result[0].status).toBe("healthy");
    });
  });

  describe("Gestion des templates et variables", () => {
    it("devrait remplacer les variables dans un template", async () => {
      const template = "Bonjour {nom}, votre {type} expire le {date}.";
      const variables = {
        nom: "Jean Dupont",
        type: "adhésion",
        date: "30/06/2024",
      };

      let contenu = template;
      Object.entries(variables).forEach(([key, value]) => {
        contenu = contenu.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      });

      expect(contenu).toBe(
        "Bonjour Jean Dupont, votre adhésion expire le 30/06/2024."
      );
      expect(contenu).not.toContain("{");
    });

    it("devrait gérer les variables manquantes dans le template", async () => {
      const template = "Bonjour {nom}, votre {type} expire le {date}.";
      const variables = {
        nom: "Jean Dupont",
        // type et date manquants
      };

      let contenu = template;
      Object.entries(variables).forEach(([key, value]) => {
        contenu = contenu.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      });

      expect(contenu).toContain("{type}");
      expect(contenu).toContain("{date}");
      expect(contenu).toContain("Jean Dupont");
    });
  });
});
