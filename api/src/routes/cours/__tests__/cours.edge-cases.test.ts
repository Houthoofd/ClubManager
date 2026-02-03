/**
 * Tests de cas limites pour le module Cours
 * Tests des situations extrêmes et inhabituelles
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
  supprimerJour,
} from "../core/handlers/index.js";

describe("Cours - Tests des cas limites", () => {
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
      obtenirJoursActifs: jest.fn(),
      obtenirCoursRecurrentParId: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
    };
  });

  describe("Valeurs limites et extrêmes", () => {
    it("devrait gérer un ID de cours avec la valeur maximale d'un entier", async () => {
      mockRequest.params = { id: "2147483647" };

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
        2147483647,
      );
    });

    it("devrait gérer un cours avec 0 places disponibles", async () => {
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
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Le cours est complet.",
      });
    });

    it("devrait gérer un cours avec le nombre maximum de participants", async () => {
      const maxParticipants = Array.from({ length: 1000 }, (_, i) => ({
        utilisateur_id: i + 1,
        nom: `Nom${i}`,
        prenom: `Prenom${i}`,
        email: `user${i}@test.com`,
        statut: "confirmé",
      }));

      mockRequest.params = { id: "1" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue(maxParticipants);

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            Cours: maxParticipants,
          }),
        }),
      );
    });

    it("devrait gérer une liste vide de cours", async () => {
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

    it("devrait gérer un planning vide", async () => {
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe("Caractères spéciaux et Unicode", () => {
    it("devrait gérer des noms avec des caractères accentués", async () => {
      mockRequest.body = {
        utilisateur_nom: "Müller",
        utilisateur_prenom: "François",
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledWith({
        utilisateur_nom: "Müller",
        utilisateur_prenom: "François",
        cours_id: 1,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms avec des apostrophes", async () => {
      mockRequest.body = {
        utilisateur_nom: "O'Brien",
        utilisateur_prenom: "D'Angelo",
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledWith({
        utilisateur_nom: "O'Brien",
        utilisateur_prenom: "D'Angelo",
        cours_id: 1,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms avec des tirets et espaces", async () => {
      mockRequest.body = {
        utilisateur_nom: "Martin-Dupont",
        utilisateur_prenom: "Jean Pierre",
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledWith({
        utilisateur_nom: "Martin-Dupont",
        utilisateur_prenom: "Jean Pierre",
        cours_id: 1,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms de cours avec emojis", async () => {
      mockRequest.body = {
        nom: "Yoga 🧘‍♀️",
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

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
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
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Dates et heures limites", () => {
    it("devrait gérer un cours à minuit", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "00:00",
        heure_fin: "01:00",
        places_max: 10,
        professeur_id: 1,
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
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un cours se terminant à 23:59", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "22:00",
        heure_fin: "23:59",
        places_max: 10,
        professeur_id: 1,
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
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une date limite (année 2099)", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2099-12-31",
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

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
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
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer les années bissextiles (29 février)", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2028-02-29",
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

  describe("Espaces et formatage", () => {
    it("devrait gérer des noms avec espaces au début et à la fin", async () => {
      mockRequest.body = {
        utilisateur_nom: "  Dupont  ",
        utilisateur_prenom: "  Jean  ",
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Le handler devrait normaliser (trim) les espaces
      expect(mockCoursClient.verifierInscriptionUtilisateur).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms avec espaces multiples", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean    Pierre",
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(mockCoursClient.verifierInscriptionUtilisateur).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Requêtes concurrentes", () => {
    it("devrait gérer plusieurs inscriptions simultanées au même cours", async () => {
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
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      // Simuler plusieurs appels concurrents
      const promises = Array(5)
        .fill(null)
        .map(() =>
          inscrireUtilisateur(
            { ...mockRequest } as Request,
            { ...mockResponse } as Response,
            mockCoursClient as Cours,
          ),
        );

      await Promise.all(promises);

      // Vérifier que toutes les inscriptions ont été tentées
      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledTimes(5);
    });

    it("devrait gérer les modifications concurrentes d'un cours", async () => {
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

      (
        mockCoursClient.modifierCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        affectedRows: 1,
      });

      // Simuler plusieurs modifications concurrentes
      const promises = Array(3)
        .fill(null)
        .map(() =>
          modifierCours(
            mockRequest as Request,
            mockResponse as Response,
            mockCoursClient as Cours,
          ),
        );

      await Promise.all(promises);

      expect(
        mockCoursClient.modifierCoursRecurrentAvecProfesseurs,
      ).toHaveBeenCalledTimes(3);
    });
  });

  describe("Cas de suppression", () => {
    it("devrait gérer la suppression d'un jour sans cours", async () => {
      mockRequest.body = { jourSemaine: "lundi" };

      (mockCoursClient.supprimerJourDeCours as jest.Mock).mockResolvedValue({
        affectedRows: 0,
        message: "Aucun cours trouvé pour ce jour.",
      });

      await supprimerJour(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Aucun cours trouvé pour ce jour.",
      });
    });

    it("devrait gérer la suppression multiple de cours en un jour", async () => {
      mockRequest.body = { jourSemaine: "lundi" };

      (mockCoursClient.supprimerJourDeCours as jest.Mock).mockResolvedValue({
        affectedRows: 5,
        message: "5 cours supprimé(s) pour le lundi.",
      });

      await supprimerJour(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "5 cours supprimé(s) pour le lundi.",
      });
    });
  });

  describe("Valeurs nulles et undefined", () => {
    it("devrait gérer les paramètres undefined", async () => {
      mockRequest.params = { id: undefined as any };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer les champs null dans le body", async () => {
      mockRequest.body = {
        utilisateur_nom: null,
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Opérations sur présence", () => {
    it("devrait gérer la validation de présence multiple fois", async () => {
      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      (
        mockCoursClient.validerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        affectedRows: 1,
      });

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Deuxième validation
      jest.clearAllMocks();
      jsonMock.mockClear();
      statusMock.mockClear();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.status = statusMock;

      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      (
        mockCoursClient.validerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        affectedRows: 0,
      });

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait gérer l'annulation puis la validation de présence", async () => {
      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      // Annulation
      (
        mockCoursClient.annulerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        affectedRows: 1,
      });

      await annulerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Présence annulée avec succès.",
      });

      // Validation après annulation
      jest.clearAllMocks();
      jsonMock.mockClear();
      statusMock.mockClear();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.status = statusMock;

      mockRequest.body = {
        cours_id: 1,
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
      };

      (
        mockCoursClient.validerUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        affectedRows: 1,
      });

      await validerPresence(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Présence validée avec succès.",
      });
    });
  });

  describe("Cohérence des données", () => {
    it("devrait gérer un cours avec des données minimales", async () => {
      mockRequest.body = {
        nom: "Y",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 1,
        professeur_id: 1,
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait retourner un planning bien structuré même vide", async () => {
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
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
  });
});
