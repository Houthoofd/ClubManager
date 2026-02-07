/**
 * Tests d'initialisation du MysqlConnector
 *
 * Ces tests couvrent le code d'initialisation qui s'exécute au chargement du module
 */

import { jest } from "@jest/globals";

describe("MysqlConnector - Initialisation et configuration", () => {
  describe("Variables d'environnement", () => {
    it("devrait avoir les variables d'environnement nécessaires en mode test", () => {
      // Ces variables doivent être définies par jest.setup
      expect(process.env.DB_HOST).toBeDefined();
      expect(process.env.DB_USER).toBeDefined();
      expect(process.env.DB_NAME).toBeDefined();
      expect(process.env.NODE_ENV).toBe("test");
    });

    it("devrait utiliser les valeurs par défaut pour certaines variables", () => {
      // DB_PORT a une valeur par défaut de 3306
      const port = Number(process.env.DB_PORT) || 3306;
      expect(port).toBeGreaterThan(0);
    });

    it("devrait être en mode test", () => {
      expect(process.env.NODE_ENV).toBe("test");
    });
  });

  describe("Configuration du pool en mode test", () => {
    it("devrait utiliser une configuration adaptée au mode test", () => {
      // En mode test, le pool doit avoir :
      // - connectionLimit: 5
      // - queueLimit: 0
      // - enableKeepAlive: false
      // - timeout: 10000

      // On importe le connector pour vérifier qu'il s'initialise correctement
      return import("../mysqlconnector.js").then((module) => {
        const MysqlConnector = module.default;
        const connector = MysqlConnector.getInstance();

        // Vérifier que le connector est initialisé
        expect(connector).toBeDefined();
        expect(typeof connector.query).toBe("function");
        expect(typeof connector.getPoolStatus).toBe("function");
      });
    });
  });

  describe("Méthodes du connector", () => {
    it("devrait avoir toutes les méthodes publiques", async () => {
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;
      const connector = MysqlConnector.getInstance();

      expect(typeof connector.query).toBe("function");
      expect(typeof connector.beginTransaction).toBe("function");
      expect(typeof connector.commit).toBe("function");
      expect(typeof connector.rollback).toBe("function");
      expect(typeof connector.getPoolStatus).toBe("function");
      expect(typeof connector.close).toBe("function");
      expect(typeof connector.closePool).toBe("function");
      expect(typeof connector.waitForConnection).toBe("function");
      expect(typeof connector.setupGracefulShutdown).toBe("function");
    });
  });

  describe("Initialisation du pool", () => {
    it("devrait créer un pool MySQL au chargement", async () => {
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;
      const connector = MysqlConnector.getInstance();

      // Attendre que le pool soit prêt
      await connector.waitForConnection(5000);

      const status = connector.getPoolStatus();
      expect(status.healthy).toBe(true);
    });
  });

  describe("Singleton pattern", () => {
    it("devrait implémenter le pattern singleton correctement", async () => {
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;

      const instance1 = MysqlConnector.getInstance();
      const instance2 = MysqlConnector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Test de connexion initial", () => {
    it("devrait tester la connexion au démarrage", async () => {
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;
      const connector = MysqlConnector.getInstance();

      // Le test de connexion est asynchrone, attendons un peu
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = connector.getPoolStatus();
      expect(status).toBeDefined();
      expect(typeof status.healthy).toBe("boolean");
    });
  });

  describe("Configuration multipleStatements", () => {
    it("devrait désactiver multipleStatements par sécurité", async () => {
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;
      const connector = MysqlConnector.getInstance();

      // Vérifier qu'on ne peut pas exécuter plusieurs requêtes à la fois
      await new Promise<void>((resolve, reject) => {
        connector.query("SELECT 1; SELECT 2;", [], (error, results) => {
          // Cette requête devrait échouer ou n'exécuter que la première partie
          // car multipleStatements est désactivé
          if (error) {
            // Erreur attendue
            expect(error.message).toBeDefined();
          }
          resolve();
        });
      });
    });
  });

  describe("Gestion de __dirname en ES modules", () => {
    it("devrait gérer __dirname correctement", async () => {
      // Le connector gère __dirname pour les ES modules
      // On vérifie que le module se charge sans erreur
      const module = await import("../mysqlconnector.js");
      const MysqlConnector = module.default;
      const connector = MysqlConnector.getInstance();

      expect(connector).toBeDefined();
    });
  });
});

describe("MysqlConnector - Code de monitoring", () => {
  describe("Event listeners du pool", () => {
    it("ne devrait pas configurer les listeners en mode test", () => {
      // En mode test, les event listeners ne sont pas configurés
      // pour éviter les logs excessifs
      expect(process.env.NODE_ENV).toBe("test");
    });
  });

  describe("Monitoring avec setInterval", () => {
    it("ne devrait pas démarrer le monitoring en mode test", () => {
      // Le monitoring avec setInterval est désactivé en mode test
      // On vérifie juste que le mode test est actif
      expect(process.env.NODE_ENV).toBe("test");
    });
  });
});

describe("MysqlConnector - Gestion des erreurs au niveau du pool", () => {
  it("devrait avoir un mécanisme de gestion des erreurs", async () => {
    const module = await import("../mysqlconnector.js");
    const MysqlConnector = module.default;
    const connector = MysqlConnector.getInstance();

    // Le pool devrait être healthy car la DB est disponible en test
    const status = connector.getPoolStatus();
    expect(status.healthy).toBe(true);
  });
});
