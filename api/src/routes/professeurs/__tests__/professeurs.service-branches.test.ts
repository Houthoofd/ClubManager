/**
 * Tests ciblés pour couvrir les branches non testées du service Professeurs
 * Objectif: Améliorer la couverture de code du service
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";
import {
  obtenirTousLesProfesseurs,
  obtenirProfesseurParId,
  ajouterProfesseur,
  modifierStatutProfesseur,
  obtenirPlanningProfesseur,
  extraireIdsUtilisateurs,
  validerUtilisateurPourPromotion,
} from "../core/services/professeurs.service.js";

describe("Service Professeurs - Branches non couvertes", () => {
  let mockProfesseursClient: Partial<Professeurs>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfesseursClient = {
      obtenirLesProfesseurs: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      ajouterUnProfesseur: jest.fn(),
      modifierStatutProfesseur: jest.fn(),
      obtenirPlanningCoursProfesseur: jest.fn(),
    };
  });

  describe("obtenirTousLesProfesseurs - Branches d'erreur", () => {
    it("devrait lever une erreur si la requête DB échoue", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        obtenirTousLesProfesseurs(mockProfesseursClient as Professeurs)
      ).rejects.toThrow("Impossible de récupérer la liste des professeurs");
    });

    it("devrait gérer une erreur inattendue lors de la récupération", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Unexpected error"));

      await expect(
        obtenirTousLesProfesseurs(mockProfesseursClient as Professeurs)
      ).rejects.toThrow();
    });

    it("devrait retourner un tableau vide si data est null", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: null,
      });

      const result = await obtenirTousLesProfesseurs(
        mockProfesseursClient as Professeurs
      );

      expect(result).toEqual([]);
    });

    it("devrait retourner un tableau vide si data est undefined", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: undefined,
      });

      const result = await obtenirTousLesProfesseurs(
        mockProfesseursClient as Professeurs
      );

      expect(result).toEqual([]);
    });

    it("devrait fonctionner avec un client par défaut si non fourni", async () => {
      await expect(obtenirTousLesProfesseurs()).rejects.toThrow();
    });
  });

  describe("obtenirProfesseurParId - Branches d'erreur", () => {
    it("devrait lever une erreur si la requête DB échoue", async () => {
      const professeurId = 123;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        obtenirProfesseurParId(
          professeurId,
          mockProfesseursClient as Professeurs
        )
      ).rejects.toThrow(
        "Impossible de récupérer le professeur 123"
      );
    });

    it("devrait retourner null si aucun professeur trouvé", async () => {
      const professeurId = 999;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      const result = await obtenirProfesseurParId(
        professeurId,
        mockProfesseursClient as Professeurs
      );

      expect(result).toBeNull();
    });

    it("devrait retourner null si professeur est undefined", async () => {
      const professeurId = 999;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await obtenirProfesseurParId(
        professeurId,
        mockProfesseursClient as Professeurs
      );

      expect(result).toBeNull();
    });

    it("devrait gérer une erreur inattendue", async () => {
      const professeurId = 123;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockRejectedValue(new Error("Unexpected error"));

      await expect(
        obtenirProfesseurParId(
          professeurId,
          mockProfesseursClient as Professeurs
        )
      ).rejects.toThrow();
    });

    it("devrait fonctionner avec un professeur valide", async () => {
      const professeurId = 1;
      const mockProfesseur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        role_id: 2,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      const result = await obtenirProfesseurParId(
        professeurId,
        mockProfesseursClient as Professeurs
      );

      expect(result).toEqual(mockProfesseur);
    });
  });

  describe("ajouterProfesseur - Branches d'erreur", () => {
    it("devrait lever une erreur si l'ajout échoue", async () => {
      const data = {
        utilisateurs: [1, 2, 3],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockRejectedValue(
        new Error("Constraint violation")
      );

      await expect(
        ajouterProfesseur(data, mockProfesseursClient as Professeurs)
      ).rejects.toThrow("Impossible de promouvoir le(s) professeur(s)");
    });

    it("devrait gérer une réponse avec isConfirm = false", async () => {
      const data = {
        utilisateurs: [1],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Échec de la promotion",
        data: null,
      });

      const result = await ajouterProfesseur(
        data,
        mockProfesseursClient as Professeurs
      );

      expect(result.success).toBe(false);
      expect(result.isConfirm).toBe(false);
    });

    it("devrait gérer une réponse sans message", async () => {
      const data = {
        utilisateurs: [1],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: null,
        data: {},
      });

      const result = await ajouterProfesseur(
        data,
        mockProfesseursClient as Professeurs
      );

      expect(result.message).toBe("Opération effectuée");
    });

    it("devrait gérer une réponse réussie complète", async () => {
      const data = {
        utilisateurs: [1, 2],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "2 professeurs promus",
        data: { promoted: [1, 2] },
      });

      const result = await ajouterProfesseur(
        data,
        mockProfesseursClient as Professeurs
      );

      expect(result.success).toBe(true);
      expect(result.isConfirm).toBe(true);
      expect(result.message).toBe("2 professeurs promus");
      expect(result.data).toEqual({ promoted: [1, 2] });
    });
  });

  describe("modifierStatutProfesseur - Branches d'erreur", () => {
    it("devrait lever une erreur si la modification échoue", async () => {
      const professeurId = 1;
      const statusId = 2;

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockRejectedValue(new Error("Update failed"));

      await expect(
        modifierStatutProfesseur(
          professeurId,
          statusId,
          mockProfesseursClient as Professeurs
        )
      ).rejects.toThrow(
        "Impossible de modifier le statut du professeur 1"
      );
    });

    it("devrait gérer une réponse avec isConfirm = false", async () => {
      const professeurId = 1;
      const statusId = 2;

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: false,
        message: "Échec de la modification",
        data: null,
      });

      const result = await modifierStatutProfesseur(
        professeurId,
        statusId,
        mockProfesseursClient as Professeurs
      );

      expect(result.success).toBe(false);
      expect(result.isConfirm).toBe(false);
    });

    it("devrait gérer une réponse sans message", async () => {
      const professeurId = 1;
      const statusId = 2;

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: undefined,
        data: { id: 1, status_id: 2 },
      });

      const result = await modifierStatutProfesseur(
        professeurId,
        statusId,
        mockProfesseursClient as Professeurs
      );

      expect(result.message).toBe("Statut modifié");
    });

    it("devrait gérer une réponse réussie", async () => {
      const professeurId = 1;
      const statusId = 3;

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Statut mis à jour avec succès",
        data: { id: 1, status_id: 3 },
      });

      const result = await modifierStatutProfesseur(
        professeurId,
        statusId,
        mockProfesseursClient as Professeurs
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Statut mis à jour avec succès");
    });
  });

  describe("obtenirPlanningProfesseur - Branches d'erreur", () => {
    it("devrait lever une erreur si la récupération échoue", async () => {
      const professeurId = 1;

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        obtenirPlanningProfesseur(
          professeurId,
          mockProfesseursClient as Professeurs
        )
      ).rejects.toThrow(
        "Impossible de récupérer le planning du professeur 1"
      );
    });

    it("devrait retourner un planning avec isFind = false si aucun cours", async () => {
      const professeurId = 1;

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun cours trouvé",
        data: [],
      });

      const result = await obtenirPlanningProfesseur(
        professeurId,
        mockProfesseursClient as Professeurs
      );

      expect(result.isFind).toBe(false);
      expect(result.data).toEqual([]);
    });

    it("devrait retourner un planning avec des cours", async () => {
      const professeurId = 1;
      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: [
          {
            id: 1,
            nom_cours: "Karate Débutant",
            jour_semaine: "Lundi",
            heure_debut: "18:00",
            heure_fin: "19:00",
            professeur_id: 1,
          },
        ],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      const result = await obtenirPlanningProfesseur(
        professeurId,
        mockProfesseursClient as Professeurs
      );

      expect(result.isFind).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("extraireIdsUtilisateurs - Toutes les branches", () => {
    it("devrait extraire des IDs depuis data.utilisateurs (tableau de nombres)", () => {
      const data = {
        utilisateurs: [1, 2, 3],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire des IDs depuis data.utilisateurs (tableau de strings)", () => {
      const data = {
        utilisateurs: ["1", "2", "3"],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire des IDs depuis data.utilisateurs (tableau d'objets avec id)", () => {
      const data = {
        utilisateurs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire des IDs depuis data.utilisateurs (tableau d'objets avec userId)", () => {
      const data = {
        utilisateurs: [{ userId: 1 }, { userId: 2 }],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2]);
    });

    it("devrait extraire des IDs depuis data.utilisateurs (tableau d'objets avec user_id)", () => {
      const data = {
        utilisateurs: [{ user_id: 1 }, { user_id: 2 }],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2]);
    });

    it("devrait extraire un ID depuis data quand data est un tableau", () => {
      const data = [1, 2, 3];

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire un ID depuis data quand data est un tableau d'objets", () => {
      const data = [{ id: 1 }, { userId: 2 }, { user_id: 3 }];

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire un ID depuis data.id", () => {
      const data = { id: 5 };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([5]);
    });

    it("devrait extraire un ID depuis data.userId", () => {
      const data = { userId: 10 };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([10]);
    });

    it("devrait extraire un ID depuis data.user_id", () => {
      const data = { user_id: 15 };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([15]);
    });

    it("devrait extraire des IDs depuis data.users", () => {
      const data = {
        users: [1, 2, 3],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2, 3]);
    });

    it("devrait extraire des IDs depuis data.users (tableau d'objets)", () => {
      const data = {
        users: [{ id: 1 }, { userId: 2 }],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 2]);
    });

    it("devrait filtrer les IDs invalides (NaN)", () => {
      const data = {
        utilisateurs: ["1", "abc", "3"],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([1, 3]);
    });

    it("devrait retourner un tableau vide si aucun ID valide", () => {
      const data = {
        utilisateurs: ["abc", "def"],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([]);
    });

    it("devrait gérer un tableau vide", () => {
      const data = {
        utilisateurs: [],
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([]);
    });

    it("devrait gérer un objet sans IDs", () => {
      const data = {
        name: "test",
        value: 123,
      };

      const result = extraireIdsUtilisateurs(data);

      expect(result).toEqual([]);
    });
  });

  describe("validerUtilisateurPourPromotion - Branches complètes", () => {
    it("devrait retourner valide: false si utilisateur n'existe pas", async () => {
      const userId = 999;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      const result = await validerUtilisateurPourPromotion(
        userId,
        mockProfesseursClient as Professeurs
      );

      expect(result.valide).toBe(false);
      expect(result.message).toContain("n'existe pas");
    });

    it("devrait retourner valide: false si utilisateur est déjà professeur", async () => {
      const userId = 1;
      const mockUtilisateur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        role_id: 2, // déjà professeur
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUtilisateur);

      const result = await validerUtilisateurPourPromotion(
        userId,
        mockProfesseursClient as Professeurs
      );

      expect(result.valide).toBe(false);
      expect(result.message).toContain("déjà professeur");
      expect(result.utilisateur).toEqual(mockUtilisateur);
    });

    it("devrait retourner valide: true si utilisateur peut être promu", async () => {
      const userId = 1;
      const mockUtilisateur = {
        id: 1,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@test.com",
        role_id: 1, // pas encore professeur
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUtilisateur);

      const result = await validerUtilisateurPourPromotion(
        userId,
        mockProfesseursClient as Professeurs
      );

      expect(result.valide).toBe(true);
      expect(result.utilisateur).toEqual(mockUtilisateur);
      expect(result.message).toBeUndefined();
    });

    it("devrait retourner valide: false en cas d'erreur", async () => {
      const userId = 1;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      const result = await validerUtilisateurPourPromotion(
        userId,
        mockProfesseursClient as Professeurs
      );

      expect(result.valide).toBe(false);
      expect(result.message).toContain("Erreur lors de la validation");
    });

    it("devrait gérer undefined comme utilisateur non trouvé", async () => {
      const userId = 999;

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await validerUtilisateurPourPromotion(
        userId,
        mockProfesseursClient as Professeurs
      );

      expect(result.valide).toBe(false);
      expect(result.message).toContain("n'existe pas");
    });
  });

  describe("Tests d'intégration des fonctions de service", () => {
    it("devrait orchestrer une promotion complète", async () => {
      const data = {
        utilisateurs: [1, 2],
      };

      // Mock pour la validation
      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          first_name: "User1",
          last_name: "Test1",
          email: "user1@test.com",
          role_id: 1,
        })
        .mockResolvedValueOnce({
          id: 2,
          first_name: "User2",
          last_name: "Test2",
          email: "user2@test.com",
          role_id: 1,
        });

      // Mock pour la promotion
      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "2 professeurs promus",
        data: { promoted: [1, 2] },
      });

      // Valider les utilisateurs
      const userIds = extraireIdsUtilisateurs(data);
      expect(userIds).toEqual([1, 2]);

      // Vérifier chaque utilisateur
      for (const userId of userIds) {
        const validation = await validerUtilisateurPourPromotion(
          userId,
          mockProfesseursClient as Professeurs
        );
        expect(validation.valide).toBe(true);
      }

      // Promouvoir
      const result = await ajouterProfesseur(
        data,
        mockProfesseursClient as Professeurs
      );
      expect(result.success).toBe(true);
    });
  });
});
