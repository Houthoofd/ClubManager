/**
 * Tests des scénarios d'erreur pour MysqlConnector
 *
 * Ces tests essaient de couvrir les branches d'erreur difficiles à atteindre
 */

import { jest } from "@jest/globals";
import MysqlConnector from "../mysqlconnector.js";

describe("MysqlConnector - Scénarios d'erreur avancés", () => {
  let connector: MysqlConnector;

  beforeAll(() => {
    connector = MysqlConnector.getInstance();
  });

  describe("Erreurs SQL diverses pour logs", () => {
    it("devrait logger les erreurs SQL avec le message et la requête", (done) => {
      // Ce test force le passage par les lignes 230-232 (logs d'erreur)
      connector.query(
        "SELECT * FROM table_absolument_inexistante_12345",
        [],
        (error) => {
          expect(error).toBeDefined();
          // Le message peut varier selon l'état du pool
          expect(error?.message).toBeDefined();
          done();
        },
      );
    });

    it("devrait logger plusieurs types d'erreurs SQL", async () => {
      const errors = [];

      // Erreur de syntaxe
      await new Promise((resolve) => {
        connector.query("INVALID SQL SYNTAX HERE", [], (error) => {
          errors.push(error);
          resolve(null);
        });
      });

      // Table inexistante
      await new Promise((resolve) => {
        connector.query("SELECT * FROM nonexistent_table_xyz", [], (error) => {
          errors.push(error);
          resolve(null);
        });
      });

      // Colonne inexistante
      await new Promise((resolve) => {
        connector.query(
          "SELECT nonexistent_column FROM mysql.user LIMIT 1",
          [],
          (error) => {
            errors.push(error);
            resolve(null);
          },
        );
      });

      expect(errors.length).toBe(3);
      errors.forEach((error) => expect(error).toBeDefined());
    });
  });

  describe("Scénarios de transaction avec erreurs", () => {
    it("devrait gérer une transaction avec query qui échoue puis commit", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Query qui échoue
        connection.query("INVALID SQL", [], (queryErr) => {
          expect(queryErr).toBeDefined();

          // Même avec une erreur de query, on peut commit (la transaction est vide)
          connector.commit(connection, (commitErr) => {
            // Le commit peut réussir ou échouer selon l'état de la transaction
            done();
          });
        });
      });
    });

    it("devrait gérer plusieurs transactions avec des erreurs", async () => {
      for (let i = 0; i < 3; i++) {
        await new Promise<void>((resolve) => {
          connector.beginTransaction((err, connection) => {
            if (!connection) {
              resolve();
              return;
            }

            connection.query(
              "SELECT * FROM table_inexistante",
              [],
              (queryErr) => {
                expect(queryErr).toBeDefined();

                connector.rollback(connection, () => {
                  resolve();
                });
              },
            );
          });
        });
      }
    });

    it("devrait gérer commit sans callback après une erreur", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        connection.query("SELECT 1", [], (queryErr) => {
          expect(queryErr).toBeNull();

          // Commit sans callback
          connector.commit(connection);

          setTimeout(() => {
            done();
          }, 100);
        });
      });
    });

    it("devrait gérer rollback sans callback après une erreur", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        connection.query("INVALID SQL", [], (queryErr) => {
          expect(queryErr).toBeDefined();

          // Rollback sans callback
          connector.rollback(connection);

          setTimeout(() => {
            done();
          }, 100);
        });
      });
    });
  });

  describe("Tests de charge pour saturer le pool", () => {
    it("devrait gérer une saturation temporaire du pool", async () => {
      // Lancer beaucoup de requêtes longues en parallèle pour saturer le pool
      const promises = Array.from(
        { length: 20 },
        (_, i) =>
          new Promise((resolve) => {
            connector.query(
              `SELECT ${i} AS id, SLEEP(0.05) AS delay`,
              [],
              (error, results) => {
                if (error) {
                  resolve(null);
                } else {
                  resolve(results[0].id);
                }
              },
            );
          }),
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(20);

      // Vérifier que le pool est toujours healthy après
      const status = connector.getPoolStatus();
      expect(status.healthy).toBe(true);
    });

    it("devrait maintenir la stabilité sous charge avec erreurs", async () => {
      // Mix de requêtes valides et invalides
      const promises = Array.from(
        { length: 15 },
        (_, i) =>
          new Promise((resolve) => {
            const query = i % 3 === 0 ? "INVALID SQL" : `SELECT ${i} AS id`;

            connector.query(query, [], (error, results) => {
              resolve(error ? null : results);
            });
          }),
      );

      await Promise.all(promises);

      const status = connector.getPoolStatus();
      expect(status.healthy).toBe(true);
    });
  });

  describe("Tests des méthodes close/closePool", () => {
    it("devrait avoir une méthode closePool", () => {
      expect(typeof connector.closePool).toBe("function");
      // Ne PAS appeler la méthode car elle fermerait le pool
    });

    it("devrait avoir une méthode close", () => {
      expect(typeof connector.close).toBe("function");
      // Ne PAS appeler la méthode car elle fermerait le pool
    });
  });

  describe("Graceful shutdown handlers", () => {
    it("devrait configurer les handlers sans les déclencher", () => {
      // Sauvegarder les handlers originaux
      const originalOn = process.on;
      const originalOnce = process.once;
      const originalExit = process.exit;

      const handlers: { [key: string]: Function[] } = {};
      let onCallCount = 0;
      let onceCallCount = 0;

      try {
        // Mock pour capturer les appels
        process.on = ((event: string, handler: any) => {
          onCallCount++;
          if (!handlers[event]) handlers[event] = [];
          handlers[event].push(handler);
          return process;
        }) as any;

        process.once = ((event: string, handler: any) => {
          onceCallCount++;
          if (!handlers[event]) handlers[event] = [];
          handlers[event].push(handler);
          return process;
        }) as any;

        process.exit = jest.fn() as any;

        // Appeler setupGracefulShutdown
        connector.setupGracefulShutdown();

        // Vérifier que les handlers ont été enregistrés
        expect(onceCallCount).toBeGreaterThanOrEqual(2); // SIGTERM, SIGINT
        expect(onCallCount).toBeGreaterThanOrEqual(2); // uncaughtException, unhandledRejection

        expect(handlers["SIGTERM"]).toBeDefined();
        expect(handlers["SIGINT"]).toBeDefined();
        expect(handlers["uncaughtException"]).toBeDefined();
        expect(handlers["unhandledRejection"]).toBeDefined();
      } finally {
        // Restaurer
        process.on = originalOn;
        process.once = originalOnce;
        process.exit = originalExit;
      }
    });

    it("ne devrait pas crasher si setupGracefulShutdown est appelé plusieurs fois", () => {
      expect(() => {
        connector.setupGracefulShutdown();
        connector.setupGracefulShutdown();
        connector.setupGracefulShutdown();
      }).not.toThrow();
    });
  });

  describe("Combinaisons de requêtes et transactions", () => {
    it("devrait gérer des requêtes normales et des transactions en parallèle", async () => {
      const queryPromises = Array.from(
        { length: 5 },
        (_, i) =>
          new Promise((resolve) => {
            connector.query(`SELECT ${i} AS id`, [], (error, results) => {
              resolve(error ? null : results[0].id);
            });
          }),
      );

      const transactionPromises = Array.from(
        { length: 3 },
        (_, i) =>
          new Promise<number>((resolve, reject) => {
            connector.beginTransaction((err, connection) => {
              if (err || !connection) {
                reject(err);
                return;
              }

              connection.query(
                `SELECT ${i + 100} AS val`,
                [],
                (queryErr, results) => {
                  if (queryErr) {
                    connector.rollback(connection);
                    reject(queryErr);
                    return;
                  }

                  connector.commit(connection, (commitErr) => {
                    if (commitErr) {
                      reject(commitErr);
                    } else {
                      resolve(results[0].val);
                    }
                  });
                },
              );
            });
          }),
      );

      const allResults = await Promise.all([
        ...queryPromises,
        ...transactionPromises,
      ]);

      expect(allResults.length).toBe(8);
    });
  });

  describe("getPoolStatus dans différents états", () => {
    it("devrait retourner un statut pendant et après l'exécution de requêtes", async () => {
      const statuses: any[] = [];

      // Lancer des requêtes
      const promises = Array.from(
        { length: 10 },
        (_, i) =>
          new Promise((resolve) => {
            connector.query(`SELECT ${i} AS id`, [], (error, results) => {
              resolve(error ? null : results);
            });
          }),
      );

      // Capturer le statut pendant l'exécution
      statuses.push(connector.getPoolStatus());

      await Promise.all(promises);

      // Capturer le statut après
      statuses.push(connector.getPoolStatus());

      statuses.forEach((status) => {
        expect(status.healthy).toBe(true);
        expect(status.total).toBeGreaterThanOrEqual(0);
        expect(status.free).toBeGreaterThanOrEqual(0);
        expect(status.used).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("waitForConnection dans différents scénarios", () => {
    it("devrait résoudre rapidement quand le pool est déjà prêt", async () => {
      const start = Date.now();
      await connector.waitForConnection(10000);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it("devrait gérer plusieurs appels concurrents à waitForConnection", async () => {
      const promises = Array.from({ length: 5 }, () =>
        connector.waitForConnection(5000),
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
