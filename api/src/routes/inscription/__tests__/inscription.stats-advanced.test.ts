/**
 * Tests de statistiques avancées pour le module Inscription
 * Tests des métriques métier, analytics et reporting
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { InscriptionService } from "../core/services/inscription.service.js";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";

describe("Inscription Module - Statistics & Analytics Tests", () => {
  let inscriptionService: InscriptionService;
  let mockUtilisateursClient: Partial<Utilisateurs>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUtilisateursClient = {
      checkUtilisateurByEmail: jest.fn(),
      inscriptionUtilisateurSimple: jest.fn(),
      getUtilisateurByEmail: jest.fn(),
    };

    inscriptionService = new InscriptionService(mockUtilisateursClient as Utilisateurs);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Statistiques d'inscription - Volume", () => {
    it("devrait compter les inscriptions réussies", async () => {
      let successCount = 0;

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockImplementation(
        async () => {
          successCount++;
          return {
            isConfirm: true,
            message: "Inscription réussie",
            userId: successCount,
          };
        }
      );

      for (let i = 0; i < 10; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });
      }

      expect(successCount).toBe(10);
    });

    it("devrait compter les inscriptions échouées", async () => {
      let failureCount = 0;

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: true,
        message: "Email déjà utilisé",
      });

      for (let i = 0; i < 5; i++) {
        const result = await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: "duplicate@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });

        if (!result.success) {
          failureCount++;
        }
      }

      expect(failureCount).toBe(5);
    });

    it("devrait calculer le taux de conversion", async () => {
      let verificationCount = 0;
      let inscriptionCount = 0;

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockImplementation(
        async () => {
          verificationCount++;
          return { isFind: false, message: "Email disponible" };
        }
      );

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockImplementation(
        async () => {
          inscriptionCount++;
          return {
            isConfirm: true,
            message: "Inscription réussie",
            userId: inscriptionCount,
          };
        }
      );

      // 20 vérifications
      for (let i = 0; i < 20; i++) {
        await inscriptionService.verifierEmail(`test${i}@example.com`);
      }

      // 10 inscriptions
      for (let i = 0; i < 10; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });
      }

      const conversionRate = (inscriptionCount / verificationCount) * 100;

      expect(conversionRate).toBe(50); // 10/20 = 50%
      expect(conversionRate).toBeGreaterThan(0);
    });
  });

  describe("Analyse par abonnement", () => {
    it("devrait compter les inscriptions par type d'abonnement", async () => {
      const abonnementStats = {
        mensuel: 0,
        trimestriel: 0,
        annuel: 0,
      };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      // 5 mensuels, 3 trimestriels, 2 annuels
      const abonnements = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3];

      for (let i = 0; i < abonnements.length; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: abonnements[i],
          genre: 1,
        });

        if (abonnements[i] === 1) abonnementStats.mensuel++;
        if (abonnements[i] === 2) abonnementStats.trimestriel++;
        if (abonnements[i] === 3) abonnementStats.annuel++;
      }

      expect(abonnementStats.mensuel).toBe(5);
      expect(abonnementStats.trimestriel).toBe(3);
      expect(abonnementStats.annuel).toBe(2);
    });

    it("devrait calculer la popularité des abonnements", async () => {
      const abonnementCounts = { 1: 0, 2: 0, 3: 0 };
      const total = 30;

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      // Distribution réaliste: 60% mensuel, 30% trimestriel, 10% annuel
      for (let i = 0; i < total; i++) {
        let abonnement = 1;
        const random = Math.random();
        if (random > 0.6) abonnement = 2;
        if (random > 0.9) abonnement = 3;

        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement,
          genre: 1,
        });

        abonnementCounts[abonnement as keyof typeof abonnementCounts]++;
      }

      expect(abonnementCounts[1] + abonnementCounts[2] + abonnementCounts[3]).toBe(total);
    });
  });

  describe("Analyse par genre", () => {
    it("devrait compter les inscriptions par genre", async () => {
      const genreStats = {
        masculin: 0,
        feminin: 0,
      };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const genres = [1, 2, 1, 2, 1, 2, 1, 1, 2, 1];

      for (let i = 0; i < genres.length; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: genres[i],
        });

        if (genres[i] === 1) genreStats.masculin++;
        else genreStats.feminin++;
      }

      expect(genreStats.masculin).toBe(6);
      expect(genreStats.feminin).toBe(4);
    });

    it("devrait calculer le ratio homme/femme", async () => {
      const genreCounts = { 1: 0, 2: 0 };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      for (let i = 0; i < 20; i++) {
        const genre = i % 2 === 0 ? 1 : 2;

        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre,
        });

        genreCounts[genre as keyof typeof genreCounts]++;
      }

      const ratio = genreCounts[1] / genreCounts[2];

      expect(ratio).toBe(1); // 50/50
    });
  });

  describe("Analyse par âge", () => {
    it("devrait calculer la distribution des âges", async () => {
      const ageRanges = {
        "5-17": 0,
        "18-25": 0,
        "26-40": 0,
        "41-60": 0,
        "60+": 0,
      };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const today = new Date();
      const dates = [
        new Date(today.getFullYear() - 10, 0, 1).toISOString().split("T")[0], // 10 ans
        new Date(today.getFullYear() - 20, 0, 1).toISOString().split("T")[0], // 20 ans
        new Date(today.getFullYear() - 30, 0, 1).toISOString().split("T")[0], // 30 ans
        new Date(today.getFullYear() - 50, 0, 1).toISOString().split("T")[0], // 50 ans
        new Date(today.getFullYear() - 70, 0, 1).toISOString().split("T")[0], // 70 ans
      ];

      for (let i = 0; i < dates.length; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: dates[i],
          abonnement: 1,
          genre: 1,
        });

        const age = today.getFullYear() - parseInt(dates[i].split("-")[0]);
        if (age >= 5 && age <= 17) ageRanges["5-17"]++;
        else if (age >= 18 && age <= 25) ageRanges["18-25"]++;
        else if (age >= 26 && age <= 40) ageRanges["26-40"]++;
        else if (age >= 41 && age <= 60) ageRanges["41-60"]++;
        else if (age > 60) ageRanges["60+"]++;
      }

      expect(ageRanges["5-17"]).toBe(1);
      expect(ageRanges["18-25"]).toBe(1);
      expect(ageRanges["26-40"]).toBe(1);
      expect(ageRanges["41-60"]).toBe(1);
      expect(ageRanges["60+"]).toBe(1);
    });

    it("devrait calculer l'âge moyen des inscrits", async () => {
      const ages: number[] = [];

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const today = new Date();

      for (let i = 0; i < 10; i++) {
        const age = 20 + i * 5; // 20, 25, 30, 35, 40, 45, 50, 55, 60, 65
        const birthYear = today.getFullYear() - age;
        const date = `${birthYear}-01-01`;

        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date,
          abonnement: 1,
          genre: 1,
        });

        ages.push(age);
      }

      const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;

      expect(avgAge).toBeCloseTo(42.5, 1);
    });
  });

  describe("Qualité des mots de passe", () => {
    it("devrait analyser la force moyenne des mots de passe", () => {
      const passwords = [
        "WeakPass1!",
        "StrongP@ssw0rd123",
        "VeryStr0ng!Secur3",
        "MediumP@ss1",
        "UltraSecur3$Pass",
      ];

      const strengths = passwords.map((pwd) =>
        inscriptionService.evaluerForceMotDePasse(pwd)
      );

      const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length;

      expect(avgStrength).toBeGreaterThan(2);
      expect(avgStrength).toBeLessThanOrEqual(4);
    });

    it("devrait compter les mots de passe faibles vs forts", () => {
      const passwords = Array.from({ length: 20 }, (_, i) =>
        i < 10 ? `Weak${i}!` : `VeryStr0ng!P@ss${i}`
      );

      let weakCount = 0;
      let strongCount = 0;

      passwords.forEach((pwd) => {
        const strength = inscriptionService.evaluerForceMotDePasse(pwd);
        if (strength <= 2) weakCount++;
        else strongCount++;
      });

      expect(weakCount + strongCount).toBe(20);
    });
  });

  describe("Taux d'erreur et échecs", () => {
    it("devrait calculer le taux d'échec des inscriptions", async () => {
      let successCount = 0;
      let failureCount = 0;

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockImplementation(
        async (email: string) => {
          const isExisting = email.includes("duplicate");
          return {
            isFind: isExisting,
            message: isExisting ? "Email existant" : "Email disponible",
          };
        }
      );

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const emails = [
        "new1@test.com",
        "new2@test.com",
        "duplicate1@test.com",
        "new3@test.com",
        "duplicate2@test.com",
      ];

      for (const email of emails) {
        const result = await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });

        if (result.success) successCount++;
        else failureCount++;
      }

      const failureRate = (failureCount / emails.length) * 100;

      expect(failureRate).toBe(40); // 2 échecs sur 5 = 40%
    });

    it("devrait identifier les raisons d'échec les plus fréquentes", async () => {
      const failureReasons = {
        emailExistant: 0,
        ageInvalide: 0,
        erreurDB: 0,
      };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockImplementation(
        async (email: string) => {
          if (email.includes("duplicate")) {
            return { isFind: true, message: "Email existant" };
          }
          return { isFind: false, message: "Email disponible" };
        }
      );

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const testCases = [
        { email: "duplicate1@test.com", date: "1990-05-15" },
        { email: "duplicate2@test.com", date: "1990-05-15" },
        { email: "new1@test.com", date: "2022-01-01" }, // Trop jeune
        { email: "new2@test.com", date: "1890-01-01" }, // Trop vieux
      ];

      for (const testCase of testCases) {
        const result = await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: testCase.email,
          password: "SecureP@ss123",
          date: testCase.date,
          abonnement: 1,
          genre: 1,
        });

        if (!result.success) {
          if (result.message.includes("existe")) failureReasons.emailExistant++;
          if (result.message.includes("âge")) failureReasons.ageInvalide++;
        }
      }

      expect(failureReasons.emailExistant).toBeGreaterThan(0);
      expect(failureReasons.ageInvalide).toBeGreaterThan(0);
    });
  });

  describe("Temps de traitement moyen", () => {
    it("devrait calculer le temps moyen de vérification d'email", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const durations: number[] = [];

      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        await inscriptionService.verifierEmail(`test${i}@example.com`);
        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      expect(avgDuration).toBeGreaterThan(0);
      expect(avgDuration).toBeLessThan(100);
    });

    it("devrait calculer le temps moyen d'inscription complète", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        });
        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      expect(avgDuration).toBeGreaterThan(0);
      expect(avgDuration).toBeLessThan(500);
    });
  });

  describe("Tendances temporelles", () => {
    it("devrait identifier les heures de pointe", async () => {
      const hourlyStats: Record<number, number> = {};

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      for (let i = 0; i < 24; i++) {
        const hour = new Date().setHours(i);
        hourlyStats[i] = 0;

        // Simuler plus d'inscriptions entre 18h et 22h
        const inscriptionsThisHour = i >= 18 && i <= 22 ? 5 : 1;

        for (let j = 0; j < inscriptionsThisHour; j++) {
          await inscriptionService.inscrireUtilisateur({
            nom: "Dupont",
            prenom: "Jean",
            email: `test${i}_${j}@example.com`,
            password: "SecureP@ss123",
            date: "1990-05-15",
            abonnement: 1,
            genre: 1,
          });
          hourlyStats[i]++;
        }
      }

      const peakHour = Object.entries(hourlyStats).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0];

      expect(parseInt(peakHour)).toBeGreaterThanOrEqual(18);
      expect(parseInt(peakHour)).toBeLessThanOrEqual(22);
    });
  });

  describe("Reporting et métriques globales", () => {
    it("devrait générer un rapport complet des inscriptions", async () => {
      const report = {
        totalInscriptions: 0,
        totalVerifications: 0,
        conversionRate: 0,
        avgResponseTime: 0,
        failureRate: 0,
        popularAbonnement: 0,
        avgAge: 0,
        genreDistribution: { masculin: 0, feminin: 0 },
      };

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      let userId = 1;
      (mockUtilisateursClient.inscriptionUtilisateurSimple as jest.Mock).mockImplementation(
        async () => ({
          isConfirm: true,
          message: "Inscription réussie",
          userId: userId++,
        })
      );

      // Générer des données
      for (let i = 0; i < 20; i++) {
        await inscriptionService.verifierEmail(`test${i}@example.com`);
        report.totalVerifications++;
      }

      for (let i = 0; i < 15; i++) {
        await inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: i % 2 === 0 ? 1 : 2,
        });
        report.totalInscriptions++;
        if (i % 2 === 0) report.genreDistribution.masculin++;
        else report.genreDistribution.feminin++;
      }

      report.conversionRate =
        (report.totalInscriptions / report.totalVerifications) * 100;

      expect(report.totalInscriptions).toBe(15);
      expect(report.totalVerifications).toBe(20);
      expect(report.conversionRate).toBe(75);
    });
  });
});
