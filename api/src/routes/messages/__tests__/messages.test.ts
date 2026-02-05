/**
 * Tests de base pour le module Messages
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";
import {
  getAllTypesMessages,
  createTypeMessage,
  updateTypeMessage,
  deleteTypeMessage,
  getMessagesRecus,
  marquerMessageCommeLu,
  supprimerMessage,
  compterMessagesNonLus,
  envoyerMessage,
} from "../core/handlers/index.js";

describe("Messages Module - Tests de base", () => {
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

      (mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockTypes,
      });

      await getAllTypesMessages(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.obtenirTousLesTypesDeMessages).toHaveBeenCalled();
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
      (mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Aucun type trouvé",
      });

      await getAllTypesMessages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs serveur", async () => {
      (mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await getAllTypesMessages(mockRequest as Request, mockResponse as Response);

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

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type créé avec succès",
      });

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

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

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

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

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

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

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type modifié avec succès",
      });

      await updateTypeMessage(mockRequest as Request, mockResponse as Response);

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

      await updateTypeMessage(mockRequest as Request, mockResponse as Response);

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

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type supprimé avec succès",
      });

      await deleteTypeMessage(mockRequest as Request, mockResponse as Response);

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

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Type non trouvé",
      });

      await deleteTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("getMessagesRecus - GET /api/messages/recus/:userId", () => {
    it("devrait retourner les messages reçus d'un utilisateur", async () => {
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

      (mockMessageClient.obtenirMessagesRecusParUtilisateur as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockMessages,
      });

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.obtenirMessagesRecusParUtilisateur).toHaveBeenCalledWith(42);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockMessages,
          count: 2,
        }),
      );
    });

    it("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "invalid" };

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });
  });

  describe("marquerMessageCommeLu - PUT /api/messages/:messageId/marquer-lu", () => {
    it("devrait marquer un message comme lu", async () => {
      mockRequest.params = { messageId: "5" };

      (mockMessageClient.marquerMessageCommeLu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message marqué comme lu",
      });

      await marquerMessageCommeLu(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.marquerMessageCommeLu).toHaveBeenCalledWith(5);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("supprimerMessage - DELETE /api/messages/:messageId", () => {
    it("devrait supprimer un message (soft delete)", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = { id: 42 };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message supprimé",
      });

      await supprimerMessage(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.supprimerMessageRecu).toHaveBeenCalledWith(10, 42);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait retourner 401 si l'utilisateur n'est pas authentifié", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = undefined;

      await supprimerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Utilisateur non authentifié",
        }),
      );
    });
  });

  describe("compterMessagesNonLus - GET /api/messages/non-lus/:userId", () => {
    it("devrait retourner le nombre de messages non lus", async () => {
      mockRequest.params = { userId: "42" };

      (mockMessageClient.compterMessagesNonLus as jest.Mock).mockResolvedValue(5);

      await compterMessagesNonLus(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.compterMessagesNonLus).toHaveBeenCalledWith(42);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            count: 5,
            userId: 42,
          },
        }),
      );
    });

    it("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "abc" };

      await compterMessagesNonLus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });
  });

  describe("envoyerMessage - POST /api/messages/envoie", () => {
    it("devrait envoyer un message à plusieurs destinataires", async () => {
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

      (mockMessageClient.envoyerMessageAvecEmails as jest.Mock).mockResolvedValue(mockResult);

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.envoyerMessageAvecEmails).toHaveBeenCalledWith([1, 2, 3], 1, true);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("3 messages"),
          data: expect.objectContaining({
            messagesInternes: mockResult.messagesInternes,
            emailsEnvoyes: mockResult.emailsEnvoyes,
          }),
        }),
      );
    });

    it("devrait retourner 400 si destinataires est vide", async () => {
      mockRequest.body = {
        destinataires: [],
        type_message_id: 1,
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait retourner 400 si type_message_id est manquant", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });
  });
});
