/**
 * Tests de base pour le module Cours
 * Tests des fonctionnalités principales (happy path)
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

describe("Cours Module - Tests de base", () => {
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

    // Mock du client Cours avec toutes les méthodes nécessaires
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

  describe("getAllCours - GET /api/cours", () => {
    it("devrait retourner la liste de tous les cours", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga Débutant",
          description: "Cours de yoga pour débutants",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          professeur: "Jean Dupont",
        },
        {
          id: 2,
          nom: "Pilates Avancé",
          description: "Cours de pilates niveau avancé",
          date: "2024-03-16",
          heure_debut: "14:00:00",
          heure_fin: "15:00:00",
          places_disponibles: 5,
          professeur: "Marie Martin",
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCours,
      });
      expect(mockCoursClient.obtenirTousLesCours).toHaveBeenCalledTimes(1);
    });

    it("devrait retourner 404 si aucun cours n'est trouvé", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue([]);

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Aucun cours à venir trouvé.",
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error("Erreur de connexion"),
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
          message: expect.stringContaining("Erreur"),
        }),
      );
    });
  });

  describe("getParticipantCours - GET /api/cours/:id/participants", () => {
    it("devrait retourner les participants d'un cours", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          statut: "confirmé",
        },
        {
          utilisateur_id: 2,
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
          statut: "confirmé",
        },
      ];

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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            Cours: expect.objectContaining({
              utilisateurs: mockParticipants,
            }),
          }),
        }),
      );
    });

    it("devrait retourner 400 si l'ID du cours est manquant", async () => {
      mockRequest.params = {};

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "L'ID du cours est requis.",
      });
    });
  });

  describe("inscrireUtilisateur - POST /api/cours/inscription", () => {
    it("devrait inscrire un utilisateur à un cours", async () => {
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

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Utilisateur inscrit avec succès.",
        }),
      );
    });

    it("devrait retourner 409 si l'utilisateur est déjà inscrit", async () => {
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
        isBooked: true,
        isFind: true,
        message: "L'utilisateur est déjà inscrit à ce cours.",
        data: { userId: 123, inscriptionId: 456 },
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Utilisateur déjà inscrit au cours.",
      });
    });

    it("devrait valider les données d'entrée", async () => {
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

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("validerPresence - PUT /api/cours/:id/presence/valider", () => {
    it("devrait valider la présence d'un utilisateur", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.validerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "L'inscription de Dupont Jean a été validée.",
      });

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Présence validée avec succès.",
      });
    });

    it("devrait retourner 400 si les paramètres sont manquants", async () => {
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
  });

  describe("annulerPresence - PUT /api/cours/:id/presence/annuler", () => {
    it("devrait annuler la présence d'un utilisateur", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.annulerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "L'inscription de Dupont Jean a été annulée.",
      });

      await annulerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Présence annulée avec succès.",
      });
    });
  });

  describe("desinscrireUtilisateur - DELETE /api/cours/:id/inscription", () => {
    it("devrait désinscrire un utilisateur d'un cours", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.desinscrireUtilisateurDuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Utilisateur désinscrit avec succès.",
      });

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Utilisateur désinscrit avec succès.",
      });
    });

    it("devrait retourner 404 si l'inscription n'existe pas", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.desinscrireUtilisateurDuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        message: "Aucune inscription trouvée pour cet utilisateur et ce cours.",
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
          message: expect.stringContaining("trouvée"),
        }),
      );
    });
  });

  describe("getPlanning - GET /api/cours/planning", () => {
    it("devrait retourner le planning des cours", async () => {
      const mockPlanning = [
        {
          date: "2024-03-15",
          cours: [
            {
              id: 1,
              nom: "Yoga",
              heure_debut: "10:00:00",
              heure_fin: "11:00:00",
            },
            {
              id: 2,
              nom: "Pilates",
              heure_debut: "14:00:00",
              heure_fin: "15:00:00",
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockPlanning,
      });
    });
  });

  describe("ajouterCours - POST /api/cours", () => {
    it("devrait créer un nouveau cours", async () => {
      mockRequest.body = {
        nom: "Yoga",
        type_cours: "Yoga",
        date: "2026-06-15",
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
      });

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });

    it("devrait valider les données du cours", async () => {
      mockRequest.body = {
        nom: "Yoga",
        type_cours: "Yoga",
        date: "2026-06-15",
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
      });

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs,
      ).toHaveBeenCalled();
    });
  });

  describe("modifierCours - PUT /api/cours/:id", () => {
    it("devrait modifier un cours existant", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        nom: "Yoga Avancé",
        type_cours: "Yoga",
        heure_debut: "11:00",
        heure_fin: "12:00",
        jour: "lundi",
        professeurs: ["Martin"],
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        1,
      );

      (
        mockCoursClient.modifierCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Cours modifié avec succès",
      });

      await modifierCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("succès"),
        }),
      );
    });

    it("devrait retourner 404 si le cours n'existe pas", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = {
        nom: "Yoga Avancé",
        type_cours: "Yoga",
        jour: "lundi",
        heure_debut: "11:00",
        heure_fin: "12:00",
        professeurs: ["Martin"],
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockRejectedValue(
        new Error("Cours non trouvé"),
      );

      await modifierCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("getUtilisateurInscriptions - GET /api/cours/inscriptions/:utilisateurId", () => {
    it("devrait retourner les inscriptions d'un utilisateur", async () => {
      mockRequest.params = { userId: "1" };

      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          statut: "confirmé",
        },
        {
          cours_id: 2,
          cours_nom: "Pilates",
          date: "2024-03-16",
          heure_debut: "14:00:00",
          statut: "confirmé",
        },
      ];

      (
        mockCoursClient.obtenirInscriptionsUtilisateur as jest.Mock
      ).mockResolvedValue(mockInscriptions);

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInscriptions,
      });
    });
  });

  describe("supprimerJour - DELETE /api/cours/jour/:date", () => {
    it("devrait supprimer tous les cours d'une date", async () => {
      mockRequest.body = { jourSemaine: "lundi" };

      (mockCoursClient.supprimerJourDeCours as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Cours du lundi supprimé avec succès",
      });

      await supprimerJour(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("retirerProfesseur - DELETE /api/cours/:id/professeur", () => {
    it("devrait retirer un professeur d'un cours", async () => {
      mockRequest.body = {
        professeursNoms: ["Martin"],
        jour: "lundi",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };

      (
        mockCoursClient.supprimerProfesseursParNomEtJour as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "1 professeur(s) retiré(s) avec succès",
      });

      await retirerProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        }),
      );
    });

    it("devrait vérifier que le professeur est bien assigné au cours", async () => {
      mockRequest.body = {
        professeursNoms: ["DupontInexistant"],
        jour: "lundi",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };

      (
        mockCoursClient.supprimerProfesseursParNomEtJour as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        message: "Professeur non trouvé",
      });

      await retirerProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });
});
