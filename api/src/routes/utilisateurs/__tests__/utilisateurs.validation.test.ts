/**
 * Tests de validation pour le module Utilisateurs
 * Teste les schémas Zod pour différents endpoints
 */

import {
  verifierUtilisateurSchema,
  inscriptionUtilisateurSchema,
  connexionUserIdSchema,
  connexionEmailSchema,
  rechercheEmailSchema,
  validationTokenSchema,
  emailTestSchema,
  utilisateurIdParamSchema,
  miseAJourUtilisateurSchema,
  suppressionUtilisateurSchema,
  listeUtilisateursQuerySchema,
  utilisateurSchema,
  utilisateursArraySchema,
  envoyerEmailInscriptionSchema,
  verifierUtilisateurAdminSchema,
} from "@clubmanager/types/dist/validators.js";

describe("Utilisateurs - Tests de validation Zod", () => {
  // ==================== VERIFIER UTILISATEUR SCHEMA ====================
  describe("verifierUtilisateurSchema", () => {
    it("devrait valider des données correctes", () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        date_naissance: "1990-01-01",
      };

      const result = verifierUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si le nom manque", () => {
      const invalidData = {
        prenom: "Jean",
        date_naissance: "1990-01-01",
      };

      const result = verifierUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si le prénom manque", () => {
      const invalidData = {
        nom: "Dupont",
        date_naissance: "1990-01-01",
      };

      const result = verifierUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide", () => {
      const invalidData = {
        nom: "Dupont",
        prenom: "Jean",
        date_naissance: "01-01-1990",
      };

      const result = verifierUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date au format américain", () => {
      const invalidData = {
        nom: "Dupont",
        prenom: "Jean",
        date_naissance: "01/01/1990",
      };

      const result = verifierUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une date valide au format YYYY-MM-DD", () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        date_naissance: "2000-12-31",
      };

      const result = verifierUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  // ==================== INSCRIPTION UTILISATEUR SCHEMA ====================
  describe("inscriptionUtilisateurSchema", () => {
    it("devrait valider une inscription complète", () => {
      const validData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
        grade_id: 1,
      };

      const result = inscriptionUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider une inscription minimale (sans champs optionnels)", () => {
      const validData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "invalid-email",
        password: "password123",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop court", () => {
      const invalidData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "12345",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom d'utilisateur trop court", () => {
      const invalidData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "ab",
        email: "jean.dupont@example.com",
        password: "password123",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un genre_id négatif", () => {
      const invalidData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        genre_id: -1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un genre_id égal à zéro", () => {
      const invalidData = {
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        genre_id: 0,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
      };

      const result = inscriptionUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== CONNEXION USER ID SCHEMA ====================
  describe("connexionUserIdSchema", () => {
    it("devrait valider des identifiants corrects", () => {
      const validData = {
        userId: "user_123",
        password: "password123",
      };

      const result = connexionUserIdSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si userId manque", () => {
      const invalidData = {
        password: "password123",
      };

      const result = connexionUserIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si password manque", () => {
      const invalidData = {
        userId: "user_123",
      };

      const result = connexionUserIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un userId vide", () => {
      const invalidData = {
        userId: "",
        password: "password123",
      };

      const result = connexionUserIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un password vide", () => {
      const invalidData = {
        userId: "user_123",
        password: "",
      };

      const result = connexionUserIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== CONNEXION EMAIL SCHEMA ====================
  describe("connexionEmailSchema", () => {
    it("devrait valider des identifiants corrects", () => {
      const validData = {
        email: "jean@example.com",
        password: "password123",
      };

      const result = connexionEmailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = connexionEmailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si email manque", () => {
      const invalidData = {
        password: "password123",
      };

      const result = connexionEmailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== UTILISATEUR ID PARAM SCHEMA ====================
  describe("utilisateurIdParamSchema", () => {
    it("devrait transformer une string valide en number", () => {
      const validData = {
        id: "123",
      };

      const result = utilisateurIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidData = {
        id: "-1",
      };

      const result = utilisateurIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID égal à zéro", () => {
      const invalidData = {
        id: "0",
      };

      const result = utilisateurIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID non numérique", () => {
      const invalidData = {
        id: "abc",
      };

      const result = utilisateurIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidData = {
        id: "123.45",
      };

      const result = utilisateurIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un ID avec des espaces", () => {
      const validData = {
        id: "  123  ",
      };

      const result = utilisateurIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });
  });

  // ==================== MISE A JOUR UTILISATEUR SCHEMA ====================
  describe("miseAJourUtilisateurSchema", () => {
    it("devrait valider une mise à jour de l'email", () => {
      const validData = {
        email: "newemail@example.com",
      };

      const result = miseAJourUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour du mot de passe", () => {
      const validData = {
        password: "newpassword123",
      };

      const result = miseAJourUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour multiple", () => {
      const validData = {
        email: "newemail@example.com",
        genres: 2,
        grades: 3,
      };

      const result = miseAJourUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet vide", () => {
      const invalidData = {};

      const result = miseAJourUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = miseAJourUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un mot de passe trop court", () => {
      const invalidData = {
        password: "12345",
      };

      const result = miseAJourUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un genres négatif", () => {
      const invalidData = {
        genres: -1,
      };

      const result = miseAJourUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait valider date_naissance au format correct", () => {
      const validData = {
        date_naissance: "1990-01-01",
      };

      const result = miseAJourUtilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter date_naissance au format incorrect", () => {
      const invalidData = {
        date_naissance: "01-01-1990",
      };

      const result = miseAJourUtilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== VALIDATION TOKEN SCHEMA ====================
  describe("validationTokenSchema", () => {
    it("devrait valider un token et userId corrects", () => {
      const validData = {
        token: "abc123def456",
        userId: "user_123",
      };

      const result = validationTokenSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si token manque", () => {
      const invalidData = {
        userId: "user_123",
      };

      const result = validationTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si userId manque", () => {
      const invalidData = {
        token: "abc123def456",
      };

      const result = validationTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un token vide", () => {
      const invalidData = {
        token: "",
        userId: "user_123",
      };

      const result = validationTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== EMAIL TEST SCHEMA ====================
  describe("emailTestSchema", () => {
    it("devrait valider un email correct", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = emailTestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = emailTestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si email manque", () => {
      const invalidData = {};

      const result = emailTestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== STATS SCHEMA ====================
  describe("statsSchema", () => {
    it("devrait valider des statistiques complètes", () => {
      const validData = {
        status: "healthy",
        checks: {
          database: true,
          utilisateurs: true,
          email: true,
        },
        message: "Tous les services sont opérationnels",
        data: {
          totalUtilisateurs: 100,
          utilisateursActifs: 85,
          utilisateursInactifs: 15,
        },
      };

      const result = statsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider des statistiques sans data", () => {
      const validData = {
        status: "unhealthy",
        checks: {
          database: false,
          utilisateurs: false,
          email: false,
        },
        message: "Services non opérationnels",
      };

      const result = statsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un status invalide", () => {
      const invalidData = {
        status: "invalid",
        checks: {
          database: true,
          utilisateurs: true,
          email: true,
        },
        message: "Test",
      };

      const result = statsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message vide", () => {
      const invalidData = {
        status: "healthy",
        checks: {
          database: true,
          utilisateurs: true,
          email: true,
        },
        message: "",
      };

      const result = statsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des nombres négatifs dans data", () => {
      const invalidData = {
        status: "healthy",
        checks: {
          database: true,
          utilisateurs: true,
          email: true,
        },
        message: "Test",
        data: {
          totalUtilisateurs: -10,
          utilisateursActifs: 85,
          utilisateursInactifs: 15,
        },
      };

      const result = statsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== UTILISATEUR SCHEMA ====================
  describe("utilisateurSchema", () => {
    it("devrait valider un utilisateur complet", () => {
      const validData = {
        id: 1,
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean@example.com",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
        grade_id: 1,
        email_verifie: true,
        date_verification_email: "2024-01-02",
      };

      const result = utilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider un utilisateur sans champs optionnels", () => {
      const validData = {
        id: 1,
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean@example.com",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
      };

      const result = utilisateurSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidData = {
        id: -1,
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "jean@example.com",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
      };

      const result = utilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        id: 1,
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "jean_dupont",
        email: "invalid-email",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
      };

      const result = utilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom d'utilisateur trop court", () => {
      const invalidData = {
        id: 1,
        prenom: "Jean",
        nom: "Dupont",
        nom_utilisateur: "ab",
        email: "jean@example.com",
        genre_id: 1,
        abonnement_id: 1,
        date_naissance: "1990-01-01",
        date_inscription: "2024-01-01",
        status_id: 1,
      };

      const result = utilisateurSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== ENVOYER EMAIL INSCRIPTION SCHEMA ====================
  describe("envoyerEmailInscriptionSchema", () => {
    it("devrait valider des données complètes", () => {
      const validData = {
        email: "jean@example.com",
        prenom: "Jean",
        nom: "Dupont",
        userId: "user_123",
        utilisateurId: 1,
      };

      const result = envoyerEmailInscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        email: "invalid-email",
        prenom: "Jean",
        nom: "Dupont",
        userId: "user_123",
        utilisateurId: 1,
      };

      const result = envoyerEmailInscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateurId négatif", () => {
      const invalidData = {
        email: "jean@example.com",
        prenom: "Jean",
        nom: "Dupont",
        userId: "user_123",
        utilisateurId: -1,
      };

      const result = envoyerEmailInscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un champ requis manque", () => {
      const invalidData = {
        email: "jean@example.com",
        prenom: "Jean",
        // nom manquant
        userId: "user_123",
        utilisateurId: 1,
      };

      const result = envoyerEmailInscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==================== LISTE UTILISATEURS QUERY SCHEMA ====================
  describe("listeUtilisateursQuerySchema", () => {
    it("devrait transformer 'true' en boolean true", () => {
      const validData = {
        includeInactive: "true",
      };

      const result = listeUtilisateursQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(true);
      }
    });

    it("devrait transformer toute autre valeur en false", () => {
      const validData = {
        includeInactive: "false",
      };

      const result = listeUtilisateursQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(false);
      }
    });

    it("devrait accepter un objet vide", () => {
      const validData = {};

      const result = listeUtilisateursQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
