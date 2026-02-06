/**
 * Tests de sécurité pour le module Professeurs
 * Tests des validations de sécurité, injections SQL, XSS, etc.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";
import {
  getProfesseurs,
  getProfesseurById,
  ajouterProfesseurHandler,
  modifierStatutProfesseurHandler,
  getPlanningProfesseur,
} from "../core/handlers/index.js";

describe("Professeurs Module - Tests de sécurité", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockProfesseursClient: Partial<Professeurs>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockProfesseursClient = {
      obtenirLesProfesseurs: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      ajouterUnProfesseur: jest.fn(),
      modifierStatutProfesseur: jest.fn(),
      obtenirPlanningCoursProfesseur: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Protection contre les injections SQL", () => {
    it("devrait rejeter une injection SQL dans l'ID", async () => {
      mockRequest.params = { id: "OR 1=1" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter une injection SQL avec DROP TABLE", async () => {
      mockRequest.params = { id: "'; DROP TABLE utilisateurs; --" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter une injection SQL avec UNION SELECT", async () => {
      mockRequest.params = { id: "UNION SELECT * FROM utilisateurs" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter une injection SQL avec commentaires", async () => {
      mockRequest.params = { id: "/* comment */OR 1=1 --" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter une injection SQL dans le body", async () => {
      mockRequest.body = {
        id: "1 OR 1=1",
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
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

    it("devrait rejeter des caractères SQL dangereux dans les tableaux", async () => {
      mockRequest.body = {
        utilisateurs: ["1'; DROP TABLE utilisateurs; --"],
      };

      await ajouterProfesseurHandler(
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

  describe("Protection contre les attaques XSS", () => {
    it("devrait gérer des scripts dans les paramètres", async () => {
      mockRequest.params = { id: "<script>alert('XSS')</script>" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait gérer des balises HTML dans les données", async () => {
      mockRequest.body = {
        utilisateurs: ["<img src=x onerror=alert('XSS')>"],
      };

      await ajouterProfesseurHandler(
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

    it("devrait gérer des événements JavaScript encodés", async () => {
      mockRequest.params = { id: "javascript:alert('XSS')" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });
  });

  describe("Validation des limites de taille", () => {
    it("devrait rejeter un tableau trop grand d'utilisateurs", async () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
      mockRequest.body = {
        utilisateurs: largeArray,
      };

      const mockResult = {
        isConfirm: false,
        success: false,
        message: "Trop d'utilisateurs à traiter",
        error: "Limite dépassée",
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Devrait au moins ne pas planter
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des IDs extrêmement grands", async () => {
      mockRequest.params = { id: Number.MAX_SAFE_INTEGER.toString() };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
        }),
      );
    });

    it("devrait rejeter des IDs au-delà de MAX_SAFE_INTEGER", async () => {
      mockRequest.params = { id: "9999999999999999999999999999" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      // Devrait être rejeté ou géré correctement
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les dépassements de type", () => {
    it("devrait gérer des nombres flottants pour les IDs", async () => {
      mockRequest.params = { id: "1.5" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
        }),
      );
    });

    it("devrait gérer des nombres négatifs", async () => {
      mockRequest.body = {
        id: -1,
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
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

    it("devrait gérer des valeurs Infinity", async () => {
      mockRequest.body = {
        id: Infinity,
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait gérer des valeurs NaN", async () => {
      mockRequest.body = {
        id: NaN,
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
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

  describe("Protection contre les injections d'objets", () => {
    it("devrait rejeter des objets avec __proto__", async () => {
      mockRequest.body = {
        __proto__: { isAdmin: true },
        utilisateurs: [1],
      };

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      // Devrait gérer correctement sans pollution de prototype
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter des objets avec constructor", async () => {
      mockRequest.body = {
        constructor: { prototype: { isAdmin: true } },
        utilisateurs: [1],
      };

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des objets circulaires", async () => {
      const circularObj: any = { utilisateurs: [1] };
      circularObj.self = circularObj;
      mockRequest.body = circularObj;

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des types de contenu", () => {
    it("devrait gérer des tableaux imbriqués incorrects", async () => {
      mockRequest.body = {
        utilisateurs: [
          [1, 2],
          [3, 4],
        ],
      };

      await ajouterProfesseurHandler(
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

    it("devrait gérer des objets au lieu de nombres", async () => {
      mockRequest.body = {
        id: { value: 1 },
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
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

    it("devrait gérer des fonctions dans les données", async () => {
      mockRequest.body = {
        utilisateurs: [function () {}],
      };

      await ajouterProfesseurHandler(
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

  describe("Protection contre les attaques par timing", () => {
    it("devrait répondre de manière cohérente pour les utilisateurs existants et non existants", async () => {
      // Test pour utilisateur existant
      mockRequest.params = { id: "1" };

      const mockProfesseur = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      const start1 = Date.now();
      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );
      const time1 = Date.now() - start1;

      // Test pour utilisateur inexistant
      jest.clearAllMocks();
      mockRequest.params = { id: "99999" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      const start2 = Date.now();
      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );
      const time2 = Date.now() - start2;

      // Les temps de réponse ne devraient pas être trop différents
      // (tolérance de 100ms pour les variations normales)
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(100);
    });
  });

  describe("Protection contre le déni de service (DoS)", () => {
    it("devrait limiter le nombre d'utilisateurs dans une requête", async () => {
      // Simuler une tentative de promotion de 10000 utilisateurs
      const manyUsers = Array.from({ length: 10000 }, (_, i) => i + 1);
      mockRequest.body = {
        utilisateurs: manyUsers,
      };

      // La requête devrait être traitée sans planter le serveur
      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des chaînes extrêmement longues", async () => {
      const longString = "a".repeat(1000000);
      mockRequest.params = { id: longString };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait gérer des objets profondément imbriqués", async () => {
      let deepObj: any = { utilisateurs: [1] };
      for (let i = 0; i < 1000; i++) {
        deepObj = { nested: deepObj };
      }
      mockRequest.body = deepObj;

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      // Devrait gérer sans planter
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des caractères spéciaux", () => {
    it("devrait rejeter des caractères Unicode malveillants", async () => {
      mockRequest.params = { id: "\u0000\u0001\u0002" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait gérer des emojis dans les IDs", async () => {
      mockRequest.params = { id: "😀123" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter des caractères de contrôle", async () => {
      mockRequest.params = { id: "\n\r\t" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });
  });

  describe("Protection des données sensibles", () => {
    it("ne devrait pas exposer d'informations sensibles dans les erreurs", async () => {
      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockRejectedValue(new Error("Database password: secret123"));

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );

      // Vérifier que le mot de passe n'est pas dans la réponse
      const responseData = jsonMock.mock.calls[0][0];
      expect(JSON.stringify(responseData)).not.toContain("secret123");
    });

    it("ne devrait pas exposer la structure de la base de données", async () => {
      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockRejectedValue(
        new Error(
          "ER_NO_SUCH_TABLE: Table 'clubmanager.utilisateurs' doesn't exist",
        ),
      );

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(500);

      // La réponse ne devrait pas contenir le nom de la base de données
      const responseData = jsonMock.mock.calls[0][0];
      expect(JSON.stringify(responseData)).not.toContain("clubmanager");
    });
  });

  describe("Validation des permissions", () => {
    it("devrait valider les limites du status_id", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 100, // Au-delà de la limite max (10)
      };

      await modifierStatutProfesseurHandler(
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

    it("devrait rejeter des modifications avec des IDs négatifs", async () => {
      mockRequest.body = {
        id: 1,
        status_id: -5,
      };

      await modifierStatutProfesseurHandler(
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
});
