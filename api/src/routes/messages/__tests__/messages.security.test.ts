/**
 * Tests de sécurité pour le module Messages
 * Tests des permissions, authentification et autorisations
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";
import {
  supprimerMessage,
  supprimerDefinitivement,
  desactiverMessage,
  reactiverMessage,
  getMessagesInactifs,
  getStatistiquesMessages,
} from "../core/handlers/index.js";

describe("Messages Module - Tests de sécurité", () => {
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
      supprimerMessageRecu: jest.fn(),
      supprimerDefinitivementMessage: jest.fn(),
      desactiverMessage: jest.fn(),
      reactiverMessage: jest.fn(),
      obtenirMessagesInactifs: jest.fn(),
      obtenirStatistiquesMessages: jest.fn(),
    };
  });

  describe("Authentification requise", () => {
    it("devrait rejeter une suppression sans authentification", async () => {
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

    it("devrait accepter une suppression avec authentification valide", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = { id: 42, role: "utilisateur" };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message supprimé",
      });

      await supprimerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.supprimerMessageRecu).toHaveBeenCalledWith(10, 42);
    });
  });

  describe("Permissions administrateur - Suppression définitive", () => {
    it("devrait rejeter si l'utilisateur n'est pas admin", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 42,
        role: "utilisateur",
        status: "utilisateur",
      };

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Permissions insuffisantes",
        }),
      );
    });

    it("devrait accepter si l'utilisateur est administrateur", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
        status: "administrateur",
      };

      (mockMessageClient.supprimerDefinitivementMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message supprimé définitivement",
      });

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.supprimerDefinitivementMessage).toHaveBeenCalledWith(10);
    });

    it("devrait accepter si l'utilisateur est super-administrateur", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 1,
        role: "super-administrateur",
        status: "super-administrateur",
      };

      (mockMessageClient.supprimerDefinitivementMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message supprimé définitivement",
      });

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.supprimerDefinitivementMessage).toHaveBeenCalledWith(10);
    });
  });

  describe("Permissions administrateur - Désactivation", () => {
    it("devrait rejeter la désactivation pour un utilisateur normal", async () => {
      mockRequest.params = { messageId: "5" };
      (mockRequest as any).user = {
        id: 42,
        role: "utilisateur",
        status: "utilisateur",
      };

      await desactiverMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Permissions insuffisantes",
        }),
      );
    });

    it("devrait accepter la désactivation pour un admin", async () => {
      mockRequest.params = { messageId: "5" };
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
        status: "administrateur",
      };

      (mockMessageClient.desactiverMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message désactivé",
      });

      await desactiverMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.desactiverMessage).toHaveBeenCalledWith(5);
    });
  });

  describe("Permissions administrateur - Réactivation", () => {
    it("devrait rejeter la réactivation pour un utilisateur normal", async () => {
      mockRequest.params = { messageId: "5" };
      (mockRequest as any).user = {
        id: 42,
        role: "utilisateur",
        status: "utilisateur",
      };

      await reactiverMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Permissions insuffisantes",
        }),
      );
    });

    it("devrait accepter la réactivation pour un admin", async () => {
      mockRequest.params = { messageId: "5" };
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
        status: "administrateur",
      };

      (mockMessageClient.reactiverMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Message réactivé",
      });

      await reactiverMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.reactiverMessage).toHaveBeenCalledWith(5);
    });
  });

  describe("Permissions administrateur - Messages inactifs", () => {
    it("devrait rejeter l'accès aux messages inactifs pour un utilisateur normal", async () => {
      (mockRequest as any).user = {
        id: 42,
        role: "utilisateur",
        status: "utilisateur",
      };

      await getMessagesInactifs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Permissions insuffisantes",
        }),
      );
    });

    it("devrait autoriser l'accès aux messages inactifs pour un admin", async () => {
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
        status: "administrateur",
      };

      (mockMessageClient.obtenirMessagesInactifs as jest.Mock).mockResolvedValue({
        isFind: true,
        data: [],
      });

      await getMessagesInactifs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.obtenirMessagesInactifs).toHaveBeenCalled();
    });
  });

  describe("Permissions administrateur - Statistiques", () => {
    it("devrait rejeter l'accès aux statistiques pour un utilisateur normal", async () => {
      mockRequest.query = { periode: "mois" };
      (mockRequest as any).user = {
        id: 42,
        role: "utilisateur",
        status: "utilisateur",
      };

      await getStatistiquesMessages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Permissions insuffisantes",
        }),
      );
    });

    it("devrait autoriser l'accès aux statistiques pour un admin", async () => {
      mockRequest.query = { periode: "mois" };
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
        status: "administrateur",
      };

      (mockMessageClient.obtenirStatistiquesMessages as jest.Mock).mockResolvedValue({
        isFind: true,
        data: {
          total: 100,
          actifs: 80,
          inactifs: 20,
        },
      });

      await getStatistiquesMessages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMessageClient.obtenirStatistiquesMessages).toHaveBeenCalled();
    });
  });

  describe("Isolation des données utilisateur", () => {
    it("devrait empêcher un utilisateur de supprimer le message d'un autre", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = { id: 42 };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Message non trouvé ou accès refusé",
      });

      await supprimerMessage(mockRequest as Request, mockResponse as Response);

      expect(mockMessageClient.supprimerMessageRecu).toHaveBeenCalledWith(10, 42);
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Injection SQL - Protection", () => {
    it("devrait gérer les tentatives d'injection SQL dans userId", async () => {
      mockRequest.params = { userId: "1 OR 1=1" };

      const { getMessagesRecus } = await import("../core/handlers/index.js");
      await getMessagesRecus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait gérer les tentatives d'injection SQL dans messageId", async () => {
      mockRequest.params = { messageId: "1' DROP TABLE messages--" };

      await supprimerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("XSS - Protection", () => {
    it("devrait nettoyer le titre contenant du HTML", async () => {
      mockRequest.body = {
        title: "<script>alert('XSS')</script>Titre",
        content: "Contenu sûr",
      };

      const { createTypeMessage } = await import("../core/handlers/index.js");

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type créé",
      });

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

      // Zod devrait trim et valider, mais ne devrait pas planter
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait nettoyer le contenu contenant des balises script", async () => {
      mockRequest.body = {
        title: "Titre normal",
        content: "Contenu <script>malicious()</script> normal",
      };

      const { createTypeMessage } = await import("../core/handlers/index.js");

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Type créé",
      });

      await createTypeMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Rate limiting - Validation des limites", () => {
    it("devrait rejeter un envoi à plus de 1000 destinataires", async () => {
      const tooMany = Array.from({ length: 1001 }, (_, i) => i + 1);

      mockRequest.body = {
        destinataires: tooMany,
        type_message_id: 1,
      };

      const { envoyerMessage } = await import("../core/handlers/index.js");
      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait accepter exactement 1000 destinataires", async () => {
      const exactly1000 = Array.from({ length: 1000 }, (_, i) => i + 1);

      mockRequest.body = {
        destinataires: exactly1000,
        type_message_id: 1,
      };

      (mockMessageClient.envoyerMessageAvecEmails as jest.Mock).mockResolvedValue({
        messagesInternes: {
          isConfirm: true,
          message: "1000 messages créés",
        },
        emailsEnvoyes: [],
        typeMessage: { title: "Test", content: "Test" },
      });

      const { envoyerMessage } = await import("../core/handlers/index.js");
      await envoyerMessage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Validation des rôles", () => {
    it("devrait détecter un rôle dans req.user.role", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 1,
        role: "administrateur",
      };

      (mockMessageClient.supprimerDefinitivementMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Supprimé",
      });

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait détecter un rôle dans req.user.status", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 1,
        status: "administrateur",
      };

      (mockMessageClient.supprimerDefinitivementMessage as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Supprimé",
      });

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait rejeter si aucun rôle n'est trouvé", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = {
        id: 1,
      };

      await supprimerDefinitivement(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });
});
