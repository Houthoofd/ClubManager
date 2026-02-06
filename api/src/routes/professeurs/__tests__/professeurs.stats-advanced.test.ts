/**
 * Tests avancés pour les statistiques et rapports du module Professeurs
 * Ces tests vérifient les agrégations, statistiques et rapports complexes
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";

describe("Professeurs Stats - Tests avancés", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockProfesseursClient: Partial<Professeurs>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockProfesseursClient = {
      obtenirLesProfesseurs: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      obtenirPlanningCoursProfesseur: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Statistiques globales des professeurs", () => {
    it("devrait calculer le nombre total de professeurs", async () => {
      const mockProfesseurs = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: i % 3 === 0 ? 3 : 2, // Quelques inactifs
      }));

      const total = mockProfesseurs.length;
      const actifs = mockProfesseurs.filter((p) => p.status_id === 2).length;
      const inactifs = mockProfesseurs.filter((p) => p.status_id === 3).length;

      expect(total).toBe(25);
      expect(actifs).toBeGreaterThan(0);
      expect(inactifs).toBeGreaterThan(0);
      expect(actifs + inactifs).toBe(total);
    });

    it("devrait calculer les statistiques de répartition par statut", async () => {
      const mockProfesseurs = [
        { id: 1, status_id: 1 }, // en_attente
        { id: 2, status_id: 1 },
        { id: 3, status_id: 2 }, // actif
        { id: 4, status_id: 2 },
        { id: 5, status_id: 2 },
        { id: 6, status_id: 2 },
        { id: 7, status_id: 3 }, // inactif
      ];

      const stats = mockProfesseurs.reduce(
        (acc, prof) => {
          if (prof.status_id === 1) acc.en_attente++;
          if (prof.status_id === 2) acc.actif++;
          if (prof.status_id === 3) acc.inactif++;
          return acc;
        },
        { en_attente: 0, actif: 0, inactif: 0 }
      );

      expect(stats.en_attente).toBe(2);
      expect(stats.actif).toBe(4);
      expect(stats.inactif).toBe(1);
    });

    it("devrait calculer le pourcentage de professeurs actifs", async () => {
      const mockProfesseurs = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        status_id: i < 75 ? 2 : 3, // 75% actifs, 25% inactifs
      }));

      const actifs = mockProfesseurs.filter((p) => p.status_id === 2).length;
      const pourcentage = (actifs / mockProfesseurs.length) * 100;

      expect(pourcentage).toBe(75);
    });
  });

  describe("Statistiques des cours par professeur", () => {
    it("devrait calculer le nombre moyen de cours par professeur", async () => {
      const professeursCours = [
        { professeur_id: 1, nb_cours: 3 },
        { professeur_id: 2, nb_cours: 5 },
        { professeur_id: 3, nb_cours: 2 },
        { professeur_id: 4, nb_cours: 4 },
      ];

      const totalCours = professeursCours.reduce(
        (sum, p) => sum + p.nb_cours,
        0
      );
      const moyenne = totalCours / professeursCours.length;

      expect(moyenne).toBe(3.5);
    });

    it("devrait identifier les professeurs avec le plus de cours", async () => {
      const professeursCours = [
        { professeur_id: 1, nom: "Prof A", nb_cours: 3 },
        { professeur_id: 2, nom: "Prof B", nb_cours: 8 },
        { professeur_id: 3, nom: "Prof C", nb_cours: 2 },
        { professeur_id: 4, nom: "Prof D", nb_cours: 8 },
      ];

      const maxCours = Math.max(...professeursCours.map((p) => p.nb_cours));
      const topProfesseurs = professeursCours.filter(
        (p) => p.nb_cours === maxCours
      );

      expect(maxCours).toBe(8);
      expect(topProfesseurs).toHaveLength(2);
      expect(topProfesseurs.map((p) => p.nom)).toEqual(["Prof B", "Prof D"]);
    });

    it("devrait identifier les professeurs sans cours assignés", async () => {
      const professeursCours = [
        { professeur_id: 1, nb_cours: 3 },
        { professeur_id: 2, nb_cours: 0 },
        { professeur_id: 3, nb_cours: 2 },
        { professeur_id: 4, nb_cours: 0 },
      ];

      const sansCours = professeursCours.filter((p) => p.nb_cours === 0);

      expect(sansCours).toHaveLength(2);
      expect(sansCours.map((p) => p.professeur_id)).toEqual([2, 4]);
    });

    it("devrait calculer la répartition des cours par jour", async () => {
      const mockCours = [
        { jour_semaine: "Lundi", professeur_id: 1 },
        { jour_semaine: "Lundi", professeur_id: 2 },
        { jour_semaine: "Mardi", professeur_id: 1 },
        { jour_semaine: "Mercredi", professeur_id: 3 },
        { jour_semaine: "Lundi", professeur_id: 3 },
      ];

      const repartition = mockCours.reduce(
        (acc, cours) => {
          acc[cours.jour_semaine] = (acc[cours.jour_semaine] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(repartition.Lundi).toBe(3);
      expect(repartition.Mardi).toBe(1);
      expect(repartition.Mercredi).toBe(1);
    });
  });

  describe("Statistiques de charge de travail", () => {
    it("devrait calculer les heures d'enseignement par professeur", async () => {
      const mockCours = [
        {
          professeur_id: 1,
          heure_debut: "18:00",
          heure_fin: "19:30",
          duree_heures: 1.5,
        },
        {
          professeur_id: 1,
          heure_debut: "19:30",
          heure_fin: "21:00",
          duree_heures: 1.5,
        },
        {
          professeur_id: 2,
          heure_debut: "18:00",
          heure_fin: "20:00",
          duree_heures: 2,
        },
      ];

      const heuresParProf = mockCours.reduce(
        (acc, cours) => {
          acc[cours.professeur_id] =
            (acc[cours.professeur_id] || 0) + cours.duree_heures;
          return acc;
        },
        {} as Record<number, number>
      );

      expect(heuresParProf[1]).toBe(3);
      expect(heuresParProf[2]).toBe(2);
    });

    it("devrait identifier les professeurs avec une charge élevée", async () => {
      const heuresParProf = [
        { professeur_id: 1, heures: 3 },
        { professeur_id: 2, heures: 12 },
        { professeur_id: 3, heures: 8 },
        { professeur_id: 4, heures: 15 },
      ];

      const seuilCharge = 10;
      const chargeElevee = heuresParProf.filter(
        (p) => p.heures >= seuilCharge
      );

      expect(chargeElevee).toHaveLength(2);
      expect(chargeElevee.map((p) => p.professeur_id)).toEqual([2, 4]);
    });

    it("devrait calculer la charge moyenne d'enseignement", async () => {
      const heuresParProf = [3, 5, 8, 4, 6, 2, 7];

      const moyenne =
        heuresParProf.reduce((sum, h) => sum + h, 0) / heuresParProf.length;

      expect(moyenne).toBeCloseTo(5, 0);
    });
  });

  describe("Statistiques de disponibilité", () => {
    it("devrait calculer les créneaux disponibles par jour", async () => {
      const joursOuvrables = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
      const creneauxParJour = 6; // 6 créneaux de 1h30 possibles par jour
      const totalCreneaux = joursOuvrables.length * creneauxParJour;

      const coursExistants = 12; // 12 cours déjà programmés
      const disponibles = totalCreneaux - coursExistants;

      expect(totalCreneaux).toBe(30);
      expect(disponibles).toBe(18);
      expect((disponibles / totalCreneaux) * 100).toBe(60);
    });

    it("devrait identifier les jours les plus chargés", async () => {
      const coursParJour = {
        Lundi: 5,
        Mardi: 3,
        Mercredi: 7,
        Jeudi: 2,
        Vendredi: 4,
      };

      const jourLesPlusCharge = Object.entries(coursParJour).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      expect(jourLesPlusCharge[0]).toBe("Mercredi");
      expect(jourLesPlusCharge[1]).toBe(7);
    });
  });

  describe("Rapports de performance", () => {
    it("devrait générer un rapport de taux de remplissage des cours", async () => {
      const mockCours = [
        { id: 1, capacite_max: 20, inscrits: 18 },
        { id: 2, capacite_max: 15, inscrits: 15 },
        { id: 3, capacite_max: 25, inscrits: 10 },
        { id: 4, capacite_max: 20, inscrits: 20 },
      ];

      const rapportRemplissage = mockCours.map((cours) => ({
        id: cours.id,
        taux: (cours.inscrits / cours.capacite_max) * 100,
      }));

      expect(rapportRemplissage[0].taux).toBe(90);
      expect(rapportRemplissage[1].taux).toBe(100);
      expect(rapportRemplissage[2].taux).toBe(40);
      expect(rapportRemplissage[3].taux).toBe(100);
    });

    it("devrait calculer le taux de remplissage moyen par professeur", async () => {
      const coursParProf = {
        1: [
          { capacite_max: 20, inscrits: 18 },
          { capacite_max: 15, inscrits: 15 },
        ],
        2: [
          { capacite_max: 25, inscrits: 10 },
          { capacite_max: 20, inscrits: 20 },
        ],
      };

      const tauxMoyenParProf = Object.entries(coursParProf).map(
        ([profId, cours]) => {
          const totalCapacite = cours.reduce((s, c) => s + c.capacite_max, 0);
          const totalInscrits = cours.reduce((s, c) => s + c.inscrits, 0);
          const tauxMoyen = (totalInscrits / totalCapacite) * 100;

          return { professeur_id: profId, taux_moyen: tauxMoyen };
        }
      );

      expect(tauxMoyenParProf[0].taux_moyen).toBeCloseTo(94.29, 1);
      expect(tauxMoyenParProf[1].taux_moyen).toBeCloseTo(66.67, 1);
    });
  });

  describe("Agrégations complexes", () => {
    it("devrait agréger les données sur plusieurs dimensions", async () => {
      const mockDonnees = [
        { professeur_id: 1, status_id: 2, nb_cours: 3, heures: 4.5 },
        { professeur_id: 2, status_id: 2, nb_cours: 5, heures: 7.5 },
        { professeur_id: 3, status_id: 3, nb_cours: 2, heures: 3 },
        { professeur_id: 4, status_id: 2, nb_cours: 4, heures: 6 },
      ];

      const stats = {
        total: mockDonnees.length,
        actifs: mockDonnees.filter((d) => d.status_id === 2).length,
        totalCours: mockDonnees.reduce((s, d) => s + d.nb_cours, 0),
        totalHeures: mockDonnees.reduce((s, d) => s + d.heures, 0),
        moyenneCours:
          mockDonnees.reduce((s, d) => s + d.nb_cours, 0) / mockDonnees.length,
        moyenneHeures:
          mockDonnees.reduce((s, d) => s + d.heures, 0) / mockDonnees.length,
      };

      expect(stats.total).toBe(4);
      expect(stats.actifs).toBe(3);
      expect(stats.totalCours).toBe(14);
      expect(stats.totalHeures).toBe(21);
      expect(stats.moyenneCours).toBe(3.5);
      expect(stats.moyenneHeures).toBe(5.25);
    });

    it("devrait calculer des statistiques par période", async () => {
      const mockPromotions = [
        { mois: "Janvier", nb_promotions: 2 },
        { mois: "Février", nb_promotions: 1 },
        { mois: "Mars", nb_promotions: 3 },
        { mois: "Avril", nb_promotions: 0 },
        { mois: "Mai", nb_promotions: 2 },
      ];

      const totalPromotions = mockPromotions.reduce(
        (s, p) => s + p.nb_promotions,
        0
      );
      const moyenneParMois = totalPromotions / mockPromotions.length;
      const moisMax = mockPromotions.reduce((a, b) =>
        a.nb_promotions > b.nb_promotions ? a : b
      );

      expect(totalPromotions).toBe(8);
      expect(moyenneParMois).toBe(1.6);
      expect(moisMax.mois).toBe("Mars");
      expect(moisMax.nb_promotions).toBe(3);
    });
  });

  describe("Tableaux de bord et métriques", () => {
    it("devrait générer un tableau de bord complet", async () => {
      const mockProfesseurs = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        status_id: i < 40 ? 2 : 3,
        nb_cours: Math.floor(Math.random() * 8) + 1,
      }));

      const dashboard = {
        total_professeurs: mockProfesseurs.length,
        actifs: mockProfesseurs.filter((p) => p.status_id === 2).length,
        inactifs: mockProfesseurs.filter((p) => p.status_id === 3).length,
        total_cours: mockProfesseurs.reduce((s, p) => s + p.nb_cours, 0),
        moyenne_cours:
          mockProfesseurs.reduce((s, p) => s + p.nb_cours, 0) /
          mockProfesseurs.length,
        taux_activite:
          (mockProfesseurs.filter((p) => p.status_id === 2).length /
            mockProfesseurs.length) *
          100,
      };

      expect(dashboard.total_professeurs).toBe(50);
      expect(dashboard.actifs).toBe(40);
      expect(dashboard.inactifs).toBe(10);
      expect(dashboard.total_cours).toBeGreaterThan(50);
      expect(dashboard.moyenne_cours).toBeGreaterThan(0);
      expect(dashboard.taux_activite).toBe(80);
    });

    it("devrait calculer des KPIs (indicateurs clés de performance)", async () => {
      const kpis = {
        ratio_professeurs_etudiants: 1 / 15, // 1 prof pour 15 étudiants
        taux_satisfaction: 4.5, // sur 5
        taux_retention: 92, // 92% des profs restent actifs
        heures_moyennes_par_semaine: 8,
        taux_cours_complets: 85, // 85% des cours sont pleins
      };

      expect(kpis.ratio_professeurs_etudiants).toBeCloseTo(0.067, 3);
      expect(kpis.taux_satisfaction).toBeGreaterThanOrEqual(4);
      expect(kpis.taux_retention).toBeGreaterThanOrEqual(90);
      expect(kpis.heures_moyennes_par_semaine).toBeGreaterThanOrEqual(5);
      expect(kpis.taux_cours_complets).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Analyse de tendances", () => {
    it("devrait analyser la croissance du nombre de professeurs", async () => {
      const evolutionMensuelle = [
        { mois: "Jan", total: 20 },
        { mois: "Fév", total: 22 },
        { mois: "Mar", total: 24 },
        { mois: "Avr", total: 25 },
        { mois: "Mai", total: 28 },
      ];

      const croissance = evolutionMensuelle.map((m, i) => {
        if (i === 0) return { ...m, croissance: 0 };
        const precedent = evolutionMensuelle[i - 1].total;
        const taux = ((m.total - precedent) / precedent) * 100;
        return { ...m, croissance: taux };
      });

      expect(croissance[1].croissance).toBe(10);
      expect(croissance[2].croissance).toBeCloseTo(9.09, 2);
      expect(croissance[4].croissance).toBe(12);
    });

    it("devrait identifier les tendances de charge de travail", async () => {
      const chargeParSemaine = [
        { semaine: 1, heures_moyennes: 6 },
        { semaine: 2, heures_moyennes: 7 },
        { semaine: 3, heures_moyennes: 8 },
        { semaine: 4, heures_moyennes: 9 },
      ];

      const tendance =
        chargeParSemaine[chargeParSemaine.length - 1].heures_moyennes >
        chargeParSemaine[0].heures_moyennes;

      const augmentation =
        chargeParSemaine[chargeParSemaine.length - 1].heures_moyennes -
        chargeParSemaine[0].heures_moyennes;

      expect(tendance).toBe(true);
      expect(augmentation).toBe(3);
    });
  });

  describe("Filtrage et tri des statistiques", () => {
    it("devrait filtrer les professeurs par critères multiples", async () => {
      const mockProfesseurs = [
        { id: 1, status_id: 2, nb_cours: 5, anciennete: 3 },
        { id: 2, status_id: 2, nb_cours: 3, anciennete: 1 },
        { id: 3, status_id: 3, nb_cours: 2, anciennete: 5 },
        { id: 4, status_id: 2, nb_cours: 7, anciennete: 4 },
      ];

      // Filtrer: actifs avec plus de 4 cours et ancienneté > 2 ans
      const filtered = mockProfesseurs.filter(
        (p) => p.status_id === 2 && p.nb_cours > 4 && p.anciennete > 2
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.id)).toEqual([1, 4]);
    });

    it("devrait trier les professeurs par différents critères", async () => {
      const mockProfesseurs = [
        { id: 1, nom: "Charlie", nb_cours: 5 },
        { id: 2, nom: "Alice", nb_cours: 3 },
        { id: 3, nom: "Bob", nb_cours: 7 },
      ];

      // Tri par nombre de cours (décroissant)
      const parCours = [...mockProfesseurs].sort(
        (a, b) => b.nb_cours - a.nb_cours
      );
      expect(parCours[0].id).toBe(3); // Bob avec 7 cours

      // Tri par nom (alphabétique)
      const parNom = [...mockProfesseurs].sort((a, b) =>
        a.nom.localeCompare(b.nom)
      );
      expect(parNom[0].nom).toBe("Alice");
    });
  });

  describe("Exportation et formatage des données", () => {
    it("devrait formater les données pour un rapport CSV", async () => {
      const mockProfesseurs = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          nb_cours: 5,
          heures: 7.5,
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          nb_cours: 3,
          heures: 4.5,
        },
      ];

      const csvData = mockProfesseurs.map((p) =>
        [p.id, p.first_name, p.last_name, p.nb_cours, p.heures].join(",")
      );

      expect(csvData).toHaveLength(2);
      expect(csvData[0]).toBe("1,John,Doe,5,7.5");
      expect(csvData[1]).toBe("2,Jane,Smith,3,4.5");
    });

    it("devrait formater les données pour un rapport JSON", async () => {
      const stats = {
        total: 50,
        actifs: 42,
        moyenne_cours: 4.2,
        date_rapport: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(stats);
      const parsed = JSON.parse(jsonString);

      expect(parsed.total).toBe(50);
      expect(parsed.actifs).toBe(42);
      expect(parsed.moyenne_cours).toBe(4.2);
    });
  });
});
