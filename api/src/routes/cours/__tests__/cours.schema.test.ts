/**
 * Tests de schéma et structure de données pour le module Cours
 * Validation de la structure des données retournées
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
  getPlanning,
  ajouterCours,
  getUtilisateurInscriptions,
} from "../core/handlers/index.js";

describe("Cours - Tests de schéma et structure", () => {
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
      annulerPresenceUtilisateur: jest.fn(),
      validerPresenceUtilisateur: jest.fn(),
      desinscrireUtilisateurDuCours: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
      ajouterCoursRecurrentAvecProfesseurs: jest.fn(),
      modifierCoursRecurrentAvecProfesseurs: jest.fn(),
      obtenirInscriptionsUtilisateur: jest.fn(),
      supprimerJourDeCours: jest.fn(),
      supprimerProfesseursParNomEtJour: jest.fn(),
      validerUtilisateurAuCours: jest.fn(),
      annulerUtilisateurAuCours: jest.fn(),
      obtenirIdCoursRecurrent: jest.fn(),
    };
  });

  describe("Structure de la réponse getAllCours", () => {
    it("devrait retourner une structure success/data", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          description: "Cours de yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
          professeur: "Martin",
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("devrait retourner des cours avec tous les champs requis", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          description: "Cours de yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
          professeur: "Martin",
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours).toHaveProperty("id");
      expect(cours).toHaveProperty("nom");
      expect(cours).toHaveProperty("date");
      expect(cours).toHaveProperty("heure_debut");
      expect(cours).toHaveProperty("heure_fin");
      expect(cours).toHaveProperty("places_disponibles");
    });

    it("devrait retourner des types de données corrects", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          description: "Cours de yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
          professeur: "Martin",
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(typeof cours.id).toBe("number");
      expect(typeof cours.nom).toBe("string");
      expect(typeof cours.date).toBe("string");
      expect(typeof cours.heure_debut).toBe("string");
      expect(typeof cours.heure_fin).toBe("string");
      expect(typeof cours.places_disponibles).toBe("number");
    });
  });

  describe("Structure de la réponse getParticipantCours", () => {
    it("devrait retourner une structure avec utilisateurs", async () => {
      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@test.com",
          statut: "confirmé",
        },
      ];

      mockRequest.params = { id: "1" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue({
        utilisateurs: mockParticipants,
      });

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response.data).toHaveProperty("Cours");
      expect(response.data.Cours).toHaveProperty("utilisateurs");
      expect(Array.isArray(response.data.Cours.utilisateurs)).toBe(true);
    });

    it("devrait retourner des participants avec tous les champs", async () => {
      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@test.com",
          statut: "confirmé",
        },
      ];

      mockRequest.params = { id: "1" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue({
        utilisateurs: mockParticipants,
      });

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const participant = response.data.Cours.utilisateurs[0];

      expect(participant).toHaveProperty("utilisateur_id");
      expect(participant).toHaveProperty("nom");
      expect(participant).toHaveProperty("prenom");
      expect(participant).toHaveProperty("email");
      expect(participant).toHaveProperty("statut");
    });

    it("devrait gérer une liste vide de participants", async () => {
      mockRequest.params = { id: "1" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue({
        utilisateurs: [],
      });

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.data.Cours.utilisateurs).toEqual([]);
      expect(Array.isArray(response.data.Cours.utilisateurs)).toBe(true);
    });
  });

  describe("Structure de la réponse inscription", () => {
    it("devrait retourner une structure success/message", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.obtenirIdParticipantParNomPrenom as jest.Mock
      ).mockResolvedValue({
        id: 123,
      });
      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isBooked: false,
        isFind: true,
        message: "L'utilisateur n'est pas encore inscrit au cours.",
        data: { userId: 123, inscriptionId: null },
      });

      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message:
          "L'utilisateur avec l'ID 123 a été inscrit au cours 1 avec succès.",
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("message");
      expect(typeof response.success).toBe("boolean");
      expect(typeof response.message).toBe("string");
    });

    it("devrait retourner success true pour une inscription réussie", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.obtenirIdParticipantParNomPrenom as jest.Mock
      ).mockResolvedValue(123);
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(true);
    });
  });

  describe("Structure de la réponse planning", () => {
    it("devrait retourner un tableau de jours", async () => {
      const mockPlanning = [
        {
          date: "2025-01-20",
          cours: [
            {
              id: 1,
              nom: "Yoga",
              heure_debut: "10:00",
              heure_fin: "11:00",
            },
          ],
        },
      ];

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        mockPlanning,
      );

      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("devrait retourner des jours avec date et cours", async () => {
      const mockPlanning = [
        {
          date: "2025-01-20",
          cours: [
            {
              id: 1,
              nom: "Yoga",
              heure_debut: "10:00",
              heure_fin: "11:00",
            },
          ],
        },
      ];

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        mockPlanning,
      );

      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const jour = response.data[0];

      expect(jour).toHaveProperty("date");
      expect(jour).toHaveProperty("cours");
      expect(Array.isArray(jour.cours)).toBe(true);
    });

    it("devrait retourner des cours avec tous les champs requis dans le planning", async () => {
      const mockPlanning = [
        {
          date: "2025-01-20",
          cours: [
            {
              id: 1,
              nom: "Yoga",
              heure_debut: "10:00",
              heure_fin: "11:00",
            },
          ],
        },
      ];

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        mockPlanning,
      );

      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0].cours[0];

      expect(cours).toHaveProperty("id");
      expect(cours).toHaveProperty("nom");
      expect(cours).toHaveProperty("heure_debut");
      expect(cours).toHaveProperty("heure_fin");
    });
  });

  describe("Structure de la réponse ajouterCours", () => {
    it("devrait retourner l'ID du cours créé", async () => {
      mockRequest.body = {
        nom: "Yoga",
        type_cours: "Yoga",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 15,
        professeurs: ["Martin"],
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Cours récurrent ajouté avec succès",
        id: 1,
      });

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty(
        "message",
        "Cours récurrent ajouté avec succès",
      );
      expect(response).toHaveProperty("data");
    });

    it("devrait inclure les détails du cours créé", async () => {
      mockRequest.body = {
        nom: "Yoga",
        type_cours: "Yoga",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 15,
        professeurs: ["Martin"],
      };

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Cours récurrent ajouté avec succès",
        id: 1,
      });

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.data).toHaveProperty("id", 1);
      expect(typeof response.data.id).toBe("number");
    });
  });

  describe("Structure de la réponse getUtilisateurInscriptions", () => {
    it("devrait retourner un tableau d'inscriptions", async () => {
      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          statut: "confirmé",
        },
      ];

      mockRequest.params = { userId: "1" };

      (
        mockCoursClient.obtenirInscriptionsUtilisateur as jest.Mock
      ).mockResolvedValue(mockInscriptions);

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("devrait retourner des inscriptions avec tous les champs", async () => {
      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          statut: "confirmé",
        },
      ];

      mockRequest.params = { userId: "123" };

      (
        mockCoursClient.obtenirInscriptionsUtilisateur as jest.Mock
      ).mockResolvedValue(mockInscriptions);

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data && response.data.length > 0) {
        const inscription = response.data[0];
        expect(inscription).toHaveProperty("cours_id");
        expect(inscription).toHaveProperty("cours_nom");
        expect(inscription).toHaveProperty("date");
        expect(inscription).toHaveProperty("heure_debut");
        expect(inscription).toHaveProperty("statut");
      }
    });
  });

  describe("Cohérence des structures d'erreur", () => {
    it("devrait retourner success false en cas d'erreur", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Erreur test"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
    });

    it("devrait retourner un message d'erreur", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Erreur test"),
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
    });

    it("devrait retourner un tableau errors pour les erreurs de validation", async () => {
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

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      if (response.errors) {
        expect(Array.isArray(response.errors)).toBe(true);
      }
    });
  });

  describe("Format des dates et heures", () => {
    it("devrait retourner les dates au format YYYY-MM-DD", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("devrait retourner les heures au format HH:MM", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.heure_debut).toMatch(/^\d{2}:\d{2}(:\d{2})?$/);
      expect(cours.heure_fin).toMatch(/^\d{2}:\d{2}(:\d{2})?$/);
    });
  });

  describe("Absence de données sensibles", () => {
    it("ne devrait pas exposer de données sensibles dans les réponses", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const response = jsonMock.mock.calls[0][0];
      const responseString = JSON.stringify(response);

      expect(responseString).not.toContain("password");
      expect(responseString).not.toContain("token");
      expect(responseString).not.toContain("secret");
    });
  });
});
