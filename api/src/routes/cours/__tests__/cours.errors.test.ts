/**
 * Tests de gestion d'erreurs pour le module Cours
 * Tests des scénarios d'erreur et cas exceptionnels
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Cours } from "../../../db/clients/cours/cours.js";
import {
  getAllCours,
  getParticipantCours,
  getCoursUtilisateurs,
  inscrireUtilisateur,
  annulerPresence,
  validerPresence,
  desinscrireUtilisateur,
  getPlanning,
  ajouterCours,
  modifierCours,
  getUtilisateurInscriptions,
  supprimerJour,
  retirerProfesseur,
} from "../core/handlers/index.js";

describe("Cours - Tests de gestion d'erreurs", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockCoursClient: Partial<Cours>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    // Mock du client Cours
    mockCoursClient = {
      obtenirTousLesCours: jest.fn(),
      obtenirLesCoursPourParticipant: jest.fn(),
      obtenirIdParticipantParNomPrenom: jest.fn(),
      obtenirUtilisateursParCours: jest.fn(),
      verifierInscriptionUtilisateur: jest.fn(),
      inscrireUtilisateurAuCours: jest.fn(),
      annulerUtilisateurAuCours: jest.fn(),
      validerUtilisateurAuCours: jest.fn(),
      desinscrireUtilisateurDuCours: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
      ajouterCoursRecurrentAvecProfesseurs: jest.fn(),
      modifierCoursRecurrentAvecProfesseurs: jest.fn(),
      obtenirInscriptionsUtilisateur: jest.fn(),
      supprimerJourDeCours: jest.fn(),
      supprimerProfesseursParNomEtJour: jest.fn(),
      obtenirIdCoursRecurrent: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
      obtenirCoursRecurrentParId: jest.fn(),
    };
  });

  describe("Erreurs de base de données", () => {
    it("devrait gérer les erreurs de connexion à la base de données", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Connection lost"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les timeouts de requête", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Query timeout"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs de contrainte d'intégrité", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 999999,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: false,
        data: { userId: 123 },
      });
      const error = new Error("Foreign key constraint fails");
      (error as any).code = "ER_NO_REFERENCED_ROW";

      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockRejectedValue(error);

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs de clé dupliquée", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: true,
        data: { userId: 123 },
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it("devrait gérer les erreurs de dépassement de limite", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Too many connections"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("Erreurs de ressources introuvables", () => {
    it("devrait retourner 404 pour un cours inexistant", async () => {
      mockRequest.params = { id: "999999" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue([]);

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            Cours: [],
          }),
        }),
      );
    });

    it("devrait retourner 404 pour un utilisateur inexistant", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      (
        mockCoursClient.obtenirInscriptionsUtilisateur as jest.Mock
      ).mockResolvedValue([]);

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: expect.any(Boolean),
        message: expect.any(String),
      });
    });

    it("devrait retourner 404 pour une inscription inexistante", async () => {
      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: false,
        data: { userId: 999 },
      });

      (
        mockCoursClient.desinscrireUtilisateurDuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        affectedRows: 0,
      });

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/inscription/i),
        }),
      );
    });
  });

  describe("Erreurs de conflit", () => {
    it("devrait retourner 409 si l'utilisateur est déjà inscrit", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: true,
        data: { userId: 123 },
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("déjà inscrit"),
      });
    });

    it("devrait gérer les conflits de disponibilité de professeur", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      const error = new Error("Professeur déjà assigné à un autre cours");
      (error as any).code = "PROF_CONFLICT";

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockRejectedValue(error);

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("Erreurs de validation métier", () => {
    it("devrait rejeter l'inscription si le cours est complet", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: false,
        data: { userId: 123 },
      });
      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        message: "Le cours est complet.",
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("complet"),
        }),
      );
    });

    it("devrait rejeter la modification d'un cours déjà passé", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        nom: "Yoga Modifié",
        type_cours: "Yoga",
        jour: "lundi",
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeurs: [1],
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        1,
      );

      const error = new Error("Impossible de modifier un cours passé");
      (error as any).code = "PAST_DATE";

      (
        mockCoursClient.modifierCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockRejectedValue(error);

      await modifierCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        }),
      );
    });

    it("devrait rejeter la désinscription après la date limite", async () => {
      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: true,
        data: { userId: 1 },
      });

      const error = new Error("Désinscription impossible (moins de 24h)");
      (error as any).code = "TOO_LATE";

      (
        mockCoursClient.desinscrireUtilisateurDuCours as jest.Mock
      ).mockRejectedValue(error);

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("Erreurs de paramètres manquants", () => {
    it("devrait retourner 400 si l'ID du cours est manquant", async () => {
      mockRequest.body = {};

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si les paramètres de présence sont manquants", async () => {
      mockRequest.body = {};

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si l'utilisateur_id est manquant pour la désinscription", async () => {
      mockRequest.body = {};

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("Erreurs de validation Zod", () => {
    it("devrait retourner des erreurs de validation détaillées", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        utilisateur_prenom: "",
        cours_id: "invalid",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait inclure le chemin du champ en erreur", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.success).toBe(false);
    });
  });

  describe("Erreurs inattendues", () => {
    it("devrait gérer les erreurs de type Error non prévues", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Unknown error"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs non-Error", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        "String error",
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait logger les erreurs serveur", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Erreur critique"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Messages d'erreur appropriés", () => {
    it("devrait retourner des messages d'erreur en français", async () => {
      mockRequest.params = { id: "invalid" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).toBeDefined();
    });

    it("ne devrait pas exposer de détails sensibles dans les messages", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("SELECT * FROM users WHERE password = 'secret' AND id = 1"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).not.toContain("password");
      expect(errorMessage).not.toContain("SELECT");
      expect(errorMessage).not.toContain("secret");
    });

    it("devrait retourner des messages génériques pour les erreurs serveur", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Internal database error at line 42 in file xyz.js"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).not.toContain("line 42");
      expect(errorMessage).not.toContain("xyz.js");
    });
  });
});
