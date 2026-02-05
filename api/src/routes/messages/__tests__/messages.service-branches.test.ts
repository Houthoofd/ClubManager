/**
 * Tests ciblés pour couvrir les branches non testées des services Messages
 * Objectif: Couvrir les chemins d'erreur et les branches conditionnelles
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Services Messages - Branches non couvertes", () => {
  let mockMessageClient: Partial<Message>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMessageClient = {
      queryAsync: jest.fn(),
      obtenirTousLesTypesDeMessages: jest.fn(),
      creerTypeMessage: jest.fn(),
      modifierTypeMessage: jest.fn(),
      supprimerTypeMessage: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
      getMessageHistory: jest.fn(),
      saveMessageToDatabase: jest.fn(),
      updateMessageStatus: jest.fn(),
      envoyerRappelPaiementAvecEmail: jest.fn(),
    };
  });

  describe("obtenirTousLesTypesDeMessages - Branches d'erreur", () => {
    it("devrait lever une erreur si la requête DB échoue", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        mockMessageClient.obtenirTousLesTypesDeMessages!()
      ).rejects.toThrow("Database connection failed");
    });

    it("devrait gérer une erreur inattendue lors de la récupération", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockRejectedValue(new Error("Unexpected error"));

      await expect(
        mockMessageClient.obtenirTousLesTypesDeMessages!()
      ).rejects.toThrow("Unexpected error");
    });

    it("devrait retourner un tableau vide si aucun type trouvé", async () => {
      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue([]);

      const result = await mockMessageClient.obtenirTousLesTypesDeMessages!();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait gérer les types avec des champs null", async () => {
      const mockTypes = [
        {
          id: 1,
          nom: "Type test",
          description: null,
          categorie: "general",
          template: null,
          actif: true,
          date_creation: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.obtenirTousLesTypesDeMessages as jest.Mock
      ).mockResolvedValue(mockTypes);

      const result = await mockMessageClient.obtenirTousLesTypesDeMessages!();

      expect(result).toHaveLength(1);
      expect(result[0].description).toBeNull();
      expect(result[0].template).toBeNull();
    });
  });

  describe("creerTypeMessage - Branches d'erreur", () => {
    it("devrait lever une erreur si l'insertion échoue", async () => {
      const typeData = {
        nom: "Type test",
        description: "Description",
        categorie: "general",
        actif: true,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Duplicate entry")
      );

      await expect(
        mockMessageClient.creerTypeMessage!(typeData as any)
      ).rejects.toThrow("Duplicate entry");
    });

    it("devrait gérer une contrainte de clé unique violée", async () => {
      const typeData = {
        nom: "Type existant",
        description: "Description",
        categorie: "general",
        actif: true,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("ER_DUP_ENTRY: Duplicate entry 'Type existant' for key 'nom'")
      );

      await expect(
        mockMessageClient.creerTypeMessage!(typeData as any)
      ).rejects.toThrow("ER_DUP_ENTRY");
    });

    it("devrait gérer une catégorie invalide", async () => {
      const typeData = {
        nom: "Type test",
        description: "Description",
        categorie: "categorie_invalide",
        actif: true,
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Invalid category")
      );

      await expect(
        mockMessageClient.creerTypeMessage!(typeData as any)
      ).rejects.toThrow("Invalid category");
    });

    it("devrait créer un type avec template null", async () => {
      const typeData = {
        nom: "Type sans template",
        description: "Description",
        categorie: "general",
        template: null,
        actif: true,
      };

      const mockCreated = {
        id: 1,
        ...typeData,
        date_creation: new Date().toISOString(),
      };

      (mockMessageClient.creerTypeMessage as jest.Mock).mockResolvedValue(
        mockCreated
      );

      const result = await mockMessageClient.creerTypeMessage!(
        typeData as any
      );

      expect(result.template).toBeNull();
    });
  });

  describe("modifierTypeMessage - Branches d'erreur", () => {
    it("devrait lever une erreur si le type n'existe pas", async () => {
      const typeId = 999;
      const updateData = { nom: "Nouveau nom" };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Type de message introuvable")
      );

      await expect(
        mockMessageClient.modifierTypeMessage!(typeId, updateData as any)
      ).rejects.toThrow("Type de message introuvable");
    });

    it("devrait gérer une mise à jour sans changement", async () => {
      const typeId = 1;
      const updateData = {};

      const mockUpdated = {
        id: typeId,
        nom: "Type existant",
        description: "Description",
        categorie: "general",
        template: null,
        actif: true,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      const result = await mockMessageClient.modifierTypeMessage!(
        typeId,
        updateData as any
      );

      expect(result.id).toBe(typeId);
      expect(result.date_modification).toBeDefined();
    });

    it("devrait mettre à jour seulement le champ actif", async () => {
      const typeId = 1;
      const updateData = { actif: false };

      const mockUpdated = {
        id: typeId,
        nom: "Type existant",
        description: "Description",
        categorie: "general",
        template: null,
        actif: false,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      const result = await mockMessageClient.modifierTypeMessage!(
        typeId,
        updateData as any
      );

      expect(result.actif).toBe(false);
    });

    it("devrait gérer une erreur de contrainte lors de la mise à jour", async () => {
      const typeId = 1;
      const updateData = { nom: "Nom en doublon" };

      (mockMessageClient.modifierTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Duplicate entry")
      );

      await expect(
        mockMessageClient.modifierTypeMessage!(typeId, updateData as any)
      ).rejects.toThrow("Duplicate entry");
    });
  });

  describe("supprimerTypeMessage - Branches d'erreur", () => {
    it("devrait lever une erreur si le type n'existe pas", async () => {
      const typeId = 999;

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockRejectedValue(
        new Error("Type de message introuvable")
      );

      await expect(
        mockMessageClient.supprimerTypeMessage!(typeId)
      ).rejects.toThrow("Type de message introuvable");
    });

    it("devrait gérer une contrainte de clé étrangère", async () => {
      const typeId = 1;

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockRejectedValue(
        new Error(
          "Cannot delete: foreign key constraint fails (messages references types_messages)"
        )
      );

      await expect(
        mockMessageClient.supprimerTypeMessage!(typeId)
      ).rejects.toThrow("foreign key constraint");
    });

    it("devrait supprimer avec succès un type sans messages associés", async () => {
      const typeId = 5;

      (mockMessageClient.supprimerTypeMessage as jest.Mock).mockResolvedValue({
        success: true,
        id: typeId,
      });

      const result = await mockMessageClient.supprimerTypeMessage!(typeId);

      expect(result.success).toBe(true);
      expect(result.id).toBe(typeId);
    });
  });

  describe("envoyerMessageAvecEmails - Branches d'erreur", () => {
    it("devrait lever une erreur si le type de message n'existe pas", async () => {
      const messageData = {
        type_message_id: 999,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Contenu",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("Type de message introuvable"));

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("Type de message introuvable");
    });

    it("devrait gérer une liste vide de destinataires", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: [],
        sujet: "Test",
        contenu: "Contenu",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue([]);

      const result = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(result).toHaveLength(0);
    });

    it("devrait gérer des échecs partiels d'envoi", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: [
          "valid@example.com",
          "invalid-email",
          "valid2@example.com",
        ],
        sujet: "Test",
        contenu: "Contenu",
      };

      const mockResults = [
        {
          id: 1,
          destinataire: "valid@example.com",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
        {
          destinataire: "invalid-email",
          statut: "echec",
          erreur: "Email invalide",
        },
        {
          id: 2,
          destinataire: "valid2@example.com",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockResults);

      const result = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(result).toHaveLength(3);
      expect(result.filter((r: any) => r.statut === "echec")).toHaveLength(1);
      expect(result.filter((r: any) => r.statut === "envoye")).toHaveLength(2);
    });

    it("devrait gérer une erreur SMTP", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Test",
        contenu: "Contenu",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("SMTP connection timeout"));

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("SMTP connection timeout");
    });

    it("devrait remplacer les variables du template", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user@example.com"],
        sujet: "Bonjour {nom}",
        contenu: "Votre {type} expire le {date}",
        variables: {
          nom: "Jean",
          type: "adhésion",
          date: "30/06/2024",
        },
      };

      const mockSent = [
        {
          id: 1,
          destinataire: "user@example.com",
          sujet: "Bonjour Jean",
          contenu: "Votre adhésion expire le 30/06/2024",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
        },
      ];

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockResolvedValue(mockSent);

      const result = await mockMessageClient.envoyerMessageAvecEmails!(
        messageData as any
      );

      expect(result[0].sujet).not.toContain("{nom}");
      expect(result[0].contenu).not.toContain("{type}");
      expect(result[0].contenu).not.toContain("{date}");
    });
  });

  describe("getMessageHistory - Branches d'erreur", () => {
    it("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
      const userId = 999;

      (mockMessageClient.getMessageHistory as jest.Mock).mockRejectedValue(
        new Error("Utilisateur introuvable")
      );

      await expect(
        mockMessageClient.getMessageHistory!(userId)
      ).rejects.toThrow("Utilisateur introuvable");
    });

    it("devrait retourner un tableau vide si aucun message trouvé", async () => {
      const userId = 1;

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue([]);

      const result = await mockMessageClient.getMessageHistory!(userId);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait gérer les messages avec date_lecture null", async () => {
      const userId = 1;

      const mockHistory = [
        {
          id: 1,
          type_message_id: 1,
          destinataire: "user@example.com",
          sujet: "Message non lu",
          contenu: "Contenu",
          statut: "envoye",
          date_envoi: new Date().toISOString(),
          date_lecture: null,
        },
      ];

      (mockMessageClient.getMessageHistory as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const result = await mockMessageClient.getMessageHistory!(userId);

      expect(result).toHaveLength(1);
      expect(result[0].date_lecture).toBeNull();
    });

    it("devrait gérer une erreur de base de données", async () => {
      const userId = 1;

      (mockMessageClient.getMessageHistory as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        mockMessageClient.getMessageHistory!(userId)
      ).rejects.toThrow("Database error");
    });
  });

  describe("saveMessageToDatabase - Branches d'erreur", () => {
    it("devrait lever une erreur si l'insertion échoue", async () => {
      const messageData = {
        type_message_id: 1,
        utilisateur_id: 1,
        destinataire: "user@example.com",
        sujet: "Test",
        contenu: "Contenu",
        statut: "envoye" as const,
      };

      (mockMessageClient.saveMessageToDatabase as jest.Mock).mockRejectedValue(
        new Error("Insertion failed")
      );

      await expect(
        mockMessageClient.saveMessageToDatabase!(messageData)
      ).rejects.toThrow("Insertion failed");
    });

    it("devrait créer un message avec les valeurs par défaut", async () => {
      const messageData = {
        type_message_id: 1,
        utilisateur_id: 1,
        destinataire: "user@example.com",
        sujet: "Test",
        contenu: "Contenu",
        statut: "en_attente" as const,
      };

      const mockSaved = {
        id: 1,
        ...messageData,
        date_envoi: null,
        date_lecture: null,
        erreur: null,
      };

      (mockMessageClient.saveMessageToDatabase as jest.Mock).mockResolvedValue(
        mockSaved
      );

      const result = await mockMessageClient.saveMessageToDatabase!(
        messageData
      );

      expect(result.date_envoi).toBeNull();
      expect(result.date_lecture).toBeNull();
      expect(result.erreur).toBeNull();
    });
  });

  describe("updateMessageStatus - Branches d'erreur", () => {
    it("devrait lever une erreur si le message n'existe pas", async () => {
      const messageId = 999;
      const newStatus = "lu" as const;

      (mockMessageClient.updateMessageStatus as jest.Mock).mockRejectedValue(
        new Error("Message introuvable")
      );

      await expect(
        mockMessageClient.updateMessageStatus!(messageId, newStatus)
      ).rejects.toThrow("Message introuvable");
    });

    it("devrait mettre à jour le statut et la date de lecture", async () => {
      const messageId = 1;
      const newStatus = "lu" as const;

      const mockUpdated = {
        id: messageId,
        statut: newStatus,
        date_lecture: new Date().toISOString(),
      };

      (mockMessageClient.updateMessageStatus as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      const result = await mockMessageClient.updateMessageStatus!(
        messageId,
        newStatus
      );

      expect(result.statut).toBe("lu");
      expect(result.date_lecture).toBeDefined();
    });

    it("devrait mettre à jour le statut en échec avec erreur", async () => {
      const messageId = 1;
      const newStatus = "echec" as const;
      const erreur = "SMTP error: Connection timeout";

      const mockUpdated = {
        id: messageId,
        statut: newStatus,
        erreur,
      };

      (mockMessageClient.updateMessageStatus as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      const result = await mockMessageClient.updateMessageStatus!(
        messageId,
        newStatus,
        erreur
      );

      expect(result.statut).toBe("echec");
      expect(result.erreur).toBe(erreur);
    });
  });

  describe("envoyerRappelPaiementAvecEmail - Branches d'erreur", () => {
    it("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
      const rappelData = {
        utilisateur_id: 999,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "2024-06-30",
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockRejectedValue(new Error("Utilisateur introuvable"));

      await expect(
        mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData)
      ).rejects.toThrow("Utilisateur introuvable");
    });

    it("devrait envoyer un rappel avec succès", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 150.5,
        date_echeance: "2024-06-30",
      };

      const mockResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockResult);

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.statut).toBe("envoye");
      expect(result.message_id).toBe(1);
      expect(result.email_id).toBe("email-123");
    });

    it("devrait gérer une erreur d'envoi d'email", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "invalid-email",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "2024-06-30",
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockRejectedValue(new Error("Invalid email format"));

      await expect(
        mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData)
      ).rejects.toThrow("Invalid email format");
    });

    it("devrait formater correctement le montant dans le message", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 1234.56,
        date_echeance: "2024-06-30",
      };

      const mockResult = {
        message_id: 1,
        email_id: "email-123",
        statut: "envoye",
        montant_formate: "1 234,56 €",
        date_envoi: new Date().toISOString(),
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockResolvedValue(mockResult);

      const result =
        await mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData);

      expect(result.montant_formate).toBeDefined();
    });
  });

  describe("Gestion des transactions", () => {
    it("devrait rollback en cas d'erreur lors d'un envoi en masse", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["user1@example.com", "user2@example.com"],
        sujet: "Test",
        contenu: "Contenu",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("Transaction rollback"));

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("Transaction rollback");
    });
  });

  describe("Validation des données", () => {
    it("devrait rejeter un email invalide", async () => {
      const messageData = {
        type_message_id: 1,
        destinataires: ["not-an-email"],
        sujet: "Test",
        contenu: "Contenu",
      };

      (
        mockMessageClient.envoyerMessageAvecEmails as jest.Mock
      ).mockRejectedValue(new Error("Email format invalide"));

      await expect(
        mockMessageClient.envoyerMessageAvecEmails!(messageData as any)
      ).rejects.toThrow("Email format invalide");
    });

    it("devrait rejeter un montant négatif pour un rappel", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: -100,
        date_echeance: "2024-06-30",
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockRejectedValue(new Error("Montant invalide"));

      await expect(
        mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData)
      ).rejects.toThrow("Montant invalide");
    });

    it("devrait rejeter une date d'échéance invalide", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "user@example.com",
        nom: "Jean Dupont",
        montant: 100,
        date_echeance: "invalid-date",
      };

      (
        mockMessageClient.envoyerRappelPaiementAvecEmail as jest.Mock
      ).mockRejectedValue(new Error("Date invalide"));

      await expect(
        mockMessageClient.envoyerRappelPaiementAvecEmail!(rappelData)
      ).rejects.toThrow("Date invalide");
    });
  });
});
