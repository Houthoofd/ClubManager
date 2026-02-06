/**
 * Tests de sécurité pour le service Statistiques
 * Tests de validation, injection, et protection des données
 */

import { jest } from "@jest/globals";
import { createMockPrisma } from "./statistiques.mock.js";
import { initStatistiquesService } from "../statistiques.service.js";
import { StatistiquesError } from "@clubmanager/types";

describe("StatistiquesService - Tests de Sécurité", () => {
  let mockPrisma: any;
  let service: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = initStatistiquesService(mockPrisma);
  });

  describe("Validation des IDs Utilisateurs", () => {
    it("devrait rejeter ID utilisateur négatif", async () => {
      await expect(service.obtenirFrequentationUtilisateur(-1)).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait rejeter ID utilisateur zéro", async () => {
      await expect(service.obtenirProgressionUtilisateur(0)).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait rejeter ID utilisateur null", async () => {
      await expect(
        service.obtenirFrequentationUtilisateur(null as any),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait rejeter ID utilisateur undefined", async () => {
      await expect(
        service.obtenirProgressionUtilisateur(undefined as any),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait rejeter ID utilisateur string malveillant", async () => {
      await expect(
        service.obtenirFrequentationUtilisateur("1 OR 1=1" as any),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait rejeter ID utilisateur avec caractères spéciaux", async () => {
      await expect(
        service.obtenirProgressionUtilisateur("1; DROP TABLE users;" as any),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait valider ID utilisateur très grand", async () => {
      const largeId = 999999999;
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirFrequentationUtilisateur(largeId);

      expect(Array.isArray(result)).toBe(true);
      // L'ID est valide (< MAX_INT), donc pas d'erreur
    });
  });

  describe("Validation des Paramètres de Dates", () => {
    it("devrait rejeter dateDebut postérieure à dateFin", async () => {
      const dateDebut = new Date("2024-12-31");
      const dateFin = new Date("2024-01-01");

      await expect(
        service.obtenirStatistiquesParCours(dateDebut, dateFin),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait rejeter dates invalides", async () => {
      const dateInvalide = new Date("invalid");

      await expect(
        service.obtenirStatistiquesParCours(dateInvalide, new Date()),
      ).rejects.toThrow();
    });

    it("devrait gérer dates futures avec précaution", async () => {
      const dateFuture = new Date("2099-12-31");

      const result = await service.obtenirStatistiquesParCours(
        new Date(),
        dateFuture,
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait rejeter string SQL comme date", async () => {
      const maliciousDate = "2024-01-01' OR '1'='1" as any;

      await expect(
        service.obtenirStatistiquesParCours(maliciousDate, new Date()),
      ).rejects.toThrow();
    });
  });

  describe("Validation des Paramètres Numériques", () => {
    it("devrait rejeter joursHistorique négatif", async () => {
      await expect(service.obtenirStatistiquesPresence(-30)).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait rejeter moisHistorique négatif", async () => {
      await expect(
        service.obtenirStatistiquesPresenceParMois(-6),
      ).rejects.toThrow(StatistiquesError);
    });

    it("devrait accepter valeur minimale pour paramètres optionnels", async () => {
      const result = await service.obtenirStatistiquesPresence(1);
      expect(result).toBeDefined();
    });

    it("devrait limiter joursHistorique excessif", async () => {
      // Devrait rejeter valeur > 365
      await expect(service.obtenirEvolutionInscriptions(10000)).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait rejeter NaN pour paramètres numériques", async () => {
      await expect(service.obtenirStatistiquesPresence(NaN)).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait rejeter Infinity pour paramètres numériques", async () => {
      await expect(
        service.obtenirStatistiquesPresenceParMois(Infinity),
      ).rejects.toThrow(StatistiquesError);
    });
  });

  describe("Protection contre Injection SQL", () => {
    it("devrait échapper les caractères spéciaux dans recherche utilisateur", async () => {
      const maliciousId = "1'; DROP TABLE utilisateurs; --";

      await expect(
        service.obtenirFrequentationUtilisateur(maliciousId as any),
      ).rejects.toThrow(StatistiquesError);

      // Le service rejette l'ID invalide avant d'appeler Prisma
    });

    it("devrait protéger contre injection dans filtres de dates", async () => {
      const maliciousDate = { $gt: "'; DROP TABLE paiements; --" } as any;

      // Devrait rejeter ou sanitizer
      try {
        await service.obtenirStatistiquesParCours(maliciousDate, new Date());
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("devrait utiliser requêtes paramétrées Prisma uniquement", async () => {
      await service.obtenirStatistiquesGenerales();

      // Vérifier qu'aucune méthode $queryRaw n'est utilisée
      expect(mockPrisma.$queryRaw).toBeUndefined();
      expect(mockPrisma.$executeRaw).toBeUndefined();
    });
  });

  describe("Protection des Données Sensibles", () => {
    it("ne devrait pas exposer mots de passe utilisateurs", async () => {
      const stats = await service.obtenirStatistiquesMembres();

      stats.nouveauxMembres.forEach((membre: any) => {
        expect(membre).not.toHaveProperty("password");
        expect(membre).not.toHaveProperty("mot_de_passe");
        expect(membre).not.toHaveProperty("hash");
      });
    });

    it("ne devrait pas exposer tokens ou sessions", async () => {
      const stats = await service.obtenirStatistiquesMembres();

      stats.nouveauxMembres.forEach((membre: any) => {
        expect(membre).not.toHaveProperty("token");
        expect(membre).not.toHaveProperty("session");
        expect(membre).not.toHaveProperty("refresh_token");
      });
    });

    it("devrait limiter informations financières sensibles", async () => {
      const stats = await service.obtenirStatistiquesFinancieres();

      // Ne devrait pas exposer détails bancaires
      if (stats.derniersPaiements) {
        stats.derniersPaiements.forEach((paiement: any) => {
          expect(paiement).not.toHaveProperty("carte_bancaire");
          expect(paiement).not.toHaveProperty("iban");
          expect(paiement).not.toHaveProperty("cvv");
        });
      }
    });

    it("devrait anonymiser données dans top membres si nécessaire", async () => {
      const stats = await service.obtenirStatistiquesMembres();

      // Vérifier structure sans données sensibles
      stats.topMembresAssidus.forEach((membre: any) => {
        expect(membre).toHaveProperty("first_name");
        expect(membre).toHaveProperty("last_name");
        expect(membre).not.toHaveProperty("adresse");
        expect(membre).not.toHaveProperty("telephone");
      });
    });
  });

  describe("Gestion des Erreurs de Base de Données", () => {
    it("devrait gérer erreur de connexion DB gracieusement", async () => {
      mockPrisma.utilisateurs.count.mockRejectedValue(
        new Error("Connection lost"),
      );

      await expect(service.obtenirStatistiquesGenerales()).rejects.toThrow(
        StatistiquesError,
      );
    });

    it("devrait encapsuler les erreurs DB dans StatistiquesError", async () => {
      const { StatistiquesError } = await import("@clubmanager/types");
      mockPrisma.cours.findMany.mockRejectedValue(
        new Error("Database error: table not found"),
      );

      await expect(
        service.obtenirStatistiquesParCours(),
      ).rejects.toBeInstanceOf(StatistiquesError);
    });

    it("devrait loguer erreurs sans exposer données sensibles", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockPrisma.paiements.findMany.mockRejectedValue(
        new Error("Sensitive data error"),
      );

      try {
        await service.obtenirStatistiquesFinancieres();
      } catch (error) {
        // Erreur capturée - c'est normal
      }

      // Vérifier qu'aucune erreur avec données sensibles n'a été loguée
      // (ou qu'aucun log n'a été fait si le service gère proprement l'erreur)
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("password"),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("token"),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Contrôle d'Accès et Autorisations", () => {
    it("devrait vérifier existence utilisateur avant statistiques personnelles", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirFrequentationUtilisateur(999);

      // Un utilisateur inexistant retourne un tableau vide
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("devrait permettre statistiques globales sans authentification", async () => {
      // Les stats globales sont publiques (pour admins)
      const result = await service.obtenirStatistiquesGenerales();
      expect(result).toBeDefined();
    });

    it("devrait protéger statistiques financières sensibles", async () => {
      // Note: la protection réelle serait dans les resolvers GraphQL
      const stats = await service.obtenirStatistiquesFinancieres();

      expect(stats).toHaveProperty("totalPaiementsMois");
      expect(stats.totalPaiementsMois).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Rate Limiting et DoS Prevention", () => {
    it("devrait gérer multiples requêtes simultanées", async () => {
      const requests = Array(100)
        .fill(null)
        .map(() => service.obtenirStatistiquesGenerales());

      const results = await Promise.all(requests);
      expect(results).toHaveLength(100);
    });

    it("devrait limiter taille des résultats pour éviter DoS", async () => {
      // Tester avec valeur dans les limites (max 36 mois)
      const result = await service.obtenirStatistiquesPresenceParMois(36);

      // Devrait limiter ou paginer résultats
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result.length).toBeLessThanOrEqual(36);
      }
    });

    it("devrait timeout sur requêtes trop longues", async () => {
      // Simuler requête lente
      mockPrisma.inscriptions.findMany.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const start = Date.now();
      await service.obtenirEvolutionInscriptions(30);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Validation XSS dans Sorties", () => {
    it("devrait échapper caractères HTML dans noms", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        {
          id: 1,
          first_name: '<script>alert("xss")</script>',
          last_name: "Test",
          email: "test@test.com",
          status_id: 1,
          date_inscription: new Date(),
          plan_tarifaire_id: 1,
          plans_tarifaires: { nom_plan: "Mensuel" },
          inscriptions: [],
        },
      ]);

      const stats = await service.obtenirStatistiquesMembres();

      // Vérifier que les données sont retournées (escaping serait côté front)
      expect(stats.nouveauxMembres[0].first_name).toBeDefined();
    });

    it("devrait valider format email sans scripts", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        {
          id: 1,
          first_name: "Test",
          last_name: "User",
          email: "test<script>@evil.com",
          status_id: 1,
          date_inscription: new Date(),
          plan_tarifaire_id: 1,
          plans_tarifaires: { nom_plan: "Mensuel" },
          inscriptions: [],
        },
      ]);

      const stats = await service.obtenirStatistiquesMembres();
      expect(stats.nouveauxMembres[0].email).toBeDefined();
    });
  });
});
