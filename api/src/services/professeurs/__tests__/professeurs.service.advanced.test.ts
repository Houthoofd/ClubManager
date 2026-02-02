/**
 * Tests avancés pour le service Professeurs
 * Performance, cas limites, scénarios complexes
 */

import { ProfesseursService } from "../professeurs.service.js";
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

describe("ProfesseursService - Tests Avancés", () => {
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
  // PERFORMANCE
  // ============================================

  describe("Tests de performance", () => {
    it("devrait gérer de grands volumes de professeurs", async () => {
      const largeBatch = Array(1000)
        .fill(mockProfesseur)
        .map((p, i) => ({
          ...p,
          id: i + 1,
          nom: `Professeur${i + 1}`,
        }));

      mockPrisma.utilisateurs.findMany.mockResolvedValue(largeBatch);
      mockPrisma.utilisateurs.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const result = await professeursService.obtenirProfesseurs({
        limit: 1000,
      });
      const executionTime = Date.now() - startTime;

      expect(result.professeurs.length).toBe(1000);
      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    it("devrait calculer les statistiques efficacement", async () => {
      const manyProfesseurs = Array(500)
        .fill(mockProfesseur)
        .map((p, i) => ({
          ...p,
          id: i + 1,
          nom: `Prof${i + 1}`,
          grade_id: (i % 7) + 1,
        }));

      mockPrisma.utilisateurs.count.mockResolvedValue(500);
      mockPrisma.utilisateurs.findMany.mockResolvedValue(manyProfesseurs);

      const startTime = Date.now();
      const result = await professeursService.statistiquesGenerales();
      const executionTime = Date.now() - startTime;

      expect(result.totalProfesseurs).toBe(500);
      expect(result.repartitionParGrade).toBeDefined();
      expect(executionTime).toBeLessThan(500);
    });

    it("devrait paginer efficacement les résultats", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(10000);

      // Requêtes multiples avec pagination
      for (let i = 0; i < 10; i++) {
        await professeursService.obtenirProfesseurs({
          limit: 50,
          offset: i * 50,
        });
      }

      expect(mockPrisma.utilisateurs.findMany.mock.calls.length).toBe(10);
    });

    it("devrait rechercher rapidement dans une grande base", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const startTime = Date.now();
      await professeursService.rechercherProfesseurs("Martin");
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(100);
    });

    it("devrait promouvoir plusieurs professeurs en parallèle", async () => {
      const utilisateurs = Array(20)
        .fill(mockUtilisateurNormal)
        .map((u, i) => ({
          ...u,
          id: i + 100,
        }));

      mockPrisma.utilisateurs.findUnique.mockImplementation((args: any) => {
        return Promise.resolve(
          utilisateurs.find((u) => u.id === args.where.id),
        );
      });

      mockPrisma.utilisateurs.update.mockImplementation((args: any) => {
        const user = utilisateurs.find((u) => u.id === args.where.id);
        return Promise.resolve({ ...user, status_id: 5 });
      });

      const startTime = Date.now();
      const result = await professeursService.ajouterProfesseur({
        utilisateurs: utilisateurs.map((u) => u.id),
      });
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.professeurs?.length).toBe(20);
      expect(executionTime).toBeLessThan(2000);
    });
  });

  // ============================================
  // CAS LIMITES
  // ============================================

  describe("Cas limites", () => {
    it("devrait gérer une liste vide de professeurs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.obtenirProfesseurs({});

      expect(result.professeurs).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("devrait gérer un offset supérieur au total", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(10);

      const result = await professeursService.obtenirProfesseurs({
        limit: 10,
        offset: 100,
      });

      expect(result.professeurs).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it("devrait gérer une recherche sans résultats", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.rechercherProfesseurs(
        "UtilisateurInexistant12345",
      );

      expect(result).toEqual([]);
    });

    it("devrait gérer un professeur avec toutes les valeurs NULL", async () => {
      const professeurMinimal = {
        id: 999,
        nom: "Test",
        prenom: "Test",
        nom_utilisateur: null,
        email: "test@example.com",
        genre_id: null,
        date_naissance: null,
        grade_id: null,
        status_id: 5,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(professeurMinimal);

      const result = await professeursService.obtenirProfesseurParId(999);

      expect(result).toBeDefined();
      expect(result?.genre_id).toBeNull();
      expect(result?.grade_id).toBeNull();
    });

    it("devrait gérer un planning vide", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await professeursService.obtenirPlanningProfesseur(1);

      expect(result.planning).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("devrait gérer une promotion avec tableau vide", async () => {
      await expect(
        professeursService.ajouterProfesseur({
          utilisateurs: [],
        }),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait gérer des IDs négatifs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.professeurExiste(-1);

      expect(result).toBe(false);
    });

    it("devrait gérer des IDs très grands (BigInt)", async () => {
      const bigId = 9007199254740991; // MAX_SAFE_INTEGER

      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.professeurExiste(bigId);

      expect(result).toBe(false);
    });
  });

  // ============================================
  // SCÉNARIOS COMPLEXES
  // ============================================

  describe("Scénarios complexes", () => {
    it("devrait gérer une promotion partielle avec erreurs mixtes", async () => {
      // 3 utilisateurs : 1 existe, 1 déjà prof, 1 inexistant
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockUtilisateurNormal) // ID 3 - OK
        .mockResolvedValueOnce(mockProfesseur) // ID 1 - Déjà prof
        .mockResolvedValueOnce(null); // ID 999 - Inexistant

      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [3, 1, 999],
      });

      expect(result.success).toBe(true); // Succès partiel
      expect(result.professeurs?.length).toBe(2); // 2 professeurs (3 et 1)
      expect(result.message).toContain("partielle");
    });

    it("devrait gérer des filtres multiples combinés", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await professeursService.obtenirProfesseurs({
        grade_id: 5,
        genre_id: 2,
        recherche: "Martin",
        limit: 10,
        offset: 0,
      });

      expect(result.professeurs).toHaveLength(1);

      const whereClause =
        mockPrisma.utilisateurs.findMany.mock.calls[0][0].where;
      expect(whereClause.grade_id).toBe(5);
      expect(whereClause.genre_id).toBe(2);
      expect(whereClause.OR).toBeDefined();
    });

    it("devrait gérer la modification de statut en cascade", async () => {
      // Scénario: Professeur actif -> Suspendu -> Réactivé -> Retraite
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      // Suspension
      mockPrisma.utilisateurs.update.mockResolvedValueOnce({
        ...mockProfesseur,
        status_id: 2,
      });

      let result = await professeursService.modifierStatutProfesseur({
        id: 1,
        status_id: 2,
      });
      expect(result.status_id).toBe(2);

      // Réactivation
      mockPrisma.utilisateurs.update.mockResolvedValueOnce({
        ...mockProfesseur,
        status_id: 5,
      });

      result = await professeursService.modifierStatutProfesseur({
        id: 1,
        status_id: 5,
      });
      expect(result.status_id).toBe(5);

      // Retraite (retrait définitif)
      mockPrisma.utilisateurs.update.mockResolvedValueOnce({
        ...mockProfesseur,
        status_id: 1,
      });

      const retrait = await professeursService.retirerPromotionProfesseur(1);
      expect(retrait.success).toBe(true);
    });

    it("devrait gérer des recherches avec caractères spéciaux", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // Caractères spéciaux qui pourraient causer des problèmes SQL
      const recherchesDifficiles = [
        "O'Brien",
        "Jean-François",
        "Müller",
        "Søren",
        "José",
        "d'Artagnan",
        "Marie-Anne",
        "%wildcards%",
        "_underscore_",
      ];

      for (const recherche of recherchesDifficiles) {
        const result =
          await professeursService.rechercherProfesseurs(recherche);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("devrait gérer des statistiques avec données incohérentes", async () => {
      // Nombre de professeurs != nombre dans findMany
      mockPrisma.utilisateurs.count.mockResolvedValue(10);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]); // Seulement 1 !

      const result = await professeursService.statistiquesGenerales();

      expect(result.totalProfesseurs).toBe(10); // Du count
      expect(result).toHaveProperty("moyenneCoursParProfesseur");
    });

    it("devrait gérer le planning avec cours en double", async () => {
      const planningAvecDoublons = [
        ...mockPlanningCours,
        mockPlanningCours[0], // Doublon
        mockPlanningCours[1], // Doublon
      ];

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue(planningAvecDoublons);

      const result = await professeursService.obtenirPlanningProfesseur(1);

      expect(result.planning.length).toBe(5); // 3 + 2 doublons
      expect(result.total).toBe(5);
    });
  });

  // ============================================
  // CONCURRENCE
  // ============================================

  describe("Tests de concurrence", () => {
    it("devrait gérer des requêtes simultanées", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      // Lancer 10 requêtes en parallèle
      const promises = Array(10)
        .fill(null)
        .map(() => professeursService.obtenirProfesseurs({}));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.professeurs).toHaveLength(1);
      });
    });

    it("devrait gérer des promotions concurrentes sur le même utilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      // Tenter de promouvoir le même utilisateur plusieurs fois simultanément
      const promises = Array(5)
        .fill(null)
        .map(() =>
          professeursService.ajouterProfesseur({
            utilisateurs: [3],
          }),
        );

      const results = await Promise.all(promises);

      // Tous devraient réussir (déjà professeur après la première)
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // EDGE CASES SPÉCIFIQUES AU MÉTIER
  // ============================================

  describe("Edge cases métier", () => {
    it("devrait gérer un professeur avec un planning de 24h/24", async () => {
      const planningComplet = Array(7)
        .fill(null)
        .map((_, jour) => ({
          cours_recurrent_id: jour + 1,
          type_cours: `Cours J${jour}`,
          jour_semaine: jour,
          heure_debut: "00:00",
          heure_fin: "23:59",
          est_recurrent_actif: true,
          professeur_id: 1,
          professeur_nom: "WorkaholicProf",
          professeur_prenom: "Jean",
        }));

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue(planningComplet);

      const result = await professeursService.obtenirPlanningProfesseur(1);

      expect(result.planning).toHaveLength(7);
      expect(result.total).toBe(7);
    });

    it("devrait gérer des statistiques avec zéro professeurs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const result = await professeursService.statistiquesGenerales();

      expect(result.totalProfesseurs).toBe(0);
      expect(result.moyenneCoursParProfesseur).toBe(0);
      expect(result.moyenneElevesParProfesseur).toBe(0);
    });

    it("devrait gérer un professeur promu puis immédiatement retiré", async () => {
      // Promotion
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      const ajout = await professeursService.ajouterProfesseur({
        utilisateurs: [3],
      });
      expect(ajout.success).toBe(true);

      // Retrait immédiat
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 1,
      });

      const retrait = await professeursService.retirerPromotionProfesseur(3);
      expect(retrait.success).toBe(true);
    });

    it("devrait gérer tous les utilisateurs déjà professeurs", async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockProfesseur)
        .mockResolvedValueOnce(mockProfesseur2);

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [1, 2],
      });

      expect(result.success).toBe(true);
      expect(result.professeurs?.length).toBe(2);
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(0); // Aucune update
    });

    it("devrait compter correctement avec BigInt", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { count: BigInt(9007199254740991) }, // MAX_SAFE_INTEGER en BigInt
      ]);

      const result = await professeursService.compterCoursProfesseur(1);

      expect(result).toBe(9007199254740991);
      expect(typeof result).toBe("number");
    });
  });

  // ============================================
  // TESTS DE COHÉRENCE
  // ============================================

  describe("Tests de cohérence", () => {
    it("devrait maintenir la cohérence entre count et findMany", async () => {
      const professeurs = [mockProfesseur, mockProfesseur2];

      mockPrisma.utilisateurs.findMany.mockResolvedValue(professeurs);
      mockPrisma.utilisateurs.count.mockResolvedValue(professeurs.length);

      const result = await professeursService.obtenirProfesseurs({});

      expect(result.professeurs.length).toBeLessThanOrEqual(result.total);
    });

    it("devrait avoir hasMore cohérent avec pagination", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const result = await professeursService.obtenirProfesseurs({
        limit: 10,
        offset: 95,
      });

      // offset (95) + length (1) = 96 < total (100)
      expect(result.hasMore).toBe(true);
    });

    it("devrait retourner des IDs cohérents", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const result = await professeursService.obtenirProfesseurParId(1);

      expect(result?.id).toBe(1);
    });
  });
});
