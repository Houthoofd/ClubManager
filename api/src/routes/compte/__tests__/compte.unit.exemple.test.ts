/**
 * Exemple de tests unitaires pour le module Compte
 * Utilise l'injection de dépendance (pattern identique aux tests cours)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Compte } from "../../../db/clients/compte/compte.js";
import {
  getInformations,
  createPassword,
  changePassword,
  updateAccount,
} from "../core/handlers/index.js";

describe("Compte Module - Exemple avec injection de dépendance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockCompteClient: Partial<Compte>;

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

    // Mock du client Compte - on peut facilement mocker les méthodes
    mockCompteClient = {
      obtenirInformationsUtilisateur: jest.fn(),
      obtenirUnUtilisateurParSonNomEtPrenom: jest.fn(),
      mettreAJourMotDePasse: jest.fn(),
      mettreAJourUtilisateurAvecConversion: jest.fn(),
    };
  });

  describe("getInformations - POST /api/compte/informations", () => {
    it("devrait retourner les informations d'un utilisateur existant", async () => {
      // Arrange - Préparer les données mockées
      const mockUtilisateur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        nom_utilisateur: "johndoe",
        email: "john.doe@example.com",
        genres: "Homme",
        status: "Actif",
        grades: "Ceinture Blanche",
        abonnement: "Mensuel",
        date_of_birth: new Date("1990-01-01"),
      };

      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
      };

      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        message: "Utilisateur trouvé",
        data: mockUtilisateur,
      });

      // Act - Appeler le handler avec le mock injecté
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert - Vérifier le comportement
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).toHaveBeenCalledWith("John", "Doe");
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        utilisateur: mockUtilisateur,
      });
    });

    it("devrait retourner 404 si l'utilisateur n'existe pas", async () => {
      // Arrange
      mockRequest.body = {
        prenom: "Unknown",
        nom: "User",
      };

      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun utilisateur trouvé",
        data: [],
      });

      // Act
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Aucun utilisateur trouvé.",
        data: [],
      });
    });

    it("devrait retourner 400 si prenom ou nom manquants", async () => {
      // Arrange
      mockRequest.body = {
        prenom: "",
        nom: "Doe",
      };

      // Act
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Les champs 'prenom' et 'nom' sont requis.",
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      // Arrange
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
      };

      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      // Act
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur",
        error: "Database connection failed",
      });
    });
  });

  describe("createPassword - PUT /api/compte/creer-mot-de-passe", () => {
    it("devrait créer un mot de passe avec succès", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        password: "SecurePassword123!",
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Mot de passe créé avec succès",
      });

      // Act
      await createPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(mockCompteClient.mettreAJourMotDePasse).toHaveBeenCalledTimes(1);
      expect(mockCompteClient.mettreAJourMotDePasse).toHaveBeenCalledWith(
        1,
        expect.any(String), // Hash bcrypt
        true, // isCreation
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Mot de passe créé avec succès.",
      });
    });

    it("devrait retourner 400 si id ou password manquants", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        // password manquant
      };

      // Act
      await createPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(mockCompteClient.mettreAJourMotDePasse).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "L'id et le mot de passe sont requis.",
      });
    });

    it("devrait retourner 400 si la création échoue", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        password: "Password123!",
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Le compte possède déjà un mot de passe",
      });

      // Act
      await createPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Échec de la création du mot de passe.",
      });
    });

    it("devrait hasher le mot de passe avant de le sauvegarder", async () => {
      // Arrange
      const plainPassword = "MyPlainPassword123!";
      mockRequest.body = {
        id: 1,
        password: plainPassword,
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Mot de passe créé",
      });

      // Act
      await createPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      const [, hashedPassword] = (
        mockCompteClient.mettreAJourMotDePasse as jest.Mock
      ).mock.calls[0];
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/); // Pattern bcrypt
    });
  });

  describe("changePassword - PUT /api/compte/changer-mot-de-passe", () => {
    it("devrait modifier un mot de passe existant avec succès", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        password: "NewSecurePassword456!",
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Mot de passe modifié avec succès",
      });

      // Act
      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(mockCompteClient.mettreAJourMotDePasse).toHaveBeenCalledTimes(1);
      expect(mockCompteClient.mettreAJourMotDePasse).toHaveBeenCalledWith(
        1,
        expect.any(String), // Hash bcrypt
        false, // isCreation = false (modification)
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Mot de passe modifié avec succès.",
      });
    });

    it("devrait retourner 400 si la modification échoue", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        password: "NewPassword123!",
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Le compte n'a pas encore de mot de passe",
      });

      // Act
      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Échec de la modification du mot de passe.",
      });
    });

    it("devrait gérer les erreurs serveur lors du changement", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        password: "NewPassword123!",
      };

      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockRejectedValue(
        new Error("Server error"),
      );

      // Act
      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur",
        error: "Server error",
      });
    });
  });

  describe("updateAccount - PUT /api/compte/update", () => {
    it("devrait mettre à jour l'email avec succès", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        email: "newemail@example.com",
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Utilisateur mis à jour avec succès",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.mettreAJourUtilisateurAvecConversion,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCompteClient.mettreAJourUtilisateurAvecConversion,
      ).toHaveBeenCalledWith(1, {
        email: "newemail@example.com",
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: false,
      });
    });

    it("devrait retourner 400 si id manquant", async () => {
      // Arrange
      mockRequest.body = {
        email: "test@example.com",
        // id manquant
      };

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.mettreAJourUtilisateurAvecConversion,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "ID utilisateur requis",
      });
    });

    it("devrait mettre à jour plusieurs champs simultanément", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        email: "updated@example.com",
        date_naissance: "1995-05-15",
        genres: 1,
        grades: "Ceinture Bleue",
        status: 1,
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Utilisateur mis à jour",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.mettreAJourUtilisateurAvecConversion,
      ).toHaveBeenCalledWith(1, {
        email: "updated@example.com",
        date_naissance: "1995-05-15",
        genres: 1,
        grades: "Ceinture Bleue",
        status: 1,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: false,
      });
    });

    it("devrait marquer echeancesUpdated si abonnement change", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        abonnement: 3,
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Abonnement mis à jour",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: true, // Devrait être true car abonnement a changé
      });
    });

    it("devrait convertir les genres en nombre si c'est une chaîne numérique", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        genres: "2", // Chaîne numérique
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Genre mis à jour",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      const [, updateData] = (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mock.calls[0];
      expect(updateData.genres).toBe(2); // Converti en nombre
    });

    it("devrait hasher le mot de passe si fourni dans la mise à jour", async () => {
      // Arrange
      const plainPassword = "NewAccountPassword123!";
      mockRequest.body = {
        id: 1,
        email: "test@example.com",
        password: plainPassword,
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Compte mis à jour",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      const [, updateData] = (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mock.calls[0];
      expect(updateData.password).toBeDefined();
      expect(updateData.password).not.toBe(plainPassword);
      expect(updateData.password).toMatch(/^\$2[aby]\$/); // Pattern bcrypt
    });

    it("devrait retourner 400 si la mise à jour échoue", async () => {
      // Arrange
      mockRequest.body = {
        id: 999,
        email: "test@example.com",
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        message: "Utilisateur non trouvé",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "Échec de la mise à jour",
        message: "Utilisateur non trouvé",
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        email: "test@example.com",
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "Erreur lors de la mise à jour du compte",
        details: "Database error",
      });
    });
  });

  describe("Scénarios d'intégration - Cycle de vie complet", () => {
    it("devrait permettre de créer un compte, ajouter un password, puis le modifier", async () => {
      // 1. Obtenir les informations d'un nouveau compte
      mockRequest.body = { prenom: "Alice", nom: "Martin" };
      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: {
          id: 5,
          first_name: "Alice",
          last_name: "Martin",
          email: "alice@example.com",
          password: null,
        },
      });

      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // 2. Créer un mot de passe
      jest.clearAllMocks();
      mockRequest.body = { id: 5, password: "FirstPassword123!" };
      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Mot de passe créé",
      });

      await createPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // 3. Modifier le mot de passe
      jest.clearAllMocks();
      mockRequest.body = { id: 5, password: "NewPassword456!" };
      (mockCompteClient.mettreAJourMotDePasse as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Mot de passe modifié",
      });

      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // 4. Mettre à jour les informations du compte
      jest.clearAllMocks();
      mockRequest.body = {
        id: 5,
        email: "alice.updated@example.com",
        genres: 2,
        grades: "Ceinture Jaune",
      };
      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Compte mis à jour",
      });

      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: false,
      });
    });

    it("devrait gérer une mise à jour complète avec changement d'abonnement", async () => {
      // Arrange
      mockRequest.body = {
        id: 1,
        email: "user@example.com",
        date_naissance: "1992-08-20",
        genres: 1,
        grades: "Ceinture Noire",
        abonnement: 3, // Changement d'abonnement
        status: 1,
      };

      (
        mockCompteClient.mettreAJourUtilisateurAvecConversion as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Compte et abonnement mis à jour",
      });

      // Act
      await updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: true, // Les échéances devraient être régénérées
      });
    });
  });

  describe("Validation et sécurité", () => {
    it("ne devrait pas accepter d'injection SQL dans les noms", async () => {
      // Arrange
      mockRequest.body = {
        prenom: "John'; DROP TABLE utilisateurs; --",
        nom: "Doe",
      };

      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun utilisateur trouvé",
        data: [],
      });

      // Act
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert - Le client devrait recevoir la chaîne telle quelle (utilisant des requêtes préparées)
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).toHaveBeenCalledWith("John'; DROP TABLE utilisateurs; --", "Doe");
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait gérer les noms avec caractères spéciaux correctement", async () => {
      // Arrange
      mockRequest.body = {
        prenom: "Jean-François",
        nom: "O'Connor",
      };

      (
        mockCompteClient.obtenirInformationsUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: {
          id: 10,
          first_name: "Jean-François",
          last_name: "O'Connor",
          email: "jf@example.com",
        },
      });

      // Act
      await getInformations(
        mockRequest as Request,
        mockResponse as Response,
        mockCompteClient as Compte,
      );

      // Assert
      expect(
        mockCompteClient.obtenirInformationsUtilisateur,
      ).toHaveBeenCalledWith("Jean-François", "O'Connor");
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
