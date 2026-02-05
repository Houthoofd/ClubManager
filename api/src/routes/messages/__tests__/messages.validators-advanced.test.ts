/**
 * Tests de validateurs avancés pour le module Messages
 * Tests approfondis des schémas de validation Zod
 */

import { describe, it, expect } from "@jest/globals";
import { z } from "zod";

describe("Messages Module - Advanced Validators Tests", () => {
  describe("Validation des types de messages", () => {
    const typeMessageSchema = z.object({
      nom: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      categorie: z.enum([
        "adhesion",
        "paiement",
        "cours",
        "evenement",
        "general",
        "rappel",
        "notification",
      ]),
      template: z.string().optional().nullable(),
      actif: z.boolean().default(true),
    });

    it("devrait valider un type de message complet", () => {
      const validData = {
        nom: "Rappel d'adhésion",
        description: "Message pour les rappels d'adhésion",
        categorie: "adhesion",
        template: "Bonjour {nom}, votre adhésion expire le {date}.",
        actif: true,
      };

      const result = typeMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider un type avec champs optionnels absents", () => {
      const validData = {
        nom: "Type simple",
        categorie: "general",
      };

      const result = typeMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true); // Valeur par défaut
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidData = {
        nom: "",
        categorie: "general",
      };

      const result = typeMessageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait rejeter un nom trop long (>255 caractères)", () => {
      const invalidData = {
        nom: "A".repeat(256),
        categorie: "general",
      };

      const result = typeMessageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une catégorie invalide", () => {
      const invalidData = {
        nom: "Type test",
        categorie: "categorie_invalide",
      };

      const result = typeMessageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("categorie");
      }
    });

    it("devrait accepter actif = false", () => {
      const validData = {
        nom: "Type inactif",
        categorie: "general",
        actif: false,
      };

      const result = typeMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait accepter description null", () => {
      const validData = {
        nom: "Type sans description",
        description: null,
        categorie: "general",
      };

      const result = typeMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it("devrait accepter template null", () => {
      const validData = {
        nom: "Type sans template",
        categorie: "general",
        template: null,
      };

      const result = typeMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.template).toBeNull();
      }
    });
  });

  describe("Validation des messages personnalisés", () => {
    const messageSchema = z.object({
      type_message_id: z.number().int().positive(),
      destinataires: z.array(z.string().email()).min(1).max(1000),
      sujet: z.string().min(1).max(500),
      contenu: z.string().min(1),
      variables: z.record(z.string()).optional(),
    });

    it("devrait valider un message complet", () => {
      const validData = {
        type_message_id: 1,
        destinataires: ["user@example.com", "user2@example.com"],
        sujet: "Message important",
        contenu: "Ceci est le contenu du message",
        variables: {
          nom: "Jean",
          prenom: "Dupont",
        },
      };

      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un type_message_id négatif", () => {
      const invalidData = {
        type_message_id: -1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_message_id non entier", () => {
      const invalidData = {
        type_message_id: 1.5,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une liste vide de destinataires", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: [],
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("destinataires");
      }
    });

    it("devrait rejeter plus de 1000 destinataires", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: Array.from(
          { length: 1001 },
          (_, i) => `user${i}@example.com`
        ),
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des emails invalides", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: ["not-an-email", "also-invalid"],
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("destinataires");
      }
    });

    it("devrait accepter un seul email invalide dans une liste", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: ["valid@example.com", "invalid-email"],
        sujet: "Test",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sujet vide", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "",
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sujet trop long (>500 caractères)", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "A".repeat(501),
        contenu: "Test",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "",
      };

      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un contenu très long", () => {
      const validData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Lorem ipsum ".repeat(1000),
      };

      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider des variables complexes", () => {
      const validData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test {nom}",
        contenu: "Bonjour {prenom} {nom}, votre {type} expire le {date}.",
        variables: {
          nom: "Dupont",
          prenom: "Jean",
          type: "adhésion",
          date: "30/06/2024",
          montant: "150.50",
        },
      };

      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter l'absence de variables", () => {
      const validData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Contenu sans variables",
      };

      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Validation des rappels de paiement", () => {
    const rappelSchema = z.object({
      utilisateur_id: z.number().int().positive(),
      email: z.string().email(),
      nom: z.string().min(1).max(255),
      montant: z.number().positive().min(0.01).max(999999.99),
      date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    it("devrait valider un rappel complet", () => {
      const validData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 150.5,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un utilisateur_id négatif", () => {
      const invalidData = {
        utilisateur_id: -1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "not-an-email",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant négatif", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: -100,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un montant de 0", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 0,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter le montant minimum (0.01)", () => {
      const validData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 0.01,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter le montant maximum (999999.99)", () => {
      const validData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 999999.99,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant trop élevé", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 1000000,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date au format invalide", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "30/06/2024", // Format invalide
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "invalid-date",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "",
        montant: 100,
        date_echeance: "2024-06-30",
      };

      const result = rappelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Validation des filtres de recherche", () => {
    const searchFiltersSchema = z.object({
      type_id: z.number().int().positive().optional(),
      statut: z.enum(["en_attente", "envoye", "echec", "lu"]).optional(),
      date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      limit: z.number().int().positive().max(1000).default(50),
      offset: z.number().int().min(0).default(0),
    });

    it("devrait valider des filtres complets", () => {
      const validData = {
        type_id: 1,
        statut: "envoye",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        limit: 100,
        offset: 0,
      };

      const result = searchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait accepter des filtres partiels", () => {
      const validData = {
        statut: "envoye",
        limit: 20,
      };

      const result = searchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0); // Valeur par défaut
      }
    });

    it("devrait accepter aucun filtre (valeurs par défaut)", () => {
      const validData = {};

      const result = searchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidData = {
        statut: "statut_invalide",
      };

      const result = searchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un limit trop élevé", () => {
      const invalidData = {
        limit: 1001,
      };

      const result = searchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un limit négatif", () => {
      const invalidData = {
        limit: -10,
      };

      const result = searchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un offset négatif", () => {
      const invalidData = {
        offset: -5,
      };

      const result = searchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un offset de 0", () => {
      const validData = {
        offset: 0,
      };

      const result = searchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider toutes les valeurs de statut possibles", () => {
      const statuts = ["en_attente", "envoye", "echec", "lu"];

      statuts.forEach((statut) => {
        const data = { statut };
        const result = searchFiltersSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Validation de mise à jour de type", () => {
    const updateTypeSchema = z
      .object({
        nom: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        categorie: z
          .enum([
            "adhesion",
            "paiement",
            "cours",
            "evenement",
            "general",
            "rappel",
            "notification",
          ])
          .optional(),
        template: z.string().optional().nullable(),
        actif: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni pour la mise à jour",
      });

    it("devrait valider une mise à jour partielle", () => {
      const validData = {
        nom: "Nouveau nom",
      };

      const result = updateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de plusieurs champs", () => {
      const validData = {
        nom: "Nouveau nom",
        description: "Nouvelle description",
        actif: false,
      };

      const result = updateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une mise à jour vide", () => {
      const invalidData = {};

      const result = updateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("devrait accepter la mise à jour de actif uniquement", () => {
      const validData = {
        actif: false,
      };

      const result = updateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Validation des templates et variables", () => {
    it("devrait identifier les variables dans un template", () => {
      const template = "Bonjour {nom}, votre {type} expire le {date}.";
      const variables = template.match(/\{([^}]+)\}/g) || [];

      expect(variables).toHaveLength(3);
      expect(variables).toContain("{nom}");
      expect(variables).toContain("{type}");
      expect(variables).toContain("{date}");
    });

    it("devrait gérer un template sans variables", () => {
      const template = "Ceci est un message sans variables.";
      const variables = template.match(/\{([^}]+)\}/g) || [];

      expect(variables).toHaveLength(0);
    });

    it("devrait extraire les noms de variables", () => {
      const template = "Message pour {nom} {prenom}, montant: {montant}€";
      const matches = template.match(/\{([^}]+)\}/g) || [];
      const variableNames = matches.map((m) => m.slice(1, -1));

      expect(variableNames).toEqual(["nom", "prenom", "montant"]);
    });

    it("devrait valider que toutes les variables sont fournies", () => {
      const template = "Bonjour {nom}, votre {type} expire le {date}.";
      const variables = { nom: "Dupont", type: "adhésion", date: "30/06/2024" };

      const templateVariables = (template.match(/\{([^}]+)\}/g) || []).map(
        (m) => m.slice(1, -1)
      );
      const providedVariables = Object.keys(variables);

      const allProvided = templateVariables.every((v) =>
        providedVariables.includes(v)
      );

      expect(allProvided).toBe(true);
    });

    it("devrait détecter les variables manquantes", () => {
      const template = "Bonjour {nom}, votre {type} expire le {date}.";
      const variables = { nom: "Dupont" }; // type et date manquants

      const templateVariables = (template.match(/\{([^}]+)\}/g) || []).map(
        (m) => m.slice(1, -1)
      );
      const providedVariables = Object.keys(variables);

      const missingVariables = templateVariables.filter(
        (v) => !providedVariables.includes(v)
      );

      expect(missingVariables).toEqual(["type", "date"]);
    });
  });

  describe("Validation d'emails avancée", () => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;

    it("devrait valider des emails standards", () => {
      const validEmails = [
        "user@example.com",
        "jean.dupont@example.fr",
        "user123@test-domain.co.uk",
      ];

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("devrait valider des emails avec caractères spéciaux", () => {
      const validEmails = [
        "user+tag@example.com",
        "user_name@example.com",
        "first.last@example.com",
      ];

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("devrait rejeter des emails invalides", () => {
      const invalidEmails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
      ];

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
});
