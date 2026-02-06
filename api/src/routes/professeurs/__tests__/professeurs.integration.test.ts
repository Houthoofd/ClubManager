/**
 * Tests d'intégration pour le module Professeurs
 * Tests des flux complets et des interactions entre composants
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

describe("Professeurs Module - Tests d'intégration", () => {
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

  describe("Flux complet: Promotion d'un utilisateur en professeur", () => {
    it("devrait promouvoir un utilisateur, puis récupérer ses informations", async () => {
      // Étape 1: Promouvoir l'utilisateur
      mockRequest.body = {
        utilisateurs: [5],
      };

      const mockPromotionResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
        data: { promoted_users: [5] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockPromotionResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 5,
        first_name: "Sophie",
        last_name: "Bernard",
        email: "sophie.bernard@example.com",
        role_id: 3, // Avant promotion
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );

      // Étape 2: Récupérer les informations du professeur promu
      jest.clearAllMocks();
      mockRequest.params = { id: "5" };

      const mockProfesseur = {
        id: 5,
        first_name: "Sophie",
        last_name: "Bernard",
        email: "sophie.bernard@example.com",
        role_id: 2, // Après promotion
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 5,
            role_id: 2,
          }),
        }),
      );
    });

    it("devrait promouvoir plusieurs utilisateurs simultanément", async () => {
      mockRequest.body = {
        utilisateurs: [10, 11, 12],
      };

      const mockPromotionResult = {
        isConfirm: true,
        success: true,
        message: "3 professeurs promus avec succès",
        data: { promoted_users: [10, 11, 12] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockPromotionResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 10,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("succès"),
        }),
      );

      // Vérifier que tous les professeurs sont maintenant dans la liste
      jest.clearAllMocks();

      const mockProfesseurs = [
        {
          id: 10,
          first_name: "Pierre",
          last_name: "Durand",
          email: "pierre@example.com",
          role_id: 2,
          status_id: 1,
        },
        {
          id: 11,
          first_name: "Marie",
          last_name: "Curie",
          email: "marie@example.com",
          role_id: 2,
          status_id: 1,
        },
        {
          id: 12,
          first_name: "Albert",
          last_name: "Einstein",
          email: "albert@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue(mockProfesseurs);

      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3,
          data: expect.arrayContaining([
            expect.objectContaining({ id: 10 }),
            expect.objectContaining({ id: 11 }),
            expect.objectContaining({ id: 12 }),
          ]),
        }),
      );
    });
  });

  describe("Flux complet: Gestion du statut d'un professeur", () => {
    it("devrait modifier le statut d'un professeur actif en inactif", async () => {
      // Étape 1: Récupérer le professeur actif
      mockRequest.params = { id: "1" };

      const mockProfesseurActif = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        role_id: 2,
        status_id: 1, // Actif
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseurActif);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status_id: 1 }),
        }),
      );

      // Étape 2: Modifier le statut en inactif
      jest.clearAllMocks();
      mockRequest.body = {
        id: 1,
        status_id: 2, // Inactif
      };

      const mockModificationResult = {
        success: true,
        message: "Statut modifié avec succès",
        data: { id: 1, status_id: 2 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockModificationResult);

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );

      // Étape 3: Vérifier que le statut a bien été modifié
      jest.clearAllMocks();
      mockRequest.params = { id: "1" };

      const mockProfesseurInactif = {
        ...mockProfesseurActif,
        status_id: 2, // Inactif
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseurInactif);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status_id: 2 }),
        }),
      );
    });
  });

  describe("Flux complet: Gestion du planning d'un professeur", () => {
    it("devrait gérer un professeur sans cours assigné", async () => {
      mockRequest.params = { id: "5" };

      // Vérifier que le professeur existe
      const mockProfesseur = {
        id: 5,
        first_name: "Nouveau",
        last_name: "Professeur",
        email: "nouveau@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfesseur,
        }),
      );

      // Vérifier son planning (vide)
      jest.clearAllMocks();

      const mockPlanningVide = {
        isFind: false,
        message: "Aucun cours assigné",
        data: [],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanningVide);

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          isFind: false,
          data: [],
          count: 0,
        }),
      );
    });

    it("devrait récupérer un professeur avec plusieurs cours", async () => {
      mockRequest.params = { id: "1" };

      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: [
          {
            id: 1,
            nom_cours: "Yoga débutant",
            description: "Cours pour débutants",
            jour_semaine: "Lundi",
            heure_debut: "09:00",
            heure_fin: "10:00",
            salle: "Salle A",
            niveau: "Débutant",
            capacite_max: 15,
            professeur_id: 1,
            nombre_inscrits: 12,
          },
          {
            id: 2,
            nom_cours: "Yoga intermédiaire",
            description: "Cours niveau intermédiaire",
            jour_semaine: "Mercredi",
            heure_debut: "10:00",
            heure_fin: "11:30",
            salle: "Salle B",
            niveau: "Intermédiaire",
            capacite_max: 12,
            professeur_id: 1,
            nombre_inscrits: 10,
          },
          {
            id: 3,
            nom_cours: "Yoga avancé",
            description: "Cours pour pratiquants avancés",
            jour_semaine: "Vendredi",
            heure_debut: "18:00",
            heure_fin: "19:30",
            salle: "Salle C",
            niveau: "Avancé",
            capacite_max: 8,
            professeur_id: 1,
            nombre_inscrits: 7,
          },
        ],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isFind: true,
          data: expect.arrayContaining([
            expect.objectContaining({ nom_cours: "Yoga débutant" }),
            expect.objectContaining({ nom_cours: "Yoga intermédiaire" }),
            expect.objectContaining({ nom_cours: "Yoga avancé" }),
          ]),
          count: 3,
          professeur_id: 1,
        }),
      );
    });
  });

  describe("Flux complet: Scénarios complexes", () => {
    it("devrait gérer la promotion, modification de statut et récupération de planning", async () => {
      // Étape 1: Promouvoir un utilisateur
      mockRequest.body = {
        utilisateurs: [20],
      };

      const mockPromotionResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
        data: { promoted_users: [20] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockPromotionResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 20,
        first_name: "Lucas",
        last_name: "Moreau",
        email: "lucas@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Étape 2: Vérifier que le professeur est dans la liste
      jest.clearAllMocks();

      const mockProfesseurs = [
        {
          id: 20,
          first_name: "Lucas",
          last_name: "Moreau",
          email: "lucas@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue(mockProfesseurs);

      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ id: 20 })]),
        }),
      );

      // Étape 3: Modifier son statut
      jest.clearAllMocks();
      mockRequest.body = {
        id: 20,
        status_id: 3,
      };

      const mockModificationResult = {
        success: true,
        message: "Statut modifié",
        data: { id: 20, status_id: 3 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockModificationResult);

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Étape 4: Vérifier son planning (vide pour un nouveau professeur)
      jest.clearAllMocks();
      mockRequest.params = { id: "20" };

      const mockPlanning = {
        isFind: false,
        message: "Aucun cours assigné",
        data: [],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          isFind: false,
          data: [],
        }),
      );
    });

    it("devrait gérer les erreurs en cascade", async () => {
      // Tentative de récupération d'un professeur inexistant
      mockRequest.params = { id: "9999" };

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

      // Tentative de modification de statut pour un professeur inexistant
      jest.clearAllMocks();
      mockRequest.body = {
        id: 9999,
        status_id: 2,
      };

      const mockErrorResult = {
        success: false,
        message: "Professeur non trouvé",
        error: "Aucun professeur avec cet ID",
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockErrorResult);

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("Tests de cohérence des données", () => {
    it("devrait maintenir la cohérence après plusieurs opérations", async () => {
      const professeurId = 15;

      // 1. Vérifier état initial
      mockRequest.params = { id: professeurId.toString() };

      const mockProfesseurInitial = {
        id: professeurId,
        first_name: "Emma",
        last_name: "Dubois",
        email: "emma@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseurInitial);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status_id: 1 }),
        }),
      );

      // 2. Modifier le statut
      jest.clearAllMocks();
      mockRequest.body = {
        id: professeurId,
        status_id: 2,
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue({
        success: true,
        message: "Statut modifié",
        data: { id: professeurId, status_id: 2 },
      });

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // 3. Vérifier que le statut a bien changé
      jest.clearAllMocks();
      mockRequest.params = { id: professeurId.toString() };

      const mockProfesseurModifie = {
        ...mockProfesseurInitial,
        status_id: 2,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseurModifie);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status_id: 2 }),
        }),
      );
    });
  });
});
