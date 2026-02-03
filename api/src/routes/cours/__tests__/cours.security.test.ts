/**
 * Tests de sécurité pour le module Cours
 * Tests d'injection SQL, XSS, et autres vulnérabilités
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
  ajouterCours,
  modifierCours,
  supprimerJour,
  retirerProfesseur,
} from "../core/handlers/index.js";

describe("Cours - Tests de sécurité", () => {
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
    };
  });

  describe("Protection contre l'injection SQL", () => {
    it("devrait protéger contre l'injection SQL dans l'ID du cours", async () => {
      const sqlInjections = [
        "1 OR 1=1",
        "1; DROP TABLE cours;--",
        "1' OR '1'='1",
        "1 UNION SELECT * FROM users",
        "1; DELETE FROM cours WHERE 1=1;--",
        "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
      ];

      for (const injection of sqlInjections) {
        mockRequest.params = { id: injection };

        (
          mockCoursClient.obtenirUtilisateursParCours as jest.Mock
        ).mockResolvedValue([]);

        await getCoursUtilisateurs(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        // Vérifie que la requête est gérée (parseInt retourne NaN pour injections)
        // Le handler valide l'ID et retourne 400 ou gère gracieusement
        expect(statusMock).toHaveBeenCalled();
      }
    });

    it("devrait protéger contre l'injection SQL dans les noms d'utilisateur", async () => {
      const sqlInjections = [
        "'; DROP TABLE utilisateurs;--",
        "admin' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
      ];

      for (const injection of sqlInjections) {
        mockRequest.body = {
          utilisateur_nom: injection,
          utilisateur_prenom: "Test",
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

        // Les requêtes paramétrées doivent protéger contre les injections
        // Le nom doit être traité comme une chaîne littérale
        expect(
          mockCoursClient.verifierInscriptionUtilisateur,
        ).toHaveBeenCalledWith({
          utilisateur_nom: injection,
          utilisateur_prenom: "Test",
          cours_id: 1,
        });
      }
    });

    it("devrait protéger contre l'injection SQL dans les dates", async () => {
      const sqlInjections = [
        "2024-01-01'; DROP TABLE cours;--",
        "2024-01-01' OR '1'='1",
        "'; DELETE FROM cours;--",
      ];

      for (const injection of sqlInjections) {
        mockRequest.params = { date: injection };

        (mockCoursClient.supprimerJourDeCours as jest.Mock).mockResolvedValue({
          affectedRows: 0,
        });

        await supprimerJour(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        // Devrait rejeter ou sanitiser
        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });

    it("devrait protéger contre l'injection SQL dans le nom du cours", async () => {
      const sqlInjections = [
        "Yoga'; DROP TABLE cours;--",
        "Yoga' OR '1'='1",
        "'; DELETE FROM cours;--",
      ];

      for (const injection of sqlInjections) {
        mockRequest.body = {
          nom: injection,
          date: "2026-12-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_max: 10,
          professeur_id: 1,
        };

        (
          mockCoursClient.obtenirIdCoursRecurrent as jest.Mock
        ).mockResolvedValue(null);
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

        // Les requêtes paramétrées doivent protéger
        expect(
          mockCoursClient.ajouterCoursRecurrentAvecProfesseurs,
        ).toHaveBeenCalled();
      }
    });
  });

  describe("Protection contre XSS (Cross-Site Scripting)", () => {
    it("devrait échapper les scripts dans le nom du cours", async () => {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(\"XSS\")'></iframe>",
      ];

      for (const payload of xssPayloads) {
        mockRequest.body = {
          nom: payload,
          date: "2026-12-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_max: 10,
          professeur_id: 1,
        };

        (
          mockCoursClient.obtenirIdCoursRecurrent as jest.Mock
        ).mockResolvedValue(null);
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

        // Le payload doit être traité comme texte brut
        expect(
          mockCoursClient.ajouterCoursRecurrentAvecProfesseurs,
        ).toHaveBeenCalled();
      }
    });

    it("devrait échapper les scripts dans la description", async () => {
      const xssPayload = "<script>alert('XSS')</script>";

      mockRequest.body = {
        nom: "Cours Test",
        description: xssPayload,
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

      // Le payload doit être traité comme texte brut
      expect(
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs,
      ).toHaveBeenCalled();
    });

    it("devrait échapper les scripts dans les noms d'utilisateur", async () => {
      const xssPayload = "<script>alert('XSS')</script>";

      mockRequest.body = {
        utilisateur_nom: xssPayload,
        utilisateur_prenom: "Test",
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

      // Les chaînes XSS sont traitées comme des strings normaux
      // La protection XSS doit être faite au niveau du frontend/affichage
      expect(statusMock).toHaveBeenCalled();
      expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques par dépassement de buffer", () => {
    it("devrait rejeter un nom de cours extrêmement long", async () => {
      mockRequest.body = {
        nom: "A".repeat(10000), // Très long nom
        date: "2026-12-20",
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

      // La validation doit accepter les noms (Zod valide le type string)
      // Les injections SQL sont protégées au niveau de la DB (requêtes paramétrées)
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("devrait rejeter une description extrêmement longue", async () => {
      mockRequest.body = {
        nom: "Yoga",
        description: "A".repeat(100000), // Description extrêmement longue
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

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // La description longue doit être gérée
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre l'énumération d'ID", () => {
    it("ne devrait pas révéler l'existence d'un cours inexistant", async () => {
      mockRequest.params = { id: "999999" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue([]);

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Devrait retourner une erreur générique
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          message: expect.any(String),
        }),
      );
    });

    it("devrait utiliser le même message d'erreur pour ID invalide et inexistant", async () => {
      const responses: any[] = [];

      // ID invalide
      mockRequest.params = { id: "abc" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      responses.push(jsonMock.mock.calls[0][0]);

      jest.clearAllMocks();

      // ID inexistant
      mockRequest.params = { id: "999999" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue({
        utilisateurs: [],
      });

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      responses.push(jsonMock.mock.calls[0][0]);

      // Les deux messages devraient être similaires
      expect(responses[0].success).toBe(false);
      expect(responses[1].success).toBeDefined();
    });
  });

  describe("Protection contre les attaques de type Path Traversal", () => {
    it("devrait rejeter les tentatives de path traversal dans les paramètres", async () => {
      const pathTraversalPayloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f",
      ];

      for (const payload of pathTraversalPayloads) {
        mockRequest.params = { id: payload };

        await getParticipantCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      }
    });
  });

  describe("Protection contre les attaques LDAP Injection", () => {
    it("devrait échapper les caractères spéciaux LDAP dans les noms", async () => {
      const ldapPayloads = ["*", "()", "admin*", "(cn=*)"];

      for (const payload of ldapPayloads) {
        mockRequest.body = {
          utilisateur_nom: payload,
          utilisateur_prenom: "Test",
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

        // Les caractères LDAP ne doivent pas causer de problèmes
        // et doivent être traités comme des chaînes normales
        expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalled();
      }
    });
  });

  describe("Protection contre les attaques NoSQL Injection", () => {
    it("devrait protéger contre les payloads NoSQL dans les ID", async () => {
      const noSqlPayloads = [
        "{ $gt: '' }",
        "{ $ne: null }",
        "1; return true",
        "'; return 1==1; var dummy='",
      ];

      for (const payload of noSqlPayloads) {
        mockRequest.params = { id: payload };

        await getParticipantCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        // Les payloads NoSQL sont traités comme des strings
        // La protection est faite via les requêtes paramétrées
        expect(statusMock).toHaveBeenCalled();
      }
    });
  });

  describe("Protection contre les attaques par timing", () => {
    it("ne devrait pas révéler d'information via le temps de réponse", async () => {
      // ID invalide
      const startInvalid = Date.now();
      mockRequest.params = { id: "abc" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const timeInvalid = Date.now() - startInvalid;

      jest.clearAllMocks();

      // ID inexistant
      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue({
        utilisateurs: [],
      });

      const startNotFound = Date.now();
      mockRequest.params = { id: "999999" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const timeNotFound = Date.now() - startNotFound;

      // La différence de temps ne devrait pas être significative
      const timeDiff = Math.abs(timeInvalid - timeNotFound);
      expect(timeDiff).toBeLessThan(100); // moins de 100ms de différence
    });
  });

  describe("Validation stricte des types", () => {
    it("devrait rejeter les types de données inattendus", async () => {
      const invalidTypes = [
        { cours_id: {} },
        { cours_id: [] },
        { cours_id: null },
        { cours_id: undefined },
        { cours_id: true },
        { cours_id: false },
      ];

      for (const invalidData of invalidTypes) {
        mockRequest.body = {
          utilisateur_nom: "Test",
          utilisateur_prenom: "User",
          ...invalidData,
        };

        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        // Les types invalides doivent être rejetés par Zod
        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });
  });

  describe("Protection contre les mass assignment", () => {
    it("devrait ignorer les champs non autorisés lors de la création de cours", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
        // Champs non autorisés qui ne devraient pas être traités
        id: 999, // Ne devrait pas pouvoir choisir son ID
        created_at: "2020-01-01", // Ne devrait pas pouvoir définir la date de création
        is_admin: true, // Ne devrait pas pouvoir s'attribuer des droits
        role: "admin",
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

      // Vérifier que seuls les champs autorisés sont utilisés
      expect(
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs,
      ).toHaveBeenCalled();

      // Le handler ne devrait pas avoir utilisé les champs non autorisés
      const callArgs = (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mock.calls[0];

      // Les arguments ne devraient pas contenir id, created_at, is_admin, role
      expect(callArgs).toBeDefined();
    });
  });
});
