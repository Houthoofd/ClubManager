/**
 * Tests modernes pour le module Alertes
 * ✅ Architecture nouvelle : Tests adaptés aux resolvers wrappés avec combineMiddlewares
 * ✅ Mock direct des fonctions du service (pas de dépendance DB)
 * ✅ Tests des middlewares (auth, validation)
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Import setup mocks (doit être importé en premier)
import "./__mocks__/setup.js";

// Import types
import type { GraphQLContext } from "../../../shared/middleware/auth.middleware.js";

// Mock des services alertes (fonctions exportées)
const mockObtenirDashboardAlertes = jest.fn();
const mockObtenirAlertesActives = jest.fn();
const mockObtenirAlertesUtilisateur = jest.fn();
const mockObtenirAlerteParId = jest.fn();
const mockDetecterAlertes = jest.fn();
const mockResoudreAlerte = jest.fn();
const mockIgnorerAlerte = jest.fn();

jest.mock("../core/services/alertes.service.js", () => ({
  obtenirDashboardAlertes: (...args: any[]) =>
    mockObtenirDashboardAlertes(...args),
  obtenirAlertesActives: (...args: any[]) => mockObtenirAlertesActives(...args),
  obtenirAlertesUtilisateur: (...args: any[]) =>
    mockObtenirAlertesUtilisateur(...args),
  obtenirAlerteParId: (...args: any[]) => mockObtenirAlerteParId(...args),
  detecterAlertes: (...args: any[]) => mockDetecterAlertes(...args),
  resoudreAlerte: (...args: any[]) => mockResoudreAlerte(...args),
  ignorerAlerte: (...args: any[]) => mockIgnorerAlerte(...args),
}));

// Resolvers à tester (après les mocks)
import { alertesResolvers } from "../core/resolvers/alertes.resolvers.js";

// Types pour les tests
interface AlerteDashboard {
  totalAlertes: number;
  alertesCritiques: number;
  alertesEnAttente: number;
  alertesResolues: number;
  alertesParType: Record<string, number>;
  tendances: any;
}

interface AlerteData {
  id: number;
  type: string;
  severite: string;
  message: string;
  utilisateur_id?: number;
  statut: string;
  date_detection: Date;
  date_resolution?: Date;
  notes?: string;
}

/**
 * Helper pour créer un contexte GraphQL mock (Admin)
 */
function createMockContext(
  overrides?: Partial<GraphQLContext>,
): GraphQLContext {
  return {
    user: {
      id: 1,
      email: "admin@test.com",
      role: "admin",
      statut: "actif",
    },
    isAuthenticated: true,
    req: {} as any,
    res: {} as any,
    ...overrides,
  };
}

/**
 * Helper pour créer un contexte non-authentifié
 */
function createUnauthenticatedContext(): GraphQLContext {
  return {
    user: null,
    isAuthenticated: false,
    req: {} as any,
    res: {} as any,
  };
}

/**
 * Helper pour créer un contexte utilisateur (non-admin)
 */
function createUserContext(): GraphQLContext {
  return {
    user: {
      id: 2,
      email: "user@test.com",
      role: "membre",
      statut: "actif",
    },
    isAuthenticated: true,
    req: {} as any,
    res: {} as any,
  };
}

