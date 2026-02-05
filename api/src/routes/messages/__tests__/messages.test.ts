/**
 * Tests de base pour le module Messages
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";
import { createTypesMessagesHandlers } from "../core/handlers/types-messages.handlers.js";
import { TypesMessagesService } from "../core/services/types-messages.service.js";

describe("Messages Module - Tests de base", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMessageClient: Partial<Message>;
  let mockService: TypesMessagesService;
  let handlers: ReturnType<typeof createTypesMessagesHandlers>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
      user: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    // Mock du client Message
    mockMessageClient = {
      obtenirTousLesTypesDeMessages: jest.fn(),
      creerTypeMessage: jest.fn(),
      modifierTypeMessage: jest.fn(),
      supprimerTypeMessage: jest.fn(),
      obtenirMessagesRecusParUtilisateur: jest.fn(),
      marquerMessageCommeLu: jest.fn(),
      supprimerMessageRecu: jest.fn(),
      compterMessagesNonLus: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
    };

    // Créer un service avec le client mocké
    mockService = new TypesMessagesService(mockMessageClient as Message);

    // Créer les handlers avec le service mocké
    handlers = createTypesMessagesHandlers(mockService);
  });

  describe("getAllTypesMessages - GET /api/messages/types", () => {
    it("devrait retourner tous les types de messages", async () => {
      const mockTypes = [
        {
          id: 1,
          title: "Rappel de cotisation",
          content: "Votre cotisation arrive à échéance",
          created_at: "2024-01-01",
        },
        {
          id: 2,
          title: "Bienvenue",
          content: "Bienvenue dans notre club",
          created_at: "2024-01-02",
        },
      ];

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockTypes,
      });

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(
        mockMessageClient.obtenirTousLesTypesDeMessages,
      ).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTypes,
          count: 2,
        }),
      );
    });

    it("devrait retourner 404 si aucun type n'est trouvé", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun type trouvé",
      });

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs serveur", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });
  });

  describe("createTypeMessage - POST /api/messages/types", () => {
    it("devrait créer un type de message avec succès", async () => {
      mockRequest.body = {
        title: "Nouveau type",
        content: "Contenu du nouveau type",
      };

      // Mock pour vérifier qu'aucun type existant n'a ce titre
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ id: 99, title: "Autre type", content: "Autre contenu" }],
      });

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type créé avec succès",
      });

      await handlers.createTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockMessageClient.creerTypeMessage).toHaveBeenCalledWith(
        "Nouveau type",
        "Contenu du nouveau type",
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si le titre est manquant", async () => {
      mockRequest.body = {
        content: "Contenu sans titre",
      };

      await handlers.createTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: "title",
            }),
          ]),
        }),
      );
    });

    it("devrait retourner 400 si le contenu est manquant", async () => {
      mockRequest.body = {
        title: "Titre sans contenu",
      };

      await handlers.createTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });
  });

  describe("updateTypeMessage - PUT /api/messages/types/:id", () => {
    it("devrait mettre à jour un type de message avec succès", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Titre modifié",
        content: "Contenu modifié",
      };

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ id: 1, title: "Existing", content: "Content" }],
      });

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type modifié avec succès",
      });

      await handlers.updateTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockMessageClient.modifierTypeMessage).toHaveBeenCalledWith(
        1,
        "Titre modifié",
        "Contenu modifié",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = {
        title: "Titre",
        content: "Contenu",
      };

      await handlers.updateTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });
  });

  describe("deleteTypeMessage - DELETE /api/messages/types/:id", () => {
    it("devrait supprimer un type de message avec succès", async () => {
      mockRequest.params = { id: "1" };

      // Mock pour vérifier que le type existe
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ id: 1, title: "Type à supprimer", content: "Contenu" }],
      });

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type supprimé avec succès",
      });

      await handlers.deleteTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockMessageClient.supprimerTypeMessage).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si le type n'existe pas", async () => {
      mockRequest.params = { id: "999" };

      // Mock pour vérifier que le type n'existe pas
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ id: 1, title: "Autre type", content: "Contenu" }],
      });

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Type non trouvé",
      });

      await handlers.deleteTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("getMessagesRecus - GET /api/messages/recus/:userId", () => {
    it.skip("devrait retourner les messages reçus d'un utilisateur", async () => {
      mockRequest.params = { userId: "42" };

      const mockMessages = [
        {
          id: 1,
          utilisateur_id: 42,
          contenu: "Message 1",
          lu: false,
          date_creation: "2024-01-01",
        },
        {
          id: 2,
          utilisateur_id: 42,
          contenu: "Message 2",
          lu: true,
          date_creation: "2024-01-02",
        },
      ];

      (
        mockMessageClient.obtenirMessagesRecusParUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockMessages,
      });

      // Skip - handler not migrated yet
    });

    it.skip("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "invalid" };

      // Skip - handler not migrated yet
    });
  });

  describe("marquerMessageCommeLu - PUT /api/messages/:messageId/marquer-lu", () => {
    it.skip("devrait marquer un message comme lu", async () => {
      mockRequest.params = { messageId: "5" };

      (mockMessageClient.marquerMessageCommeLu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message marqué comme lu",
      });

      // Skip - handler not migrated yet
    });
  });

  describe("supprimerMessage - DELETE /api/messages/:messageId", () => {
    it.skip("devrait supprimer un message (soft delete)", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = { id: 42 };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message supprimé",
      });

      // Skip - handler not migrated yet
    });

    it.skip("devrait retourner 401 si l'utilisateur n'est pas authentifié", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = undefined;

      // Skip - handler not migrated yet
    });
  });

  describe("compterMessagesNonLus - GET /api/messages/non-lus/:userId", () => {
    it.skip("devrait retourner le nombre de messages non lus", async () => {
      mockRequest.params = { userId: "42" };

      (mockMessageClient.compterMessagesNonLus as jest.Mock).mockResolvedValue(
        5,
      );

      // Skip - handler not migrated yet
    });

    it.skip("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "abc" };

      // Skip - handler not migrated yet
    });
  });

  describe("envoyerMessage - POST /api/messages/envoie", () => {
    it.skip("devrait envoyer un message à plusieurs destinataires", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
        type_message_id: 1,
        envoyerEmail: true,
      };

      const mockResult = {
        messagesInternes: {
          isConfirm: true,
          message: "3 messages créés",
        },
        emailsEnvoyes: [
          { email: "user1@example.com", success: true, messageId: "msg1" },
          { email: "user2@example.com", success: true, messageId: "msg2" },
          { email: "user3@example.com", success: true, messageId: "msg3" },
        ],
        typeMessage: { title: "Rappel", content: "Contenu" },
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockResult);

      // Skip - handler not migrated yet
    });

    it.skip("devrait retourner 400 si destinataires est vide", async () => {
      mockRequest.body = {
        destinataires: [],
        type_message_id: 1,
      };

      // Skip - handler not migrated yet
    });

    it.skip("devrait retourner 400 si type_message_id est manquant", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
      };

      // Skip - handler not migrated yet
    });
  });
});
