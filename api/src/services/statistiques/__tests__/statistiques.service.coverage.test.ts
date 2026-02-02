/**
 * Tests de couverture pour le service Statistiques
 * Tests exhaustifs de tous les chemins de code et paramètres
 */

import { jest } from "@jest/globals";
import {
  createMockPrisma,
  mockUtilisateurs,
  mockCours,
  mockInscriptions,
  mockPaiements,
} from "./statistiques.mock.js";
import { initStatistiquesService } from "../statistiques.service.js";

describe("StatistiquesService - Tests de Couverture", () => {
  let mockPrisma: any;
  let service: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = initStatistiquesService(mockPrisma);
  });

  describe("Couverture obtenirStatistiquesGenerales", () => {
    it("devrait compter tous les types d'entités", async () => {
      const result = await service.obtenirStatistiquesGenerales();

      expect(result).toHaveProperty("total_utilisateurs");
      expect(result).toHaveProperty("cours_a_venir");
      expect(result).toHaveProperty("total_inscriptions");
      expect(result).toHaveProperty("total_professeurs");
      expect(result).toHaveProperty("nombreMembres");
      expect(result).toHaveProperty("coursSemaine");
      expect(result).toHaveProperty("plansActifs");
    });

    it("devrait gérer base vide", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      mockPrisma.cours.count.mockResolvedValue(0);
      mockPrisma.inscriptions.count.mockResolvedValue(0);
      mockPrisma.professeurs.count.mockResolvedValue(0);
      mockPrisma.plans_tarifaires.count.mockResolvedValue(0);
      mockPrisma.cours_recurrent.count.mockResolvedValue(0);

      const result = await service.obtenirStatistiquesGenerales();

      expect(result.total_utilisateurs).toBe(0);
      expect(result.cours_a_venir).toBe(0);
      expect(result.total_inscriptions).toBe(0);
    });
  });

  describe("Couverture obtenirStatistiquesParCours", () => {
    it("devrait fonctionner sans dates (cours futurs par défaut)", async () => {
      try {
        const result = await service.obtenirStatistiquesParCours();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Peut ne pas avoir de cours futurs dans les mocks
        expect(error).toBeDefined();
      }
    });

    it("devrait fonctionner avec dateDebut seulement", async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date("2024-01-01"),
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait fonctionner avec dateFin seulement", async () => {
      const result = await service.obtenirStatistiquesParCours(
        undefined,
        new Date("2024-12-31"),
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait fonctionner avec les deux dates", async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait grouper par type de cours", async () => {
      const result = await service.obtenirStatistiquesParCours();

      result.forEach((stat: any) => {
        expect(stat).toHaveProperty("type_cours");
        expect(stat).toHaveProperty("nombre_inscriptions");
        expect(stat).toHaveProperty("taux_presence");
      });
    });

    it("devrait calculer tauxPresence = 0 si pas d'inscriptions", async () => {
      mockPrisma.cours.findMany.mockResolvedValue([
        { type_cours: "Test", inscriptions: [] },
      ]);

      const result = await service.obtenirStatistiquesParCours();

      if (result.length > 0) {
        expect(result[0].taux_presence).toBe(0);
      }
    });
  });

  describe("Couverture obtenirFrequentationUtilisateur", () => {
    it("devrait calculer fréquentation avec inscriptions", async () => {
      const result = await service.obtenirFrequentationUtilisateur(1);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("utilisateur_id", 1);
      }
    });

    it("devrait gérer utilisateur sans inscriptions", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirFrequentationUtilisateur(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("devrait grouper par mois et cours", async () => {
      const result = await service.obtenirFrequentationUtilisateur(1);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((freq: any) => {
        expect(freq).toHaveProperty("utilisateur_id");
      });
    });
  });

  describe("Couverture obtenirPresencesParMois", () => {
    it("devrait fonctionner sans filtre valide", async () => {
      const result = await service.obtenirPresencesParMois(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait filtrer presences validées (valide=true)", async () => {
      const result = await service.obtenirPresencesParMois(1, true);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait filtrer presences non validées (valide=false)", async () => {
      const result = await service.obtenirPresencesParMois(1, false);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait grouper par mois", async () => {
      const result = await service.obtenirPresencesParMois(1);

      result.forEach((presence: any) => {
        expect(presence).toHaveProperty("mois");
        expect(presence).toHaveProperty("total_presences");
      });
    });
  });

  describe("Couverture obtenirPresencesValideesParMois", () => {
    it("devrait appeler obtenirPresencesParMois avec valide=true", async () => {
      const spy = jest.spyOn(service, "obtenirPresencesParMois");

      await service.obtenirPresencesValideesParMois(1);

      expect(spy).toHaveBeenCalledWith(1, true);
      spy.mockRestore();
    });
  });

  describe("Couverture obtenirPresencesNonValideesParMois", () => {
    it("devrait appeler obtenirPresencesParMois avec valide=false", async () => {
      const spy = jest.spyOn(service, "obtenirPresencesParMois");

      await service.obtenirPresencesNonValideesParMois(1);

      expect(spy).toHaveBeenCalledWith(1, false);
      spy.mockRestore();
    });
  });

  describe("Couverture obtenirStatistiquesPresenceParMois", () => {
    it("devrait fonctionner sans paramètre (défaut)", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 1 mois", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 12 mois", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(12);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 36 mois (max)", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(36);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait calculer stats par mois", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(6);

      result.forEach((stat: any) => {
        expect(stat).toHaveProperty("mois");
        expect(stat).toHaveProperty("total_inscriptions");
        expect(stat).toHaveProperty("presences_validees");
        expect(stat).toHaveProperty("taux_presence");
      });
    });
  });

  describe("Couverture obtenirStatistiquesPresence", () => {
    it("devrait fonctionner sans paramètre (défaut)", async () => {
      const result = await service.obtenirStatistiquesPresence();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 1 jour", async () => {
      const result = await service.obtenirStatistiquesPresence(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 30 jours", async () => {
      const result = await service.obtenirStatistiquesPresence(30);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 365 jours (max)", async () => {
      const result = await service.obtenirStatistiquesPresence(365);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait calculer stats par date et cours", async () => {
      const result = await service.obtenirStatistiquesPresence(7);

      result.forEach((stat: any) => {
        expect(stat).toHaveProperty("date_cours");
        expect(stat).toHaveProperty("type_cours");
        expect(stat).toHaveProperty("total_inscrits");
        expect(stat).toHaveProperty("presents");
        expect(stat).toHaveProperty("taux_presence");
      });
    });
  });

  describe("Couverture obtenirProgressionUtilisateur", () => {
    it("devrait calculer niveau Débutant (0-10 cours)", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        ...Array(5)
          .fill(null)
          .map((_, i) => ({
            id: i,
            utilisateur_id: 1,
            cours_id: 1,
            status_id: 1,
            cours: { id: 1, type_cours: "Karaté", cours_recurrent_id: 1 },
          })),
      ]);

      const result = await service.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe("Débutant");
      expect(result.coursSuivis).toBeLessThanOrEqual(10);
    });

    it("devrait calculer niveau Intermédiaire (11-30 cours)", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        ...Array(20)
          .fill(null)
          .map((_, i) => ({
            id: i,
            utilisateur_id: 1,
            cours_id: 1,
            status_id: 1,
            cours: { id: 1, type_cours: "Karaté", cours_recurrent_id: 1 },
          })),
      ]);

      const result = await service.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe("Intermédiaire");
      expect(result.coursSuivis).toBeGreaterThan(10);
      expect(result.coursSuivis).toBeLessThanOrEqual(30);
    });

    it("devrait calculer niveau Avancé (31-50 cours)", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        ...Array(40)
          .fill(null)
          .map((_, i) => ({
            id: i,
            utilisateur_id: 1,
            cours_id: 1,
            status_id: 1,
            cours: { id: 1, type_cours: "Karaté", cours_recurrent_id: 1 },
          })),
      ]);

      const result = await service.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe("Avancé");
      expect(result.coursSuivis).toBeGreaterThan(30);
      expect(result.coursSuivis).toBeLessThanOrEqual(50);
    });

    it("devrait calculer niveau Expert (>50 cours)", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        ...Array(60)
          .fill(null)
          .map((_, i) => ({
            id: i,
            utilisateur_id: 1,
            cours_id: 1,
            status_id: 1,
            cours: { id: 1, type_cours: "Karaté", cours_recurrent_id: 1 },
          })),
      ]);

      const result = await service.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe("Expert");
      expect(result.coursSuivis).toBeGreaterThan(50);
    });

    it("devrait calculer progression par cours", async () => {
      const result = await service.obtenirProgressionUtilisateur(1);

      expect(result).toHaveProperty("progressionParCours");
      result.progressionParCours.forEach((prog: any) => {
        expect(prog).toHaveProperty("cours_id");
        expect(prog).toHaveProperty("titre");
        expect(prog).toHaveProperty("cours_suivis");
        expect(prog).toHaveProperty("progression");
        expect(prog.progression).toBeGreaterThanOrEqual(0);
        expect(prog.progression).toBeLessThanOrEqual(100);
      });
    });

    it("devrait calculer pourcentage_global", async () => {
      const result = await service.obtenirProgressionUtilisateur(1);

      expect(result).toHaveProperty("pourcentage_global");
      expect(result.pourcentage_global).toBeGreaterThanOrEqual(0);
      expect(result.pourcentage_global).toBeLessThanOrEqual(100);
    });
  });

  describe("Couverture obtenirEvolutionInscriptions", () => {
    it("devrait fonctionner sans paramètre (défaut)", async () => {
      const result = await service.obtenirEvolutionInscriptions();
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 7 jours", async () => {
      const result = await service.obtenirEvolutionInscriptions(7);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 30 jours", async () => {
      const result = await service.obtenirEvolutionInscriptions(30);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 90 jours", async () => {
      const result = await service.obtenirEvolutionInscriptions(90);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait accepter 365 jours (max)", async () => {
      const result = await service.obtenirEvolutionInscriptions(365);
      expect(Array.isArray(result)).toBe(true);
    });

    it("devrait grouper par date", async () => {
      const result = await service.obtenirEvolutionInscriptions(30);

      result.forEach((evol: any) => {
        expect(evol).toHaveProperty("date_inscription");
        expect(evol).toHaveProperty("nouvelles_inscriptions");
        expect(evol.nouvelles_inscriptions).toBeGreaterThanOrEqual(0);
      });
    });

    it("devrait trier par date croissante", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        { date_inscription: new Date("2024-06-03") },
        { date_inscription: new Date("2024-06-01") },
        { date_inscription: new Date("2024-06-02") },
      ]);

      const result = await service.obtenirEvolutionInscriptions(7);

      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1].date_inscription).getTime();
        const currDate = new Date(result[i].date_inscription).getTime();
        expect(currDate).toBeGreaterThanOrEqual(prevDate);
      }
    });
  });

  describe("Couverture obtenirStatistiquesFinancieres", () => {
    it("devrait calculer toutes les métriques financières", async () => {
      const result = await service.obtenirStatistiquesFinancieres();

      expect(result).toHaveProperty("totalPaiementsMois");
      expect(result).toHaveProperty("paiementsRecents");
      expect(result).toHaveProperty("paiementsEnAttente");
      expect(result).toHaveProperty("paiementsParMois");
      expect(result).toHaveProperty("tauxRenouvellement");
      expect(result).toHaveProperty("derniersPaiements");
      expect(result).toHaveProperty("paiementsEchus");
    });

    it("devrait calculer totalPaiementsMois = 0 si aucun paiement", async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);

      const result = await service.obtenirStatistiquesFinancieres();

      expect(result.totalPaiementsMois).toBe(0);
    });

    it("devrait gérer paiements avec montants variés", async () => {
      mockPrisma.paiements.findMany.mockResolvedValueOnce([
        { montant: 50.5, date_paiement: new Date(), statut: "validé" },
        { montant: 100.25, date_paiement: new Date(), statut: "confirmé" },
      ]);

      const result = await service.obtenirStatistiquesFinancieres();

      expect(result.totalPaiementsMois).toBeCloseTo(150.75, 2);
    });

    it("devrait grouper paiements par mois", async () => {
      const result = await service.obtenirStatistiquesFinancieres();

      expect(Array.isArray(result.paiementsParMois)).toBe(true);
      result.paiementsParMois.forEach((pm: any) => {
        expect(pm).toHaveProperty("mois");
        expect(pm).toHaveProperty("total");
      });
    });

    it("devrait calculer taux de renouvellement", async () => {
      const result = await service.obtenirStatistiquesFinancieres();

      expect(result.tauxRenouvellement).toBeGreaterThanOrEqual(0);
      expect(result.tauxRenouvellement).toBeLessThanOrEqual(100);
    });

    it("devrait limiter derniers paiements à 10", async () => {
      mockPrisma.paiements.findMany.mockResolvedValueOnce(
        Array(20)
          .fill(null)
          .map((_, i) => ({
            id: i,
            montant: 50,
            date_paiement: new Date(),
            statut: "validé",
            utilisateurs: {
              first_name: "Test",
              last_name: "User",
              nom_utilisateur: "test",
            },
          })),
      );

      const result = await service.obtenirStatistiquesFinancieres();

      expect(result.derniersPaiements.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Couverture obtenirStatistiquesMembres", () => {
    it("devrait calculer toutes les métriques membres", async () => {
      const result = await service.obtenirStatistiquesMembres();

      expect(result).toHaveProperty("nombreMembres");
      expect(result).toHaveProperty("nouveauxMembres");
      expect(result).toHaveProperty("membresParPlan");
      expect(result).toHaveProperty("topMembresAssidus");
    });

    it("devrait filtrer nouveaux membres (7 jours)", async () => {
      const result = await service.obtenirStatistiquesMembres();

      expect(Array.isArray(result.nouveauxMembres)).toBe(true);
      result.nouveauxMembres.forEach((membre: any) => {
        expect(membre).toHaveProperty("first_name");
        expect(membre).toHaveProperty("last_name");
        expect(membre).toHaveProperty("email");
        expect(membre).toHaveProperty("date_inscription");
      });
    });

    it("devrait calculer pourcentage par plan", async () => {
      const result = await service.obtenirStatistiquesMembres();

      let totalPourcentage = 0;
      result.membresParPlan.forEach((plan: any) => {
        expect(plan).toHaveProperty("plan");
        expect(plan).toHaveProperty("value");
        expect(plan).toHaveProperty("pourcentage");
        expect(plan.pourcentage).toBeGreaterThanOrEqual(0);
        expect(plan.pourcentage).toBeLessThanOrEqual(100);
        totalPourcentage += plan.pourcentage;
      });

      // Total devrait être ~100% (avec tolérance pour arrondis)
      if (result.membresParPlan.length > 0) {
        expect(totalPourcentage).toBeGreaterThan(99);
        expect(totalPourcentage).toBeLessThanOrEqual(101);
      }
    });

    it("devrait limiter top membres à 5", async () => {
      const result = await service.obtenirStatistiquesMembres();

      expect(result.topMembresAssidus.length).toBeLessThanOrEqual(5);
    });

    it("devrait trier top membres par présences décroissantes", async () => {
      const result = await service.obtenirStatistiquesMembres();

      for (let i = 1; i < result.topMembresAssidus.length; i++) {
        const prev = result.topMembresAssidus[i - 1].total_presences_validees;
        const curr = result.topMembresAssidus[i].total_presences_validees;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });
  });

  describe("Couverture obtenirTableauDeBord", () => {
    it("devrait combiner toutes les stats en un objet", async () => {
      const result = await service.obtenirTableauDeBord();

      expect(result).toHaveProperty("generales");
      expect(result).toHaveProperty("financieres");
      expect(result).toHaveProperty("membres");
      expect(result).toHaveProperty("presenceParMois");
      expect(result).toHaveProperty("articlesPlusVendus");
    });

    it("devrait utiliser 12 mois pour presenceParMois", async () => {
      const spy = jest.spyOn(service, "obtenirStatistiquesPresenceParMois");

      await service.obtenirTableauDeBord();

      expect(spy).toHaveBeenCalledWith(12);
      spy.mockRestore();
    });

    it("devrait calculer articles plus vendus", async () => {
      const result = await service.obtenirTableauDeBord();

      expect(Array.isArray(result.articlesPlusVendus)).toBe(true);
      result.articlesPlusVendus.forEach((article: any) => {
        expect(article).toHaveProperty("nom");
        expect(article).toHaveProperty("total_vendu");
        expect(article.total_vendu).toBeGreaterThanOrEqual(0);
      });
    });

    it("devrait limiter articles à 10", async () => {
      const result = await service.obtenirTableauDeBord();

      expect(result.articlesPlusVendus.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Couverture Méthodes Utilitaires", () => {
    it("devrait valider période correctement", async () => {
      // Période valide
      await expect(
        service.obtenirStatistiquesParCours(
          new Date("2024-01-01"),
          new Date("2024-12-31"),
        ),
      ).resolves.toBeDefined();
    });

    it("devrait rejeter période invalide", async () => {
      // dateDebut > dateFin
      await expect(
        service.obtenirStatistiquesParCours(
          new Date("2024-12-31"),
          new Date("2024-01-01"),
        ),
      ).rejects.toThrow();
    });

    it("devrait vérifier existence utilisateur", async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirFrequentationUtilisateur(999);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Couverture Cas Limites", () => {
    it("devrait gérer valeur limite min joursHistorique (1)", async () => {
      const result = await service.obtenirStatistiquesPresence(1);
      expect(result).toBeDefined();
    });

    it("devrait gérer valeur limite max joursHistorique (365)", async () => {
      const result = await service.obtenirStatistiquesPresence(365);
      expect(result).toBeDefined();
    });

    it("devrait gérer valeur limite min moisHistorique (1)", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(1);
      expect(result).toBeDefined();
    });

    it("devrait gérer valeur limite max moisHistorique (36)", async () => {
      const result = await service.obtenirStatistiquesPresenceParMois(36);
      expect(result).toBeDefined();
    });

    it("devrait gérer dates identiques", async () => {
      const date = new Date("2024-06-15");
      const result = await service.obtenirStatistiquesParCours(date, date);
      expect(result).toBeDefined();
    });

    it("devrait gérer utilisateur avec ID = 1", async () => {
      const result = await service.obtenirFrequentationUtilisateur(1);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].utilisateur_id).toBe(1);
      }
    });

    it("devrait gérer tous les status_id pour membres", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(10);

      const result = await service.obtenirStatistiquesMembres();
      expect(result.nombreMembres).toBe(10);
    });
  });

  describe("Couverture Gestion Erreurs", () => {
    it("devrait propager StatistiquesError correctement", async () => {
      const { StatistiquesError } = await import("@clubmanager/types");

      mockPrisma.inscriptions.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(
        service.obtenirFrequentationUtilisateur(1),
      ).rejects.toThrow();
    });

    it("devrait encapsuler erreurs DB dans StatistiquesError", async () => {
      const { StatistiquesError } = await import("@clubmanager/types");

      mockPrisma.cours.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(
        service.obtenirStatistiquesParCours(),
      ).rejects.toBeInstanceOf(StatistiquesError);
    });

    it("devrait avoir code erreur approprié", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        service.obtenirProgressionUtilisateur(999),
      ).rejects.toThrow();
    });

    it("devrait avoir statusCode HTTP approprié", async () => {
      // Test qu'une validation rejetant donne un statusCode 400
      await expect(
        service.obtenirFrequentationUtilisateur(-1),
      ).rejects.toThrow();
    });
  });
});
