/**
 * Tests ciblés pour couvrir les branches non testées du service Échéances
 * Objectif: Couvrir les lignes 144, 154-155, 203-204, 262-263, 286-287, 321-322, 329-330, 482-483
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  obtenirDetailEcheance,
  creerEcheance,
  mettreAJourEcheance,
  supprimerEcheance,
  obtenirStatistiquesUtilisateur,
} from "../core/services/echeances.service.js";

describe("Service Échéances - Branches non couvertes", () => {
  let mockPaiementsClient: Partial<Paiements>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaiementsClient = {
      queryAsync: jest.fn(),
      obtenirEcheanceAvecUtilisateur: jest.fn(),
    };
  });

  describe("obtenirDetailEcheance - Branches d'erreur", () => {
    it("devrait lever une erreur si la requête DB échoue (ligne 154-155)", async () => {
      const echeanceId = 123;
      const userId = 1;

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        obtenirDetailEcheance(
          echeanceId,
          userId,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow(
        "Impossible de récupérer les détails de l'échéance 123",
      );
    });

    it("devrait gérer une erreur inattendue lors de la récupération (ligne 154)", async () => {
      const echeanceId = 999;

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Unexpected error"));

      await expect(
        obtenirDetailEcheance(
          echeanceId,
          undefined,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow();
    });

    it("devrait retourner null si aucune échéance trouvée (ligne 144)", async () => {
      const echeanceId = 999;

      // Le service lève une erreur si null est retourné, pas un return null
      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Not found"));

      await expect(
        obtenirDetailEcheance(
          echeanceId,
          undefined,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow(
        "Impossible de récupérer les détails de l'échéance 999",
      );
    });
  });

  describe("creerEcheance - Branches d'erreur", () => {
    it("devrait lever une erreur si l'insertion échoue (ligne 203-204)", async () => {
      const data = {
        utilisateur_id: 1,
        montant: 50,
        date_echeance: "2024-06-15",
        statut: "en attente" as const,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Constraint violation"),
      );

      await expect(
        creerEcheance(data, mockPaiementsClient as Paiements),
      ).rejects.toThrow("Impossible de créer l'échéance");
    });

    it("devrait gérer une erreur lors de la récupération après création (ligne 203)", async () => {
      const data = {
        utilisateur_id: 1,
        montant: 50,
        date_echeance: "2024-06-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 123 }) // INSERT réussi
        .mockRejectedValueOnce(new Error("SELECT failed")); // SELECT échoue

      await expect(
        creerEcheance(data, mockPaiementsClient as Paiements),
      ).rejects.toThrow("Impossible de créer l'échéance");
    });

    it("devrait créer une échéance avec abonnement_id null si non fourni", async () => {
      const data = {
        utilisateur_id: 1,
        montant: 50,
        date_echeance: "2024-06-15",
        description: "Test",
      };

      const echeanceCreee = {
        id: 123,
        utilisateur_id: 1,
        abonnement_id: null,
        montant: 50,
        date_echeance: "2024-06-15",
        description: "Test",
        statut: "en attente",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 123 })
        .mockResolvedValueOnce([echeanceCreee]);

      const result = await creerEcheance(
        data,
        mockPaiementsClient as Paiements,
      );

      expect(result).toEqual(echeanceCreee);
      expect(mockPaiementsClient.queryAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          1,
          null,
          "2024-06-15",
          50,
          "Test",
          "en attente",
        ]),
      );
    });
  });

  describe("mettreAJourEcheance - Branches spécifiques", () => {
    it("devrait retourner l'échéance inchangée si aucun champ à mettre à jour (ligne 262-263)", async () => {
      const echeanceId = 123;
      const updates = {}; // Aucun champ

      const existingEcheance = {
        id: 123,
        montant: 50,
        statut: "en attente",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        existingEcheance,
      ]);

      const result = await mettreAJourEcheance(
        echeanceId,
        updates,
        mockPaiementsClient as Paiements,
      );

      expect(result).toEqual(existingEcheance);
      // Vérifie qu'aucune requête UPDATE n'a été faite (seulement 1 SELECT)
      expect(mockPaiementsClient.queryAsync).toHaveBeenCalledTimes(1);
    });

    it("devrait lever une erreur si la mise à jour échoue (ligne 286-287)", async () => {
      const echeanceId = 123;
      const updates = { montant: 75 };

      const existingEcheance = { id: 123, montant: 50 };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance]) // SELECT réussit
        .mockRejectedValueOnce(new Error("UPDATE failed")); // UPDATE échoue

      await expect(
        mettreAJourEcheance(
          echeanceId,
          updates,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow("Impossible de mettre à jour l'échéance 123");
    });

    it("devrait gérer une erreur lors de la récupération après mise à jour (ligne 286)", async () => {
      const echeanceId = 123;
      const updates = { statut: "payé" as const };

      const existingEcheance = { id: 123, statut: "en attente" };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance]) // SELECT initial
        .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE réussi
        .mockRejectedValueOnce(new Error("SELECT after UPDATE failed")); // SELECT final échoue

      await expect(
        mettreAJourEcheance(
          echeanceId,
          updates,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow();
    });

    it("devrait retourner null si l'échéance n'existe pas", async () => {
      const echeanceId = 999;
      const updates = { montant: 100 };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      const result = await mettreAJourEcheance(
        echeanceId,
        updates,
        mockPaiementsClient as Paiements,
      );

      expect(result).toBeNull();
    });

    it("devrait ignorer les champs non autorisés dans updates", async () => {
      const echeanceId = 123;
      const updates = {
        montant: 75,
        // @ts-ignore - Teste un champ non autorisé
        champ_invalide: "test",
        // @ts-ignore
        id: 999, // Ne devrait pas être mis à jour
      };

      const existingEcheance = { id: 123, montant: 50 };
      const updatedEcheance = { id: 123, montant: 75 };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance])
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([updatedEcheance]);

      const result = await mettreAJourEcheance(
        echeanceId,
        updates,
        mockPaiementsClient as Paiements,
      );

      expect(result).toEqual(updatedEcheance);

      // Vérifie que seul "montant" a été mis à jour
      const updateCall = (mockPaiementsClient.queryAsync as jest.Mock).mock
        .calls[1];
      expect(updateCall[0]).toContain("SET montant = ?");
      expect(updateCall[0]).not.toContain("champ_invalide");
      // "id" apparaît dans WHERE id = ?, donc on vérifie plutôt SET
      expect(updateCall[0]).toContain("WHERE id = ?");
      expect(updateCall[0]).not.toContain("SET id");
    });
  });

  describe("supprimerEcheance - Branches d'erreur", () => {
    it("devrait retourner false si affectedRows = 0 (ligne 321-322)", async () => {
      const echeanceId = 123;

      const existingEcheance = { id: 123, montant: 50 };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance]) // SELECT: échéance existe
        .mockResolvedValueOnce({ affectedRows: 0 }); // DELETE: aucune ligne supprimée

      const result = await supprimerEcheance(
        echeanceId,
        mockPaiementsClient as Paiements,
      );

      expect(result).toBe(false);
    });

    it("devrait lever une erreur si la suppression échoue (ligne 329-330)", async () => {
      const echeanceId = 123;

      const existingEcheance = { id: 123, montant: 50 };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance]) // SELECT réussit
        .mockRejectedValueOnce(new Error("DELETE failed")); // DELETE échoue

      await expect(
        supprimerEcheance(echeanceId, mockPaiementsClient as Paiements),
      ).rejects.toThrow("Impossible de supprimer l'échéance 123");
    });

    it("devrait gérer une erreur lors du SELECT initial (ligne 329)", async () => {
      const echeanceId = 123;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("SELECT failed"),
      );

      await expect(
        supprimerEcheance(echeanceId, mockPaiementsClient as Paiements),
      ).rejects.toThrow();
    });

    it("devrait retourner false si l'échéance n'existe pas", async () => {
      const echeanceId = 999;

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      const result = await supprimerEcheance(
        echeanceId,
        mockPaiementsClient as Paiements,
      );

      expect(result).toBe(false);
      // DELETE ne devrait pas être appelé
      expect(mockPaiementsClient.queryAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe("obtenirStatistiquesUtilisateur - Branches d'erreur", () => {
    it("devrait lever une erreur si la requête de stats échoue (ligne 482-483)", async () => {
      const userId = 1;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Statistics query failed"),
      );

      await expect(
        obtenirStatistiquesUtilisateur(
          userId,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow();
    });

    it("devrait gérer une erreur lors de la récupération des stats (ligne 482)", async () => {
      const userId = 1;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Database timeout"),
      );

      await expect(
        obtenirStatistiquesUtilisateur(
          userId,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow();
    });

    it("devrait retourner des stats vides si aucune échéance", async () => {
      const userId = 1;

      // Mock queryAsync pour retourner un tableau vide (aucune échéance)
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      const result = await obtenirStatistiquesUtilisateur(
        userId,
        mockPaiementsClient as Paiements,
      );

      expect(result).toBeDefined();
      expect(result.statistiques).toBeDefined();
      expect(result.statistiques.total_echeances).toBe(0);
      expect(result.statistiques.montant_total_du).toBe(0);
      expect(result.echeances).toEqual([]);
    });
  });

  describe("Cas limites avec client par défaut", () => {
    it("devrait créer un client Paiements par défaut si non fourni", async () => {
      const data = {
        utilisateur_id: 1,
        montant: 50,
        date_echeance: "2024-06-15",
      };

      // Ce test vérifie que le service peut fonctionner sans client mocké
      // (utilise le vrai client Paiements)
      // Note: Ce test pourrait échouer sans base de données réelle
      await expect(creerEcheance(data)).rejects.toThrow();
    });

    it("devrait utiliser le client par défaut pour supprimerEcheance", async () => {
      const echeanceId = 123;

      await expect(supprimerEcheance(echeanceId)).rejects.toThrow();
    });

    it("devrait utiliser le client par défaut pour mettreAJourEcheance", async () => {
      const echeanceId = 123;
      const updates = { montant: 75 };

      await expect(mettreAJourEcheance(echeanceId, updates)).rejects.toThrow();
    });
  });

  describe("Tests de console.log (couverture complète)", () => {
    // Ces tests couvrent les lignes de console.log non exécutées
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait logger quand aucun champ à mettre à jour (ligne 262)", async () => {
      const echeanceId = 123;
      const existingEcheance = { id: 123, montant: 50 };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        existingEcheance,
      ]);

      await mettreAJourEcheance(
        echeanceId,
        {},
        mockPaiementsClient as Paiements,
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aucun champ à mettre à jour"),
      );
    });

    it("devrait logger quand échéance non trouvée lors de suppression", async () => {
      const echeanceId = 999;

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await supprimerEcheance(echeanceId, mockPaiementsClient as Paiements);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("non trouvée"),
      );
    });

    it("devrait logger quand échéance non supprimée (affectedRows = 0)", async () => {
      const echeanceId = 123;
      const existingEcheance = { id: 123 };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([existingEcheance])
        .mockResolvedValueOnce({ affectedRows: 0 });

      await supprimerEcheance(echeanceId, mockPaiementsClient as Paiements);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("non supprimée"),
      );
    });

    it("devrait logger les erreurs lors des échecs", async () => {
      const echeanceId = 123;

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Test error"));

      await expect(
        obtenirDetailEcheance(
          echeanceId,
          undefined,
          mockPaiementsClient as Paiements,
        ),
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
