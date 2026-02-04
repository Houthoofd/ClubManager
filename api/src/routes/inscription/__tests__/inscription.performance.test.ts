/**
 * Tests de performance pour le module Inscription
 * Tests des temps de réponse et de la gestion de charge
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { InscriptionService } from "../core/services/inscription.service.js";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";

describe("Inscription Module - Performance Tests", () => {
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

  describe("Temps de réponse - Opérations individuelles", () => {
    it("devrait vérifier un email en moins de 100ms", async () => {
      const email = "test@example.com";

      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const startTime = Date.now();
      await inscriptionService.verifierEmail(email);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it("devrait hasher un mot de passe en moins de 200ms", async () => {
      const password = "SecureP@ss123";

      const startTime = Date.now();
      await inscriptionService.hashPassword(password);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    it("devrait valider un âge en moins de 5ms", () => {
      const date = "1990-05-15";

      const startTime = Date.now();
      inscriptionService.validerAge(date);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5);
    });

    it("devrait inscrire un utilisateur en moins de 500ms", async () => {
      const inscriptionData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
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

      const startTime = Date.now();
      await inscriptionService.inscrireUtilisateur(inscriptionData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Tests de charge - Vérification d'email", () => {
    it("devrait gérer 10 vérifications d'email concurrentes", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const promises = Array.from({ length: 10 }, (_, i) =>
        inscriptionService.verifierEmail(`test${i}@example.com`)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.exists === false)).toBe(true);
      expect(duration).toBeLessThan(1000); // 10 vérifications en moins de 1s
    });

    it("devrait gérer 50 vérifications d'email concurrentes", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const promises = Array.from({ length: 50 }, (_, i) =>
        inscriptionService.verifierEmail(`test${i}@example.com`)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(results.every((r) => r.exists === false)).toBe(true);
      expect(duration).toBeLessThan(3000); // 50 vérifications en moins de 3s
    });

    it("devrait gérer 100 vérifications d'email concurrentes", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const promises = Array.from({ length: 100 }, (_, i) =>
        inscriptionService.verifierEmail(`test${i}@example.com`)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.exists === false)).toBe(true);
      expect(duration).toBeLessThan(5000); // 100 vérifications en moins de 5s
    });
  });

  describe("Tests de charge - Inscription", () => {
    it("devrait gérer 5 inscriptions concurrentes", async () => {
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

      const promises = Array.from({ length: 5 }, (_, i) =>
        inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.success === true)).toBe(true);
      expect(duration).toBeLessThan(3000); // 5 inscriptions en moins de 3s
    });

    it("devrait gérer 10 inscriptions concurrentes", async () => {
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

      const promises = Array.from({ length: 10 }, (_, i) =>
        inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.success === true)).toBe(true);
      expect(duration).toBeLessThan(6000); // 10 inscriptions en moins de 6s
    });
  });

  describe("Tests de stress - Charge élevée", () => {
    it("devrait maintenir les performances avec 50 inscriptions séquentielles", async () => {
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

      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
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
      const maxDuration = Math.max(...durations);

      expect(avgDuration).toBeLessThan(500); // Moyenne < 500ms
      expect(maxDuration).toBeLessThan(1000); // Max < 1s
    });

    it("ne devrait pas avoir de dégradation de performance sur 100 opérations", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const first10Durations: number[] = [];
      const last10Durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        await inscriptionService.verifierEmail(`test${i}@example.com`);
        const duration = Date.now() - startTime;

        if (i < 10) {
          first10Durations.push(duration);
        } else if (i >= 90) {
          last10Durations.push(duration);
        }
      }

      const avgFirst = first10Durations.reduce((a, b) => a + b, 0) / first10Durations.length;
      const avgLast = last10Durations.reduce((a, b) => a + b, 0) / last10Durations.length;

      // La performance ne devrait pas se dégrader de plus de 50%
      expect(avgLast).toBeLessThan(avgFirst * 1.5);
    });
  });

  describe("Benchmarking - Validation", () => {
    it("devrait valider 1000 âges en moins de 100ms", () => {
      const dates = Array.from({ length: 1000 }, (_, i) => {
        const year = 1970 + (i % 50);
        return `${year}-05-15`;
      });

      const startTime = Date.now();
      dates.forEach((date) => inscriptionService.validerAge(date));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it("devrait évaluer la force de 1000 mots de passe en moins de 50ms", () => {
      const passwords = Array.from({ length: 1000 }, (_, i) => `Password${i}!`);

      const startTime = Date.now();
      passwords.forEach((password) => inscriptionService.evaluerForceMotDePasse(password));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it("devrait sanitizer 1000 objets utilisateur en moins de 20ms", () => {
      const users = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        nom: "Dupont",
        prenom: "Jean",
        email: `test${i}@example.com`,
        password: "hashedpassword",
      }));

      const startTime = Date.now();
      users.forEach((user) => inscriptionService.sanitizeUserData(user));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(20);
    });
  });

  describe("Memory profiling", () => {
    it("ne devrait pas avoir de memory leak sur 100 inscriptions", async () => {
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

      const memBefore = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
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

      // Force garbage collection si disponible
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;
      const memIncreasePerOp = memIncrease / 100;

      // Chaque opération ne devrait pas utiliser plus de 100KB
      expect(memIncreasePerOp).toBeLessThan(100 * 1024);
    });
  });

  describe("Throughput - Débit", () => {
    it("devrait traiter au moins 20 vérifications d'email par seconde", async () => {
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: false,
        message: "Email disponible",
      });

      const startTime = Date.now();
      const promises = Array.from({ length: 20 }, (_, i) =>
        inscriptionService.verifierEmail(`test${i}@example.com`)
      );
      await Promise.all(promises);
      const duration = Date.now() - startTime;

      const throughput = (20 / duration) * 1000; // opérations par seconde

      expect(throughput).toBeGreaterThan(20);
    });

    it("devrait traiter au moins 5 inscriptions par seconde", async () => {
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

      const startTime = Date.now();
      const promises = Array.from({ length: 5 }, (_, i) =>
        inscriptionService.inscrireUtilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: `test${i}@example.com`,
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        })
      );
      await Promise.all(promises);
      const duration = Date.now() - startTime;

      const throughput = (5 / duration) * 1000; // opérations par seconde

      expect(throughput).toBeGreaterThan(5);
    });
  });

  describe("Percentiles - Latence", () => {
    it("99ème percentile devrait être < 1000ms pour les inscriptions", async () => {
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

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
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

      durations.sort((a, b) => a - b);
      const p99 = durations[Math.floor(durations.length * 0.99)];

      expect(p99).toBeLessThan(1000);
    });

    it("médiane devrait être < 300ms pour les inscriptions", async () => {
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

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
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

      durations.sort((a, b) => a - b);
      const median = durations[Math.floor(durations.length / 2)];

      expect(median).toBeLessThan(300);
    });
  });
});