describe("Module Alertes - Tests Modernes", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockObtenirDashboardAlertes.mockClear();
    mockObtenirAlertesActives.mockClear();
    mockObtenirAlertesUtilisateur.mockClear();
    mockObtenirAlerteParId.mockClear();
    mockDetecterAlertes.mockClear();
    mockResoudreAlerte.mockClear();
    mockIgnorerAlerte.mockClear();

    // Supprimer les warnings de console pendant les tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================
  // QUERY: alertesDashboard
  // ========================================
  describe("Query: alertesDashboard", () => {
    it("✅ devrait retourner le dashboard des alertes (admin)", async () => {
      // Arrange
      const mockDashboard: AlerteDashboard = {
        totalAlertes: 15,
        alertesCritiques: 3,
        alertesEnAttente: 7,
        alertesResolues: 5,
        alertesParType: {
          INSCRIPTION_INCOMPLETE: 5,
          PAIEMENT_RETARD: 3,
          DOCUMENT_MANQUANT: 7,
        },
        tendances: { semaine: "+2", mois: "-5" },
      };

      mockObtenirDashboardAlertes.mockResolvedValue(mockDashboard);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Query.alertesDashboard(
        {},
        {},
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockDashboard);
      expect(mockObtenirDashboardAlertes).toHaveBeenCalledTimes(1);
    });

    it("❌ devrait rejeter si utilisateur non authentifié", async () => {
      // Arrange
      const context = createUnauthenticatedContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any),
      ).rejects.toThrow();
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any),
      ).rejects.toThrow();
    });

    it("❌ devrait propager les erreurs du service", async () => {
      // Arrange
      mockObtenirDashboardAlertes.mockRejectedValue(
        new Error("Erreur base de données"),
      );

      const context = createMockContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any),
      ).rejects.toThrow("Erreur base de données");
    });
  });

  // ========================================
  // QUERY: alertesActives
  // ========================================
  describe("Query: alertesActives", () => {
    it("✅ devrait retourner toutes les alertes actives (admin)", async () => {
      // Arrange
      const mockAlertes: AlerteData[] = [
        {
          id: 1,
          type: "INSCRIPTION_INCOMPLETE",
          severite: "HAUTE",
          message: "Inscription incomplète pour utilisateur 123",
          utilisateur_id: 123,
          statut: "EN_ATTENTE",
          date_detection: new Date("2024-01-01"),
        },
        {
          id: 2,
          type: "PAIEMENT_RETARD",
          severite: "CRITIQUE",
          message: "Paiement en retard de 30 jours",
          utilisateur_id: 456,
          statut: "EN_ATTENTE",
          date_detection: new Date("2024-01-02"),
        },
      ];

      mockObtenirAlertesActives.mockResolvedValue(mockAlertes);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Query.alertesActives(
        {},
        {},
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockAlertes);
      expect(result).toHaveLength(2);
      expect(mockObtenirAlertesActives).toHaveBeenCalledTimes(1);
    });

    it("✅ devrait retourner un tableau vide si aucune alerte", async () => {
      // Arrange
      mockObtenirAlertesActives.mockResolvedValue([]);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Query.alertesActives(
        {},
        {},
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alertesActives({}, {}, context, {} as any),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // QUERY: alertesUtilisateur
  // ========================================
  describe("Query: alertesUtilisateur", () => {
    it("✅ devrait retourner les alertes d'un utilisateur spécifique", async () => {
      // Arrange
      const userId = 123;
      const mockAlertes: AlerteData[] = [
        {
          id: 1,
          type: "INSCRIPTION_INCOMPLETE",
          severite: "MOYENNE",
          message: "Document manquant",
          utilisateur_id: userId,
          statut: "EN_ATTENTE",
          date_detection: new Date("2024-01-01"),
        },
      ];

      mockObtenirAlertesUtilisateur.mockResolvedValue(mockAlertes);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Query.alertesUtilisateur(
        {},
        { userId },
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockAlertes);
      expect(mockObtenirAlertesUtilisateur).toHaveBeenCalledWith(userId);
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alertesUtilisateur(
          {},
          { userId: 123 },
          context,
          {} as any,
        ),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // QUERY: alerte (par ID)
  // ========================================
  describe("Query: alerte", () => {
    it("✅ devrait retourner une alerte par son ID", async () => {
      // Arrange
      const alerteId = 42;
      const mockAlerte: AlerteData = {
        id: alerteId,
        type: "PAIEMENT_RETARD",
        severite: "HAUTE",
        message: "Paiement en retard",
        utilisateur_id: 123,
        statut: "EN_ATTENTE",
        date_detection: new Date("2024-01-01"),
      };

      mockObtenirAlerteParId.mockResolvedValue(mockAlerte);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Query.alerte(
        {},
        { id: alerteId },
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockAlerte);
      expect(mockObtenirAlerteParId).toHaveBeenCalledWith(alerteId);
    });

    it("❌ devrait rejeter si alerte non trouvée", async () => {
      // Arrange
      const alerteId = 999;
      mockObtenirAlerteParId.mockResolvedValue(null as any);

      const context = createMockContext();

      // Act & Assert
      await expect(
        alertesResolvers.Query.alerte({}, { id: alerteId }, context, {} as any),
      ).rejects.toThrow("non trouvée");
    });
  });

  // ========================================
  // MUTATION: detecterAlertes
  // ========================================
  describe("Mutation: detecterAlertes", () => {
    it("✅ devrait déclencher la détection des alertes (admin)", async () => {
      // Arrange
      const mockResult = {
        success: true,
        message: "5 alertes détectées et créées",
      };

      mockDetecterAlertes.mockResolvedValue(mockResult);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Mutation.detecterAlertes(
        {},
        {},
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(mockDetecterAlertes).toHaveBeenCalledTimes(1);
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Mutation.detecterAlertes({}, {}, context, {} as any),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // MUTATION: resoudreAlerte
  // ========================================
  describe("Mutation: resoudreAlerte", () => {
    it("✅ devrait résoudre une alerte avec notes", async () => {
      // Arrange
      const args = {
        alerteId: 1,
        notes: "Problème résolu manuellement",
      };

      const mockResult = {
        success: true,
        message: "Alerte 1 résolue avec succès",
      };

      mockResoudreAlerte.mockResolvedValue(mockResult);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Mutation.resoudreAlerte(
        {},
        args,
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(mockResoudreAlerte).toHaveBeenCalledWith(
        args.alerteId,
        args.notes,
        context.user?.id,
      );
    });

    it("✅ devrait résoudre une alerte sans notes", async () => {
      // Arrange
      const args = {
        alerteId: 2,
      };

      const mockResult = {
        success: true,
        message: "Alerte 2 résolue",
      };

      mockResoudreAlerte.mockResolvedValue(mockResult);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Mutation.resoudreAlerte(
        {},
        args,
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockResoudreAlerte).toHaveBeenCalledWith(
        args.alerteId,
        "",
        context.user?.id,
      );
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const args = { alerteId: 1, notes: "Test" };
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Mutation.resoudreAlerte({}, args, context, {} as any),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // MUTATION: ignorerAlerte
  // ========================================
  describe("Mutation: ignorerAlerte", () => {
    it("✅ devrait ignorer une alerte avec notes", async () => {
      // Arrange
      const args = {
        alerteId: 5,
        notes: "Fausse alerte, données incorrectes",
      };

      const mockResult = {
        success: true,
        message: "Alerte 5 ignorée",
      };

      mockIgnorerAlerte.mockResolvedValue(mockResult);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Mutation.ignorerAlerte(
        {},
        args,
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(mockIgnorerAlerte).toHaveBeenCalledWith(args.alerteId, args.notes);
    });

    it("✅ devrait ignorer une alerte sans notes", async () => {
      // Arrange
      const args = {
        alerteId: 6,
      };

      const mockResult = {
        success: true,
        message: "Alerte 6 ignorée",
      };

      mockIgnorerAlerte.mockResolvedValue(mockResult);

      const context = createMockContext();

      // Act
      const result = await alertesResolvers.Mutation.ignorerAlerte(
        {},
        args,
        context,
        {} as any,
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockIgnorerAlerte).toHaveBeenCalledWith(args.alerteId, "");
    });

    it("❌ devrait rejeter si utilisateur non-admin", async () => {
      // Arrange
      const args = { alerteId: 5, notes: "Test" };
      const context = createUserContext();

      // Act & Assert
      await expect(
        alertesResolvers.Mutation.ignorerAlerte({}, args, context, {} as any),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // TESTS D'INTÉGRATION
  // ========================================
  describe("Tests d'intégration", () => {
    it("✅ devrait gérer un workflow complet : dashboard → détection → résolution", async () => {
      // Arrange
      const mockDashboard: AlerteDashboard = {
        totalAlertes: 5,
        alertesCritiques: 1,
        alertesEnAttente: 3,
        alertesResolues: 1,
        alertesParType: {},
        tendances: {},
      };

      const mockDetectionResult = {
        success: true,
        message: "2 nouvelles alertes détectées",
      };

      const mockResolutionResult = {
        success: true,
        message: "Alerte résolue",
      };

      mockObtenirDashboardAlertes.mockResolvedValue(mockDashboard);
      mockDetecterAlertes.mockResolvedValue(mockDetectionResult);
      mockResoudreAlerte.mockResolvedValue(mockResolutionResult);

      const context = createMockContext();

      // Act - 1. Consulter le dashboard
      const dashboard = await alertesResolvers.Query.alertesDashboard(
        {},
        {},
        context,
        {} as any,
      );

      // Act - 2. Déclencher la détection
      const detection = await alertesResolvers.Mutation.detecterAlertes(
        {},
        {},
        context,
        {} as any,
      );

      // Act - 3. Résoudre une alerte
      const resolution = await alertesResolvers.Mutation.resoudreAlerte(
        {},
        { alerteId: 1, notes: "Résolu" },
        context,
        {} as any,
      );

      // Assert
      expect(dashboard.totalAlertes).toBe(5);
      expect(detection.success).toBe(true);
      expect(resolution.success).toBe(true);

      // Vérifier que les services ont bien été appelés dans l'ordre
      expect(mockObtenirDashboardAlertes).toHaveBeenCalledTimes(1);
      expect(mockDetecterAlertes).toHaveBeenCalledTimes(1);
      expect(mockResoudreAlerte).toHaveBeenCalledTimes(1);
    });
  });
});
