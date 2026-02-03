/**
 * Tests de validation pour le module Cours
 * Validation des données entrantes et des règles métier
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Cours } from "../../../db/clients/cours/cours.js";
import {
  inscrireUtilisateur,
  ajouterCours,
  modifierCours,
  validerPresence,
  annulerPresence,
  desinscrireUtilisateur,
  getParticipantCours,
  getCoursUtilisateurs,
  supprimerJour,
  retirerProfesseur,
} from "../core/handlers/index.js";

describe("Cours - Tests de validation", () => {
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
    };
  });

  describe("Validation des inscriptions", () => {
    it("devrait rejeter une inscription sans utilisateur_nom", async () => {
      mockRequest.body = {
        utilisateur_prenom: "Jean",
        cours_id: 1,
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
          message: expect.stringContaining("nom"),
        }),
      );
    });

    it("devrait rejeter une inscription sans utilisateur_prenom", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        cours_id: 1,
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
          message: expect.stringContaining("prenom"),
        }),
      );
    });

    it("devrait rejeter une inscription sans cours_id", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
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
          message: expect.stringContaining("cours_id"),
        }),
      );
    });

    it("devrait accepter des données d'inscription valides", async () => {
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

      expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalled();
    });
  });

  describe("Validation de l'ajout de cours", () => {
    it("devrait rejeter un cours sans nom", async () => {
      mockRequest.body = {
        description: "Description",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("nom"),
        }),
      );
    });

    it("devrait rejeter un cours avec une date invalide", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "invalid-date",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("date"),
        }),
      );
    });

    it("devrait rejeter un cours avec heure_fin avant heure_debut", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-06-20",
        heure_debut: "11:00",
        heure_fin: "10:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("heure"),
        }),
      );
    });

    it("devrait rejeter un cours avec un nombre de places invalide", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: -5,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("places"),
        }),
      );
    });

    it("devrait rejeter un cours avec places_max = 0", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 0,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("places"),
        }),
      );
    });
  });

  describe("Validation des IDs", () => {
    it("devrait rejeter un ID de cours non numérique", async () => {
      mockRequest.params = { id: "abc" };

      await getCoursUtilisateurs(
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

    it("devrait rejeter un ID de cours négatif", async () => {
      mockRequest.params = { id: "-1" };

      await getCoursUtilisateurs(
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

    it("devrait accepter un ID valide", async () => {
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

      expect(mockCoursClient.obtenirUtilisateursParCours).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe("Validation des dates", () => {
    it("devrait rejeter une date dans le passé", async () => {
      const datePasse = new Date();
      datePasse.setDate(datePasse.getDate() - 1);

      mockRequest.body = {
        nom: "Yoga",
        date: datePasse.toISOString().split("T")[0],
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("passé"),
        }),
      );
    });

    it("devrait accepter une date valide dans le futur", async () => {
      const dateFutur = new Date();
      dateFutur.setDate(dateFutur.getDate() + 7);

      mockRequest.body = {
        nom: "Yoga",
        date: dateFutur.toISOString().split("T")[0],
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        id: 1,
        insertId: 1,
        affectedRows: 1,
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

  describe("Validation de la présence", () => {
    it("devrait rejeter une validation de présence sans utilisateur_nom", async () => {
      mockRequest.body = {
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("nom"),
        }),
      );
    });

    it("devrait rejeter une validation de présence sans cours_id", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("cours_id"),
        }),
      );
    });
  });

  describe("Validation de la désinscription", () => {
    it("devrait rejeter une désinscription sans utilisateur_nom", async () => {
      mockRequest.body = {
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("nom"),
        }),
      );
    });
  });

  describe("Validation de la suppression de jour", () => {
    it("devrait rejeter un jour invalide", async () => {
      mockRequest.body = { jourSemaine: "invalid" };

      await supprimerJour(
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

    it("devrait accepter un jour valide", async () => {
      mockRequest.body = { jourSemaine: "lundi" };

      (mockCoursClient.supprimerJourDeCours as jest.Mock).mockResolvedValue({
        message: "Cours du lundi supprimé avec succès",
      });

      await supprimerJour(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(mockCoursClient.supprimerJourDeCours).toHaveBeenCalledWith(1);
    });
  });

  describe("Validation du retrait de professeur", () => {
    it("devrait rejeter un retrait sans professeursNoms", async () => {
      mockRequest.body = {
        jour: "lundi",
      };

      await retirerProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("professeursNoms"),
        }),
      );
    });

    it("devrait rejeter un retrait sans jour", async () => {
      mockRequest.body = {
        professeursNoms: ["Martin"],
      };

      await retirerProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("jour"),
        }),
      );
    });
  });

  describe("Validation des limites de capacité", () => {
    it("devrait empêcher l'inscription si le cours est complet", async () => {
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
        isConfirm: false,
        message: "Le cours est complet",
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
  });

  describe("Validation des noms", () => {
    it("devrait rejeter un nom de cours trop court", async () => {
      mockRequest.body = {
        nom: "A",
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("nom"),
        }),
      );
    });

    it("devrait rejeter un nom de cours trop long", async () => {
      mockRequest.body = {
        nom: "A".repeat(256),
        date: "2026-06-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("nom"),
        }),
      );
    });
  });
});
