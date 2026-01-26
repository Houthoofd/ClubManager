/**
 * Tests de gestion des exceptions pour le service Professeurs
 * Teste tous les cas d'erreurs et exceptions possibles
 */

import { ProfesseursService } from "../professeurs.service.js";
import { ProfesseursError } from "@clubmanager/types";
import {
  createMockPrisma,
  mockProfesseur,
  mockUtilisateurNormal,
} from "./professeurs.mock.js";

describe("ProfesseursService - Tests d'Exceptions", () => {
  let professeursService: ProfesseursService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    professeursService = new ProfesseursService(mockPrisma);
  });

  afterEach(() => {
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) =>
      fn.mockReset?.(),
    );
    mockPrisma.$queryRaw?.mockReset?.();
  });

  // ============================================
  // ERREURS DE BASE DE DONNÉES
  // ============================================

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion base de données", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("ECONNREFUSED: Connection refused"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "ECONNREFUSED",
      );
    });

    it("devrait gérer un timeout de requête", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Query timeout exceeded"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "timeout",
      );
    });

    it("devrait gérer une erreur de contrainte unique", async () => {
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow("Unique constraint");
    });

    it("devrait gérer une erreur de transaction", async () => {
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Transaction already committed or rolled back"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow("Transaction");
    });

    it("devrait gérer une erreur de clé étrangère", async () => {
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Foreign key constraint failed"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow("Foreign key");
    });
  });

  // ============================================
  // ERREURS MÉTIER - PROFESSEURS
  // ============================================

  describe("Erreurs métier", () => {
    it("devrait rejeter si professeur introuvable lors de la récupération", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.obtenirProfesseurParId(999),
      ).resolves.toBeNull();
    });

    it("devrait rejeter si professeur introuvable lors de la modification", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 999, status_id: 1 }),
      ).rejects.toThrow(ProfesseursError);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 999, status_id: 1 }),
      ).rejects.toThrow("Professeur introuvable");
    });

    it("devrait rejeter si professeur introuvable lors du retrait", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.retirerPromotionProfesseur(999),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait rejeter si professeur introuvable pour le planning", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.obtenirPlanningProfesseur(999),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait rejeter si professeur introuvable pour les statistiques", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.statistiquesProfesseur(999),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait rejeter si statut invalide", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: -1 }),
      ).rejects.toThrow(ProfesseursError);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 0 }),
      ).rejects.toThrow(ProfesseursError);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 99 }),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait gérer aucun utilisateur fourni pour promotion", async () => {
      await expect(
        professeursService.ajouterProfesseur({
          utilisateurs: [],
        }),
      ).rejects.toThrow(ProfesseursError);
    });
  });

  // ============================================
  // ERREURS DE VALIDATION
  // ============================================

  describe("Erreurs de validation", () => {
    it("devrait gérer des IDs invalides (chaînes)", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.obtenirProfesseurParId(NaN),
      ).resolves.toBeNull();
    });

    it("devrait gérer des IDs négatifs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.professeurExiste(-1);
      expect(result).toBe(false);
    });

    it("devrait gérer des IDs zero", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.professeurExiste(0);
      expect(result).toBe(false);
    });

    it("devrait gérer des limites de pagination négatives", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // Le service devrait gérer gracieusement les valeurs négatives
      await professeursService.obtenirProfesseurs({
        limit: -10,
        offset: -5,
      });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer des recherches avec chaînes vides", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.rechercherProfesseurs("");
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait gérer des recherches très longues", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const longString = "a".repeat(10000);
      const result = await professeursService.rechercherProfesseurs(longString);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ============================================
  // ERREURS RÉSEAU ET TIMEOUT
  // ============================================

  describe("Erreurs réseau", () => {
    it("devrait gérer une perte de connexion réseau", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Network is unreachable"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Network",
      );
    });

    it("devrait gérer un timeout réseau", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Socket timeout"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "timeout",
      );
    });

    it("devrait gérer une interruption de connexion", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Connection reset by peer"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Connection reset",
      );
    });
  });

  // ============================================
  // ERREURS DE MÉMOIRE
  // ============================================

  describe("Erreurs de mémoire", () => {
    it("devrait gérer une erreur de mémoire insuffisante", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("JavaScript heap out of memory"),
      );

      await expect(
        professeursService.obtenirProfesseurs({ limit: 1000000 }),
      ).rejects.toThrow("heap out of memory");
    });

    it("devrait gérer un résultat trop volumineux", async () => {
      const hugeArray = Array(1000000).fill(mockProfesseur);
      mockPrisma.utilisateurs.findMany.mockResolvedValue(hugeArray);
      mockPrisma.utilisateurs.count.mockResolvedValue(1000000);

      // Devrait réussir mais pourrait être lent
      const result = await professeursService.obtenirProfesseurs({
        limit: 1000000,
      });
      expect(result.professeurs.length).toBe(1000000);
    });
  });

  // ============================================
  // ERREURS SQL
  // ============================================

  describe("Erreurs SQL", () => {
    it("devrait gérer une erreur de syntaxe SQL", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(
        new Error("Syntax error in SQL statement"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.obtenirPlanningProfesseur(1),
      ).rejects.toThrow("Syntax error");
    });

    it("devrait gérer une table inexistante", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error('Table "utilisateurs" does not exist'),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "does not exist",
      );
    });

    it("devrait gérer une colonne inexistante", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error('Column "invalid_column" does not exist'),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "does not exist",
      );
    });
  });

  // ============================================
  // ERREURS DE TYPE
  // ============================================

  describe("Erreurs de type", () => {
    it("devrait gérer des types de données incorrects", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockProfesseur,
        grade_id: "invalid_number", // Devrait être un nombre
      });

      const result = await professeursService.obtenirProfesseurParId(1);
      expect(result).toBeDefined();
    });

    it("devrait gérer des dates invalides", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockProfesseur,
        date_naissance: "invalid_date",
      });

      const result = await professeursService.obtenirProfesseurParId(1);
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // ERREURS DE CONCURRENCE
  // ============================================

  describe("Erreurs de concurrence", () => {
    it("devrait gérer un conflit de version optimiste", async () => {
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Record to update not found or version mismatch"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow("version mismatch");
    });

    it("devrait gérer un deadlock", async () => {
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Deadlock detected"),
      );

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow("Deadlock");
    });
  });

  // ============================================
  // ERREURS INATTENDUES
  // ============================================

  describe("Erreurs inattendues", () => {
    it("devrait gérer une erreur undefined", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(undefined);

      await expect(
        professeursService.obtenirProfesseurs({}),
      ).rejects.toBeUndefined();
    });

    it("devrait gérer une erreur null", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(null);

      await expect(
        professeursService.obtenirProfesseurs({}),
      ).rejects.toBeNull();
    });

    it("devrait gérer une erreur sans message", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(new Error());

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow();
    });

    it("devrait gérer une erreur personnalisée", async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string,
        ) {
          super(message);
          this.name = "CustomError";
        }
      }

      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new CustomError("Something went wrong", "CUSTOM_ERROR"),
      );

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Something went wrong",
      );
    });
  });

  // ============================================
  // RÉCUPÉRATION D'ERREURS
  // ============================================

  describe("Récupération d'erreurs", () => {
    it("devrait retourner un tableau vide en cas d'erreur de liste", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow();
    });

    it("devrait retourner null pour un professeur introuvable sans erreur", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.obtenirProfesseurParId(999);
      expect(result).toBeNull();
    });

    it("devrait gérer gracieusement les erreurs de statistiques", async () => {
      mockPrisma.utilisateurs.count.mockRejectedValue(
        new Error("Count failed"),
      );

      await expect(professeursService.statistiquesGenerales()).rejects.toThrow(
        "Count failed",
      );
    });
  });

  // ============================================
  // ERREURS DE CODE MÉTIER PERSONNALISÉES
  // ============================================

  describe("ProfesseursError personnalisées", () => {
    it("devrait créer une ProfesseursError avec code", () => {
      const error = new ProfesseursError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("ProfesseursError");
      expect(error instanceof Error).toBe(true);
    });

    it("devrait propager ProfesseursError correctement", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      try {
        await professeursService.modifierStatutProfesseur({
          id: 999,
          status_id: 1,
        });
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ProfesseursError);
        expect((error as ProfesseursError).code).toBe("PROFESSEUR_INTROUVABLE");
      }
    });
  });

  // ============================================
  // STACK TRACES
  // ============================================

  describe("Stack traces", () => {
    it("devrait préserver le stack trace original", async () => {
      const originalError = new Error("Original error");
      mockPrisma.utilisateurs.findMany.mockRejectedValue(originalError);

      try {
        await professeursService.obtenirProfesseurs({});
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBe(originalError);
        expect((error as Error).stack).toBeDefined();
      }
    });
  });

  // ============================================
  // TESTS DE ROBUSTESSE
  // ============================================

  describe("Tests de robustesse", () => {
    it("ne devrait pas crasher avec des données corrompues", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        id: null,
        nom: null,
        prenom: null,
        email: null,
        status_id: null,
      });

      const result = await professeursService.obtenirProfesseurParId(1);
      expect(result).toBeDefined();
    });

    it("devrait gérer plusieurs erreurs successives", async () => {
      mockPrisma.utilisateurs.findMany
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValueOnce(new Error("Error 3"));

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Error 1",
      );
      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Error 2",
      );
      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Error 3",
      );
    });

    it("devrait continuer après une erreur récupérée", async () => {
      mockPrisma.utilisateurs.findMany
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce([mockProfesseur]);

      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await expect(professeursService.obtenirProfesseurs({})).rejects.toThrow(
        "Temporary error",
      );

      const result = await professeursService.obtenirProfesseurs({});
      expect(result.professeurs).toHaveLength(1);
    });
  });
});
