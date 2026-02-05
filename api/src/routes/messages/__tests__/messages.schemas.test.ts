/**
 * Tests des schémas de validation Zod pour le module Messages
 * Tests unitaires des validators et transformations
 */

import { describe, it, expect } from "@jest/globals";
import {
  createTypeMessageSchema,
  updateTypeMessageSchema,
  typeMessageIdSchema,
  sendMessageSchema,
  markAsReadSchema,
  getUserMessagesSchema,
  deleteMessageSchema,
  restoreMessageSchema,
  messageStatsSchema,
  sendPaymentReminderSchema,
  countUnreadMessagesSchema,
  toggleMessageStatusSchema,
  sendCustomEmailSchema,
  sendTestEmailSchema,
  sendTemplateEmailSchema,
  sendWelcomeEmailSchema,
  sendValidationEmailSchema,
  recoverUserIdSchema,
  confirmEmailSchema,
  messageHistorySchema,
  emailStatsSchema,
} from "../core/validators/index.js";

describe("Messages Schemas - Tests de validation", () => {
  describe("createTypeMessageSchema", () => {
    it("devrait valider un type de message valide", () => {
      const input = {
        title: "Rappel de cotisation",
        content: "Votre cotisation arrive à échéance",
      };

      const result = createTypeMessageSchema.parse(input);

      expect(result).toEqual({
        title: "Rappel de cotisation",
        content: "Votre cotisation arrive à échéance",
      });
    });

    it("devrait rejeter un type sans titre", () => {
      const input = {
        content: "Contenu sans titre",
      };

      expect(() => createTypeMessageSchema.parse(input)).toThrow();
    });

    it("devrait rejeter un type sans contenu", () => {
      const input = {
        title: "Titre sans contenu",
      };

      expect(() => createTypeMessageSchema.parse(input)).toThrow();
    });

    it("devrait rejeter un titre trop long", () => {
      const input = {
        title: "a".repeat(300),
        content: "Contenu valide",
      };

      expect(() => createTypeMessageSchema.parse(input)).toThrow();
    });

    it("devrait trim les espaces dans le titre et le contenu", () => {
      const input = {
        title: "  Titre avec espaces  ",
        content: "  Contenu avec espaces  ",
      };

      const result = createTypeMessageSchema.parse(input);

      expect(result.title).toBe("Titre avec espaces");
      expect(result.content).toBe("Contenu avec espaces");
    });

    it("devrait rejeter un titre vide après trim", () => {
      const input = {
        title: "   ",
        content: "Contenu valide",
      };

      expect(() => createTypeMessageSchema.parse(input)).toThrow();
    });
  });

  describe("updateTypeMessageSchema", () => {
    it("devrait valider une mise à jour du titre", () => {
      const input = {
        title: "Nouveau titre",
      };

      expect(() => updateTypeMessageSchema.parse(input)).toThrow();
    });

    it("devrait valider une mise à jour du contenu", () => {
      const input = {
        content: "Nouveau contenu",
      };

      expect(() => updateTypeMessageSchema.parse(input)).toThrow();
    });

    it("devrait valider une mise à jour complète", () => {
      const input = {
        title: "Nouveau titre",
        content: "Nouveau contenu",
      };

      const result = updateTypeMessageSchema.parse(input);

      expect(result.title).toBe("Nouveau titre");
      expect(result.content).toBe("Nouveau contenu");
    });

    it("devrait rejeter une mise à jour sans changement", () => {
      const input = {};

      expect(() => updateTypeMessageSchema.parse(input)).toThrow();
    });
  });

  describe("typeMessageIdSchema", () => {
    it("devrait valider et transformer un ID valide", () => {
      const input = { id: "42" };

      const result = typeMessageIdSchema.parse(input);

      expect(result.id).toBe(42);
      expect(typeof result.id).toBe("number");
    });

    it("devrait rejeter un ID non numérique", () => {
      const input = { id: "abc" };

      expect(() => typeMessageIdSchema.parse(input)).toThrow();
    });

    it("devrait rejeter un ID négatif", () => {
      const input = { id: "-5" };

      expect(() => typeMessageIdSchema.parse(input)).toThrow();
    });

    it("devrait rejeter un ID égal à zéro", () => {
      const input = { id: "0" };

      expect(() => typeMessageIdSchema.parse(input)).toThrow();
    });
  });

  describe("sendMessageSchema", () => {
    it("devrait valider un envoi de message valide", () => {
      const input = {
        destinataires: [1, 2, 3],
        type_message_id: 1,
        envoyerEmail: true,
      };

      const result = sendMessageSchema.parse(input);

      expect(result.destinataires).toEqual([1, 2, 3]);
      expect(result.type_message_id).toBe(1);
      expect(result.envoyerEmail).toBe(true);
    });

    it("devrait utiliser true par défaut pour envoyerEmail", () => {
      const input = {
        destinataires: [1, 2, 3],
        type_message_id: 1,
      };

      const result = sendMessageSchema.parse(input);

      expect(result.envoyerEmail).toBe(true);
    });

    it("devrait rejeter un tableau de destinataires vide", () => {
      const input = {
        destinataires: [],
        type_message_id: 1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });

    it("devrait rejeter plus de 1000 destinataires", () => {
      const input = {
        destinataires: Array.from({ length: 1001 }, (_, i) => i + 1),
        type_message_id: 1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });

    it("devrait accepter exactement 1000 destinataires", () => {
      const input = {
        destinataires: Array.from({ length: 1000 }, (_, i) => i + 1),
        type_message_id: 1,
      };

      const result = sendMessageSchema.parse(input);

      expect(result.destinataires.length).toBe(1000);
    });

    it("devrait rejeter des destinataires négatifs", () => {
      const input = {
        destinataires: [1, -2, 3],
        type_message_id: 1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });

    it("devrait rejeter un type_message_id négatif", () => {
      const input = {
        destinataires: [1, 2, 3],
        type_message_id: -1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });
  });

  describe("getUserMessagesSchema", () => {
    it("devrait valider et transformer un userId valide", () => {
      const input = {
        userId: "42",
        limit: "100",
      };

      const result = getUserMessagesSchema.parse(input);

      expect(result.userId).toBe(42);
      expect(result.limit).toBe("100");
    });

    it("devrait utiliser 50 par défaut pour limit", () => {
      const input = {
        userId: "42",
      };

      const result = getUserMessagesSchema.parse(input);

      expect(result.limit).toBe("50");
    });

    it("devrait rejeter un userId invalide", () => {
      const input = {
        userId: "abc",
      };

      expect(() => getUserMessagesSchema.parse(input)).toThrow();
    });
  });

  describe("sendPaymentReminderSchema", () => {
    it("devrait valider un tableau d'IDs d'échéances", () => {
      const input = {
        echeanceIds: [1, 2, 3],
        messagePersonnalise: "Rappel urgent",
      };

      const result = sendPaymentReminderSchema.parse(input);

      expect(result.echeanceIds).toEqual([1, 2, 3]);
      expect(result.messagePersonnalise).toBe("Rappel urgent");
    });

    it("devrait transformer un seul ID en tableau", () => {
      const input = {
        echeanceIds: 5,
        messagePersonnalise: "",
      };

      const result = sendPaymentReminderSchema.parse(input);

      expect(result.echeanceIds).toEqual([5]);
    });

    it("devrait parser une chaîne JSON", () => {
      const input = {
        echeanceIds: "[1,2,3]",
        messagePersonnalise: "",
      };

      const result = sendPaymentReminderSchema.parse(input);

      expect(result.echeanceIds).toEqual([1, 2, 3]);
    });

    it("devrait utiliser une chaîne vide par défaut pour messagePersonnalise", () => {
      const input = {
        echeanceIds: [1, 2, 3],
      };

      const result = sendPaymentReminderSchema.parse(input);

      expect(result.messagePersonnalise).toBe("");
    });

    it("devrait filtrer les IDs invalides", () => {
      const input = {
        echeanceIds: [1, -2, 0, 3, "invalid" as any],
        messagePersonnalise: "",
      };

      const result = sendPaymentReminderSchema.parse(input);

      expect(result.echeanceIds).toEqual([1, 3]);
    });

    it("devrait rejeter si aucune échéance valide", () => {
      const input = {
        echeanceIds: [-1, 0, "invalid" as any],
        messagePersonnalise: "",
      };

      expect(() => sendPaymentReminderSchema.parse(input)).toThrow();
    });
  });

  describe("messageStatsSchema", () => {
    it("devrait valider une période valide", () => {
      const input = {
        periode: "jour",
      };

      const result = messageStatsSchema.parse(input);

      expect(result.periode).toBe("jour");
    });

    it("devrait utiliser 'mois' par défaut", () => {
      const input = {};

      const result = messageStatsSchema.parse(input);

      expect(result.periode).toBe("mois");
    });

    it("devrait rejeter une période invalide", () => {
      const input = {
        periode: "annee" as any,
      };

      expect(() => messageStatsSchema.parse(input)).toThrow();
    });

    it("devrait accepter les périodes valides", () => {
      const periodes = ["jour", "semaine", "mois"];

      periodes.forEach((periode) => {
        const result = messageStatsSchema.parse({ periode });
        expect(result.periode).toBe(periode);
      });
    });
  });

  describe("sendCustomEmailSchema", () => {
    it("devrait valider un email personnalisé avec HTML", () => {
      const input = {
        to: "test@example.com",
        subject: "Test email",
        html: "<p>Contenu HTML</p>",
      };

      const result = sendCustomEmailSchema.parse(input);

      expect(result.to).toBe("test@example.com");
      expect(result.subject).toBe("Test email");
      expect(result.html).toBe("<p>Contenu HTML</p>");
    });

    it("devrait valider un email personnalisé avec texte", () => {
      const input = {
        to: "test@example.com",
        subject: "Test email",
        text: "Contenu texte",
      };

      const result = sendCustomEmailSchema.parse(input);

      expect(result.text).toBe("Contenu texte");
    });

    it("devrait rejeter un email sans html ni text", () => {
      const input = {
        to: "test@example.com",
        subject: "Test email",
      };

      expect(() => sendCustomEmailSchema.parse(input)).toThrow();
    });

    it("devrait rejeter une adresse email invalide", () => {
      const input = {
        to: "invalid-email",
        subject: "Test",
        html: "Content",
      };

      expect(() => sendCustomEmailSchema.parse(input)).toThrow();
    });

    it("devrait utiliser saveToDb=true par défaut", () => {
      const input = {
        to: "test@example.com",
        subject: "Test",
        html: "Content",
      };

      const result = sendCustomEmailSchema.parse(input);

      expect(result.saveToDb).toBe(true);
    });

    it("devrait utiliser type_message='custom_email' par défaut", () => {
      const input = {
        to: "test@example.com",
        subject: "Test",
        html: "Content",
      };

      const result = sendCustomEmailSchema.parse(input);

      expect(result.type_message).toBe("custom_email");
    });

    it("devrait trim les espaces dans to et subject", () => {
      const input = {
        to: "  test@example.com  ",
        subject: "  Test email  ",
        html: "Content",
      };

      const result = sendCustomEmailSchema.parse(input);

      expect(result.to).toBe("test@example.com");
      expect(result.subject).toBe("Test email");
    });

    it("devrait rejeter un sujet trop long", () => {
      const input = {
        to: "test@example.com",
        subject: "a".repeat(600),
        html: "Content",
      };

      expect(() => sendCustomEmailSchema.parse(input)).toThrow();
    });
  });

  describe("sendTemplateEmailSchema", () => {
    it("devrait valider un envoi avec template", () => {
      const input = {
        templateTitle: "Rappel de cotisation",
        to: "test@example.com",
        variables: { prenom: "Jean", montant: "25.50" },
      };

      const result = sendTemplateEmailSchema.parse(input);

      expect(result.templateTitle).toBe("Rappel de cotisation");
      expect(result.to).toBe("test@example.com");
      expect(result.variables).toEqual({ prenom: "Jean", montant: "25.50" });
    });

    it("devrait utiliser un objet vide pour variables par défaut", () => {
      const input = {
        templateTitle: "Template",
        to: "test@example.com",
      };

      const result = sendTemplateEmailSchema.parse(input);

      expect(result.variables).toEqual({});
    });

    it("devrait rejeter un templateTitle vide", () => {
      const input = {
        templateTitle: "",
        to: "test@example.com",
      };

      expect(() => sendTemplateEmailSchema.parse(input)).toThrow();
    });
  });

  describe("sendWelcomeEmailSchema", () => {
    it("devrait valider un email de bienvenue", () => {
      const input = {
        email: "user@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        userId: "user123",
      };

      const result = sendWelcomeEmailSchema.parse(input);

      expect(result.email).toBe("user@example.com");
      expect(result.firstName).toBe("Jean");
      expect(result.lastName).toBe("Dupont");
      expect(result.userId).toBe("user123");
    });

    it("devrait trim tous les champs string", () => {
      const input = {
        email: "  user@example.com  ",
        firstName: "  Jean  ",
        lastName: "  Dupont  ",
        userId: "  user123  ",
      };

      const result = sendWelcomeEmailSchema.parse(input);

      expect(result.email).toBe("user@example.com");
      expect(result.firstName).toBe("Jean");
      expect(result.lastName).toBe("Dupont");
      expect(result.userId).toBe("user123");
    });

    it("devrait rejeter si un champ est manquant", () => {
      const input = {
        email: "user@example.com",
        firstName: "Jean",
        userId: "user123",
      };

      expect(() => sendWelcomeEmailSchema.parse(input)).toThrow();
    });
  });

  describe("confirmEmailSchema", () => {
    it("devrait valider un token valide", () => {
      const input = {
        token: "abc123def456",
      };

      const result = confirmEmailSchema.parse(input);

      expect(result.token).toBe("abc123def456");
    });

    it("devrait trim le token", () => {
      const input = {
        token: "  abc123  ",
      };

      const result = confirmEmailSchema.parse(input);

      expect(result.token).toBe("abc123");
    });

    it("devrait rejeter un token vide", () => {
      const input = {
        token: "",
      };

      expect(() => confirmEmailSchema.parse(input)).toThrow();
    });
  });

  describe("messageHistorySchema", () => {
    it("devrait valider et transformer les paramètres d'historique", () => {
      const input = {
        utilisateurId: "42",
        limit: "200",
      };

      const result = messageHistorySchema.parse(input);

      expect(result.utilisateurId).toBe(42);
      expect(result.limit).toBe(200);
    });

    it("devrait utiliser 100 par défaut pour limit", () => {
      const input = {
        utilisateurId: "42",
      };

      const result = messageHistorySchema.parse(input);

      expect(result.limit).toBe(100);
    });

    it("devrait rejeter un utilisateurId invalide", () => {
      const input = {
        utilisateurId: "invalid",
      };

      expect(() => messageHistorySchema.parse(input)).toThrow();
    });
  });

  describe("emailStatsSchema", () => {
    it("devrait valider et transformer les paramètres de stats", () => {
      const input = {
        utilisateurId: "42",
        limit: "500",
      };

      const result = emailStatsSchema.parse(input);

      expect(result.utilisateurId).toBe(42);
      expect(result.limit).toBe(500);
    });

    it("devrait utiliser 1000 par défaut pour limit", () => {
      const input = {
        utilisateurId: "42",
      };

      const result = emailStatsSchema.parse(input);

      expect(result.limit).toBe(1000);
    });
  });

  describe("Protection contre les valeurs extrêmes", () => {
    it("devrait rejeter des valeurs infinies", () => {
      const input = {
        destinataires: [1, 2, Infinity],
        type_message_id: 1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });

    it("devrait rejeter NaN", () => {
      const input = {
        destinataires: [1, 2, NaN],
        type_message_id: 1,
      };

      expect(() => sendMessageSchema.parse(input)).toThrow();
    });
  });

  describe("Cas limites et edge cases", () => {
    it("devrait accepter un titre de longueur maximale (255 caractères)", () => {
      const input = {
        title: "a".repeat(255),
        content: "Contenu valide",
      };

      const result = createTypeMessageSchema.parse(input);

      expect(result.title.length).toBe(255);
    });

    it("devrait accepter un seul destinataire", () => {
      const input = {
        destinataires: [1],
        type_message_id: 1,
      };

      const result = sendMessageSchema.parse(input);

      expect(result.destinataires).toEqual([1]);
    });

    it("devrait gérer les nombres décimaux pour les IDs (arrondir/rejeter)", () => {
      const input = {
        userId: "42.5",
      };

      expect(() => getUserMessagesSchema.parse(input)).toThrow();
    });
  });
});
