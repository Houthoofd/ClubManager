/**
 * Tests de gestion d'erreurs pour le module Messages
 * Tests des cas d'erreur, erreurs serveur et résilience
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";
import { createTypesMessagesHandlers } from "../core/handlers/types-messages.handlers.js";
import { TypesMessagesService } from "../core/services/types-messages.service.js";
import { MessagesPersonnalisesService } from "../core/services/messages-personnalises.service.js";
import { createMessagesPersonnalisesHandlers } from "../core/handlers/messages-personnalises.handlers.js";

describe("Messages Module - Tests de gestion d'erreurs", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMessageClient: Partial<Message>;
  let mockService: TypesMessagesService;
  let mockPersonnalisesService: MessagesPersonnalisesService;
  let handlers: ReturnType<typeof createTypesMessagesHandlers>;
  let personnalisesHandlers: ReturnType<
    typeof createMessagesPersonnalisesHandlers
  >;

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
      supprimerMessageRecu: jest.fn(),
      compterMessagesNonLus: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
      envoyerRappelPaiementAvecEmail: jest.fn(),
      obtenirStatistiquesMessages: jest.fn(),
    };

    // Créer un service avec le client mocké
    mockService = new TypesMessagesService(mockMessageClient as Message);

    // Créer les handlers avec le service mocké
    handlers = createTypesMessagesHandlers(mockService);

    // Créer un service de messages personnalisés avec le client mocké
    mockPersonnalisesService = new MessagesPersonnalisesService(
      mockMessageClient as Message,
    );

    // Créer les handlers de messages personnalisés avec le service mocké
    personnalisesHandlers = createMessagesPersonnalisesHandlers(
      mockPersonnalisesService,
    );
  });

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion DB lors de la récupération des types", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("ECONNREFUSED: Connection refused"));

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

    it("devrait gérer une erreur de timeout DB", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Query timeout"));

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

    it("devrait gérer une erreur de contrainte d'intégrité", async () => {
      mockRequest.body = {
        title: "Titre",
        content: "Contenu",
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("ER_DUP_ENTRY: Duplicate entry"),
      );

      await handlers.createTypeMessage(
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

    it("devrait gérer une erreur de clé étrangère", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = {
        title: "Titre",
        content: "Contenu",
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockRejectedValue(
        new Error("ER_NO_REFERENCED_ROW: Foreign key constraint fails"),
      );

      await handlers.updateTypeMessage(
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

  describe("Erreurs de validation Zod", () => {
    it("devrait retourner des erreurs de validation détaillées pour un type invalide", async () => {
      mockRequest.body = {
        title: "",
        content: "",
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
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        }),
      );
    });

    it("devrait gérer des types de données incorrects", async () => {
      mockRequest.body = {
        title: 123,
        content: true,
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

    it("devrait gérer des destinataires invalides dans l'envoi de messages", async () => {
      mockRequest.body = {
        destinataires: "not-an-array",
        type_message_id: 1,
      };

      await personnalisesHandlers.envoyerMessage(
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

  describe("Erreurs de logique métier", () => {
    it("devrait gérer une tentative de création de type en double", async () => {
      mockRequest.body = {
        title: "Type existant",
        content: "Contenu",
      };

      // Mock de la vérification des doublons
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ title: "Type existant", content: "Ancien contenu" }],
      });

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Un type avec ce titre existe déjà",
      });

      await handlers.createTypeMessage(
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

    it("devrait gérer une tentative de modification d'un type inexistant", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = {
        title: "Nouveau titre",
        content: "Nouveau contenu",
      };

      // Mock de la vérification d'existence
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [{ id: 1, title: "Autre type", content: "Contenu" }],
      });

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Type non trouvé",
      });

      await handlers.updateTypeMessage(
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

    it("devrait gérer une tentative de suppression d'un type inexistant", async () => {
      mockRequest.params = { id: "999" };

      // Mock de la vérification d'existence
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

    it("devrait gérer un envoi de message avec un type inexistant", async () => {
      mockRequest.body = {
        destinataires: [1, 2, 3],
        type_message_id: 999,
        envoyerEmail: false,
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue({
        messagesInternes: {
          isConfirm: false,
          message: "Type de message non trouvé",
        },
        emailsEnvoyes: [],
        typeMessage: null,
      });

      await personnalisesHandlers.envoyerMessage(
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

  describe("Erreurs d'envoi d'emails", () => {
    it("devrait gérer une erreur SMTP lors de l'envoi de messages", async () => {
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
          { email: "user1@example.com", success: false, error: "SMTP error" },
          { email: "user2@example.com", success: false, error: "SMTP error" },
          { email: "user3@example.com", success: false, error: "SMTP error" },
        ],
        typeMessage: { title: "Test", content: "Contenu" },
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockResult);

      await personnalisesHandlers.envoyerMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("échec"),
        }),
      );
    });

    it("devrait gérer un échec partiel d'envoi d'emails", async () => {
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
        emailsEnvoyes: [
          { email: "user1@example.com", success: true, messageId: "msg1" },
          {
            email: "user2@example.com",
            success: false,
            error: "Invalid email",
          },
          { email: "user3@example.com", success: true, messageId: "msg3" },
          { email: "user4@example.com", success: false, error: "SMTP timeout" },
          { email: "user5@example.com", success: true, messageId: "msg5" },
        ],
        typeMessage: { title: "Test", content: "Contenu" },
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockResult);

      await personnalisesHandlers.envoyerMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            details: expect.objectContaining({
              emailsEnvoyes: 3,
              emailsEchecs: 2,
            }),
          }),
        }),
      );
    });
  });

  describe("Erreurs de rappel de paiement", () => {
    it("devrait gérer une erreur lors de l'envoi d'un rappel", async () => {
      mockRequest.body = {
        echeanceIds: [1, 2, 3],
        messagePersonnalise: "Veuillez payer",
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue({
        emailEnvoye: {
          success: false,
          error: "SMTP connection failed",
        },
      });

      await personnalisesHandlers.envoyerRappelPaiement(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait valider les IDs d'échéances pour le rappel", async () => {
      mockRequest.body = {
        echeanceIds: ["invalid", "data"],
        messagePersonnalise: "Rappel",
      };

      await personnalisesHandlers.envoyerRappelPaiement(
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

  describe("Erreurs de récupération de données", () => {
    it("devrait gérer l'absence de messages pour un utilisateur", async () => {
      mockRequest.params = { userId: "42" };
      mockRequest.query = { limit: "50" };

      (
        mockMessageClient.obtenirMessagesRecusParUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun message trouvé",
        data: [],
      });

      await personnalisesHandlers.getMessagesRecus(
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

    it("devrait gérer une erreur lors du comptage des messages non lus", async () => {
      mockRequest.params = { userId: "42" };

      (mockMessageClient.compterMessagesNonLus as jest.Mock).mockRejectedValue(
        new Error("Database connection lost"),
      );

      await personnalisesHandlers.compterMessagesNonLus(
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

  describe("Erreurs de suppression", () => {
    it("devrait gérer une tentative de suppression d'un message inexistant", async () => {
      mockRequest.params = { messageId: "999" };
      (mockRequest as any).user = { id: 42 };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Message non trouvé",
      });

      await personnalisesHandlers.supprimerMessage(
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

    it("devrait gérer une erreur DB lors de la suppression", async () => {
      mockRequest.params = { messageId: "10" };
      (mockRequest as any).user = { id: 42 };

      (mockMessageClient.supprimerMessageRecu as jest.Mock).mockRejectedValue(
        new Error("Database error during delete"),
      );

      await personnalisesHandlers.supprimerMessage(
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

  describe("Erreurs de marquage de message", () => {
    it("devrait gérer une tentative de marquage d'un message inexistant", async () => {
      mockRequest.params = { messageId: "999" };

      (mockMessageClient.marquerMessageCommeLu as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Message non trouvé",
      });

      await personnalisesHandlers.marquerMessageCommeLu(
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

    it("devrait gérer une erreur DB lors du marquage", async () => {
      mockRequest.params = { messageId: "10" };

      (mockMessageClient.marquerMessageCommeLu as jest.Mock).mockRejectedValue(
        new Error("Database lock timeout"),
      );

      await personnalisesHandlers.marquerMessageCommeLu(
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

  describe("Erreurs de statistiques", () => {
    it("devrait gérer une erreur lors de la récupération des statistiques", async () => {
      mockRequest.query = { periode: "mois" };
      (mockRequest as any).user = {
        id: 1,
        role: "super-administrateur",
      };

      (
        mockMessageClient.obtenirStatistiquesMessages as jest.Mock
      ).mockRejectedValue(new Error("Query execution failed"));

      await personnalisesHandlers.getStatistiquesMessages(
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

    it("devrait gérer l'absence de statistiques", async () => {
      mockRequest.query = { periode: "jour" };
      (mockRequest as any).user = {
        id: 1,
        role: "super-administrateur",
      };

      (
        mockMessageClient.obtenirStatistiquesMessages as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucune statistique disponible",
      });

      await personnalisesHandlers.getStatistiquesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("Erreurs de format de données", () => {
    it("devrait gérer un corps de requête malformé (JSON invalide simulé)", async () => {
      mockRequest.body = null;

      await handlers.createTypeMessage(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait gérer des paramètres manquants", async () => {
      mockRequest.params = {};

      await personnalisesHandlers.marquerMessageCommeLu(
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

  describe("Résilience et récupération", () => {
    it("devrait continuer à fonctionner après une erreur", async () => {
      // Première requête avec erreur
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValueOnce(new Error("Temporary error"));

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);

      // Deuxième requête réussie
      jest.clearAllMocks();
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: [],
      });

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait logger les erreurs pour le débogage", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Critical database error"));

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Gestion des erreurs de développement vs production", () => {
    it("devrait inclure les détails d'erreur en développement", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Detailed error message"));

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("ne devrait pas exposer les détails d'erreur en production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Sensitive error details"));

      await handlers.getAllTypesMessages(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );

      expect(jsonMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Sensitive"),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
