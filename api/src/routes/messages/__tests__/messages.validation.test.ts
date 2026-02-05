/**
 * Tests de validation pour le module Messages
 * Tests des validations de données et des cas d'erreur
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
  compterMessagesNonLus,
  envoyerMessage,
} from "../core/handlers/index.js";

describe("Messages Module - Tests de validation", () => {
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

    mockMessageClient = {
      obtenirTousLesTypesDeMessages: jest.fn(),
      creerTypeMessage: jest.fn(),
      modifierTypeMessage: jest.fn(),
      supprimerTypeMessage: jest.fn(),
      obtenirMessagesRecusParUtilisateur: jest.fn(),
      marquerMessageCommeLu: jest.fn(),
      compterMessagesNonLus: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
    };
  });

  describe("Validation des IDs utilisateur", () => {
    it("devrait rejeter un userId non numérique", async () => {
      mockRequest.params = { userId: "abc" };

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait rejeter un userId négatif", async () => {
      mockRequest.params = { userId: "-1" };

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter un userId égal à zéro", async () => {
      mockRequest.params = { userId: "0" };

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter un userId valide", async () => {
      mockRequest.params = { userId: "42" };

      (mockMessageClient.obtenirMessagesRecusParUtilisateur as jest.Mock).mockResolvedValue({
        isFind: true,
        data: [],
      });

      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.obtenirMessagesRecusParUtilisateur).toHaveBeenCalledWith(42);
    });
  });

  describe("Validation des IDs de messages", () => {
    it("devrait rejeter un messageId non numérique", async () => {
      mockRequest.params = { messageId: "invalid" };

      await marquerMessageCommeLu(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID message invalide",
        }),
      );
    });

    it("devrait rejeter un messageId négatif", async () => {
      mockRequest.params = { messageId: "-5" };

      await marquerMessageCommeLu(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter un messageId valide", async () => {
      mockRequest.params = { messageId: "10" };

      (mockMessageClient.marquerMessageCommeLu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message marqué comme lu",
      });

      await marquerMessageCommeLu(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.marquerMessageCommeLu).toHaveBeenCalledWith(10);
    });
  });

  describe("Validation des types de messages", () => {
    it("devrait rejeter un type sans titre", async () => {
      mockRequest.body = {
        content: "Contenu du message",
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
              message: expect.stringContaining("requis"),
            }),
          ]),
        }),
      );
    });

    it("devrait rejeter un type sans contenu", async () => {
      mockRequest.body = {
        title: "Titre du message",
      };

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: "content",
            }),
          ]),
        }),
      );
    });

    it("devrait rejeter un titre trop long", async () => {
      mockRequest.body = {
        title: "a".repeat(300), // Plus de 255 caractères
        content: "Contenu valide",
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

    it("devrait rejeter un titre vide (espaces uniquement)", async () => {
      mockRequest.body = {
        title: "   ",
        content: "Contenu valide",
      };

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter un type de message valide", async () => {
      mockRequest.body = {
        title: "Titre valide",
        content: "Contenu valide",
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type créé",
      });

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(mockMessageClient.creerTypeMessage).toHaveBeenCalledWith("Titre valide", "Contenu valide");
    });
  });

  describe("Validation de l'envoi de messages", () => {
    it("devrait rejeter un envoi sans destinataires", async () => {
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

    it("devrait rejeter un envoi sans type_message_id", async () => {
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

    it("devrait rejeter un type_message_id négatif", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
        type_message_id: -1,
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter un type_message_id égal à zéro", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
        type_message_id: 0,
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter plus de 1000 destinataires", async () => {
      const tooManyDestinations = Array.from({ length: 1001 }, (_, i) => i + 1);

      mockRequest.body = {
        destinataires: tooManyDestinations,
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

    it("devrait rejeter des destinataires invalides (non numériques)", async () => {
      mockRequest.body = {
        destinataires: [1, "abc", 3],
        type_message_id: 1,
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter des destinataires négatifs", async () => {
      mockRequest.body = {
        destinataires: [1, -2, 3],
        type_message_id: 1,
      };

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter un envoi valide", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3, 4, 5],
        type_message_id: 1,
        envoyerEmail: true,
      };

      const mockResult = {
        messagesInternes: {
          isConfirm: true,
          message: "5 messages créés",
        },
        emailsEnvoyes: [],
        typeMessage: { title: "Test", content: "Contenu" },
      };

      (mockMessageClient.envoyerMessageAvecEmails as jest.Mock).mockResolvedValue(mockResult);

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.envoyerMessageAvecEmails).toHaveBeenCalledWith([1, 2, 3, 4, 5], 1, true);
    });

    it("devrait utiliser envoyerEmail par défaut à true", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
        type_message_id: 1,
      };

      const mockResult = {
        messagesInternes: {
          isConfirm: true,
          message: "3 messages créés",
        },
        emailsEnvoyes: [],
        typeMessage: { title: "Test", content: "Contenu" },
      };

      (mockMessageClient.envoyerMessageAvecEmails as jest.Mock).mockResolvedValue(mockResult);

      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.envoyerMessageAvecEmails).toHaveBeenCalledWith([1, 2, 3], 1, true);
    });
  });

  describe("Validation de la mise à jour de types de messages", () => {
    it("devrait rejeter une mise à jour avec un ID invalide", async () => {
      mockRequest.params = { id: "abc" };
      mockRequest.body = {
        title: "Nouveau titre",
        content: "Nouveau contenu",
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

    it("devrait rejeter une mise à jour sans changement", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await updateTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter une mise à jour du titre uniquement", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Nouveau titre",
        content: "Contenu existant",
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type modifié",
      });

      await updateTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.modifierTypeMessage).toHaveBeenCalledWith(1, "Nouveau titre", "Contenu existant");
    });

    it("devrait accepter une mise à jour du contenu uniquement", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Titre existant",
        content: "Nouveau contenu",
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type modifié",
      });

      await updateTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.modifierTypeMessage).toHaveBeenCalledWith(1, "Titre existant", "Nouveau contenu");
    });
  });

  describe("Validation de la suppression de types de messages", () => {
    it("devrait rejeter une suppression avec un ID invalide", async () => {
      mockRequest.params = { id: "not-a-number" };

      await deleteTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID invalide",
        }),
      );
    });

    it("devrait rejeter une suppression avec un ID négatif", async () => {
      mockRequest.params = { id: "-10" };

      await deleteTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter une suppression avec un ID valide", async () => {
      mockRequest.params = { id: "5" };

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type supprimé",
      });

      await deleteTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.supprimerTypeMessage).toHaveBeenCalledWith(5);
    });
  });

  describe("Validation du comptage de messages non lus", () => {
    it("devrait rejeter un comptage avec userId invalide", async () => {
      mockRequest.params = { userId: "xyz" };

      await compterMessagesNonLus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait accepter un comptage avec userId valide", async () => {
      mockRequest.params = { userId: "42" };

      (mockMessageClient.compterMessagesNonLus as jest.Mock).mockResolvedValue(7);

      await compterMessagesNonLus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.compterMessagesNonLus).toHaveBeenCalledWith(42);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            count: 7,
            userId: 42,
          },
        }),
      );
    });
  });
});
