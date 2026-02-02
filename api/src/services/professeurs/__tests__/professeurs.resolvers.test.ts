/**
 * Tests pour les resolvers GraphQL du service Professeurs
 * Teste les queries et mutations GraphQL
 */

import { professeursResolvers } from "../professeurs.resolvers.js";
import { ProfesseursError } from "@clubmanager/types";
import {
  createMockPrisma,
  mockProfesseur,
  mockProfesseur2,
  mockUtilisateurNormal,
  mockPlanningCours,
  mockStatistiquesProfesseurs,
  mockStatistiquesProfesseur,
} from "./professeurs.mock.js";

describe("Professeurs Resolvers - Tests GraphQL", () => {
  let resolvers: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    resolvers = professeursResolvers(mockPrisma);
  });

  afterEach(() => {
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) =>
      fn.mockReset?.(),
    );
    mockPrisma.$queryRaw?.mockReset?.();
  });

  // ============================================
  // QUERIES
  // ============================================

  describe("Query: obtenirProfesseurs", () => {
    it("devrait retourner tous les professeurs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockProfesseur,
        mockProfesseur2,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(2);

      const result = await resolvers.Query.obtenirProfesseurs(null, {});

      expect(result.professeurs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it("devrait gérer les erreurs et les transformer en GraphQLError", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        resolvers.Query.obtenirProfesseurs(null, {}),
      ).rejects.toThrow("Database error");
    });

    it("devrait accepter des filtres", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirProfesseurs(null, {
        grade_id: 5,
        genre_id: 2,
        recherche: "Martin",
        limit: 10,
      });

      expect(result.professeurs).toHaveLength(1);
    });

    it("devrait gérer la pagination", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const result = await resolvers.Query.obtenirProfesseurs(null, {
        limit: 10,
        offset: 20,
      });

      expect(result.hasMore).toBe(true);
    });
  });

  describe("Query: obtenirProfesseurParId", () => {
    it("devrait retourner un professeur par son ID", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const result = await resolvers.Query.obtenirProfesseurParId(null, {
        id: 1,
      });

      expect(result.id).toBe(1);
      expect(result.nom).toBe("Martin");
      expect(result.prenom).toBe("Sophie");
    });

    it("devrait rejeter si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        resolvers.Query.obtenirProfesseurParId(null, { id: 999 }),
      ).rejects.toThrow("Professeur introuvable");
    });

    it("devrait gérer les erreurs ProfesseursError", async () => {
      mockPrisma.utilisateurs.findFirst.mockRejectedValue(
        new ProfesseursError("Erreur base de données", "DB_ERROR"),
      );

      await expect(
        resolvers.Query.obtenirProfesseurParId(null, { id: 1 }),
      ).rejects.toThrow();
    });
  });

  describe("Query: obtenirPlanningProfesseur", () => {
    it("devrait retourner le planning d'un professeur", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue(mockPlanningCours);

      const result = await resolvers.Query.obtenirPlanningProfesseur(null, {
        professeurId: 1,
      });

      expect(result.planning).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it("devrait rejeter si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        resolvers.Query.obtenirPlanningProfesseur(null, { professeurId: 999 }),
      ).rejects.toThrow("Professeur introuvable");
    });

    it("devrait retourner un planning vide", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await resolvers.Query.obtenirPlanningProfesseur(null, {
        professeurId: 1,
      });

      expect(result.planning).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Query: professeurExiste", () => {
    it("devrait retourner true si le professeur existe", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await resolvers.Query.professeurExiste(null, { id: 1 });

      expect(result).toBe(true);
    });

    it("devrait retourner false si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await resolvers.Query.professeurExiste(null, { id: 999 });

      expect(result).toBe(false);
    });
  });

  describe("Query: estProfesseur", () => {
    it("devrait retourner true si l'utilisateur est professeur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockProfesseur);

      const result = await resolvers.Query.estProfesseur(null, {
        utilisateurId: 1,
      });

      expect(result).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'est pas professeur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );

      const result = await resolvers.Query.estProfesseur(null, {
        utilisateurId: 3,
      });

      expect(result).toBe(false);
    });
  });

  describe("Query: compterCoursProfesseur", () => {
    it("devrait compter les cours d'un professeur", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(5) }]);

      const result = await resolvers.Query.compterCoursProfesseur(null, {
        professeurId: 1,
      });

      expect(result).toBe(5);
    });

    it("devrait retourner 0 si aucun cours", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      const result = await resolvers.Query.compterCoursProfesseur(null, {
        professeurId: 1,
      });

      expect(result).toBe(0);
    });
  });

  describe("Query: compterElevesProfesseur", () => {
    it("devrait compter les élèves d'un professeur", async () => {
      const result = await resolvers.Query.compterElevesProfesseur(null, {
        professeurId: 1,
      });

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Query: statistiquesProfesseurs", () => {
    it("devrait retourner les statistiques générales", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(15);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockProfesseur,
        mockProfesseur2,
      ]);

      const result = await resolvers.Query.statistiquesProfesseurs(null, {});

      expect(result).toHaveProperty("totalProfesseurs");
      expect(result).toHaveProperty("professeursActifs");
      expect(result).toHaveProperty("totalCours");
      expect(result).toHaveProperty("moyenneCoursParProfesseur");
    });

    it("devrait gérer les erreurs", async () => {
      mockPrisma.utilisateurs.count.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        resolvers.Query.statistiquesProfesseurs(null, {}),
      ).rejects.toThrow();
    });
  });

  describe("Query: statistiquesProfesseur", () => {
    it("devrait retourner les statistiques d'un professeur", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const result = await resolvers.Query.statistiquesProfesseur(null, {
        professeurId: 1,
      });

      expect(result.professeurId).toBe(1);
      expect(result).toHaveProperty("nombreCours");
      expect(result).toHaveProperty("nombreEleves");
    });

    it("devrait rejeter si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        resolvers.Query.statistiquesProfesseur(null, { professeurId: 999 }),
      ).rejects.toThrow("Professeur introuvable");
    });
  });

  describe("Query: rechercherProfesseurs", () => {
    it("devrait rechercher des professeurs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await resolvers.Query.rechercherProfesseurs(null, {
        recherche: "Martin",
      });

      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe("Martin");
    });

    it("devrait retourner un tableau vide si aucun résultat", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await resolvers.Query.rechercherProfesseurs(null, {
        recherche: "Inexistant",
      });

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // MUTATIONS
  // ============================================

  describe("Mutation: ajouterProfesseur", () => {
    it("devrait ajouter un professeur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      const result = await resolvers.Mutation.ajouterProfesseur(null, {
        input: { utilisateurs: [3] },
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(1);
    });

    it("devrait ajouter plusieurs professeurs", async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 3 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 4 });

      mockPrisma.utilisateurs.update
        .mockResolvedValueOnce({
          ...mockUtilisateurNormal,
          id: 3,
          status_id: 5,
        })
        .mockResolvedValueOnce({
          ...mockUtilisateurNormal,
          id: 4,
          status_id: 5,
        });

      const result = await resolvers.Mutation.ajouterProfesseur(null, {
        input: { utilisateurs: [3, 4] },
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(2);
    });

    it("devrait gérer les utilisateurs déjà professeurs", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockProfesseur);

      const result = await resolvers.Mutation.ajouterProfesseur(null, {
        input: { utilisateurs: [1] },
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(1);
    });

    it("devrait gérer les erreurs ProfesseursError", async () => {
      mockPrisma.utilisateurs.findUnique.mockRejectedValue(
        new ProfesseursError("Erreur lors de l'ajout", "AJOUT_ERROR"),
      );

      const result = await resolvers.Mutation.ajouterProfesseur(null, {
        input: { utilisateurs: [1] },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Erreurs");
    });
  });

  describe("Mutation: modifierStatutProfesseur", () => {
    it("devrait modifier le statut d'un professeur", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1,
      });

      const result = await resolvers.Mutation.modifierStatutProfesseur(null, {
        id: 1,
        status_id: 1,
      });

      expect(result.id).toBe(1);
      expect(result.status_id).toBe(1);
    });

    it("devrait rejeter si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.modifierStatutProfesseur(null, {
          id: 999,
          status_id: 1,
        }),
      ).rejects.toThrow("Professeur introuvable");
    });

    it("devrait rejeter si le statut est invalide", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        resolvers.Mutation.modifierStatutProfesseur(null, {
          id: 1,
          status_id: 99,
        }),
      ).rejects.toThrow("Statut invalide");
    });

    it("devrait gérer les erreurs génériques", async () => {
      mockPrisma.utilisateurs.findFirst.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        resolvers.Mutation.modifierStatutProfesseur(null, {
          id: 1,
          status_id: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Mutation: retirerPromotionProfesseur", () => {
    it("devrait retirer la promotion d'un professeur", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1,
      });

      const result = await resolvers.Mutation.retirerPromotionProfesseur(null, {
        id: 1,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Promotion retirée avec succès");
    });

    it("devrait inclure le motif dans le message", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1,
      });

      const result = await resolvers.Mutation.retirerPromotionProfesseur(null, {
        id: 1,
        motif: "Départ à la retraite",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Départ à la retraite");
    });

    it("devrait rejeter si le professeur n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.retirerPromotionProfesseur(null, { id: 999 }),
      ).rejects.toThrow("Professeur introuvable");
    });

    it("devrait gérer les erreurs ProfesseursError", async () => {
      mockPrisma.utilisateurs.findFirst.mockRejectedValue(
        new ProfesseursError("Erreur lors du retrait", "RETRAIT_ERROR"),
      );

      await expect(
        resolvers.Mutation.retirerPromotionProfesseur(null, { id: 1 }),
      ).rejects.toThrow();
    });
  });

  // ============================================
  // TESTS D'INTÉGRATION DES RESOLVERS
  // ============================================

  describe("Intégration des resolvers", () => {
    it("devrait avoir toutes les queries définies", () => {
      expect(resolvers.Query).toBeDefined();
      expect(resolvers.Query.obtenirProfesseurs).toBeDefined();
      expect(resolvers.Query.obtenirProfesseurParId).toBeDefined();
      expect(resolvers.Query.obtenirPlanningProfesseur).toBeDefined();
      expect(resolvers.Query.professeurExiste).toBeDefined();
      expect(resolvers.Query.estProfesseur).toBeDefined();
      expect(resolvers.Query.compterCoursProfesseur).toBeDefined();
      expect(resolvers.Query.compterElevesProfesseur).toBeDefined();
      expect(resolvers.Query.statistiquesProfesseurs).toBeDefined();
      expect(resolvers.Query.statistiquesProfesseur).toBeDefined();
      expect(resolvers.Query.rechercherProfesseurs).toBeDefined();
    });

    it("devrait avoir toutes les mutations définies", () => {
      expect(resolvers.Mutation).toBeDefined();
      expect(resolvers.Mutation.ajouterProfesseur).toBeDefined();
      expect(resolvers.Mutation.modifierStatutProfesseur).toBeDefined();
      expect(resolvers.Mutation.retirerPromotionProfesseur).toBeDefined();
    });

    it("devrait gérer les erreurs non-ProfesseursError", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Unexpected error"),
      );

      await expect(
        resolvers.Query.obtenirProfesseurs(null, {}),
      ).rejects.toThrow("Unexpected error");
    });
  });
});
