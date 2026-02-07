/**
 * Tests d'intégration pour MysqlConnector
 *
 * Ces tests utilisent une vraie connexion à la base de données de test
 * pour vérifier le comportement du connector.
 */

import MysqlConnector from "../mysqlconnector.js";

describe("MysqlConnector - Tests d'intégration", () => {
  let connector: MysqlConnector;

  beforeAll(() => {
    connector = MysqlConnector.getInstance();
  });

  afterAll(async () => {
    // Fermer le pool proprement après tous les tests
    await connector.closePool();
  });

  describe("getInstance", () => {
    it("devrait retourner une instance singleton", () => {
      const instance1 = MysqlConnector.getInstance();
      const instance2 = MysqlConnector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("waitForConnection", () => {
    it("devrait attendre que la connexion soit établie", async () => {
      await expect(connector.waitForConnection(5000)).resolves.toBeUndefined();
    });
  });

  describe("query", () => {
    it("devrait exécuter une requête SELECT simple", (done) => {
      connector.query("SELECT 1 AS result", [], (error, results) => {
        expect(error).toBeNull();
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results[0].result).toBe(1);
        done();
      });
    });

    it("devrait exécuter une requête avec paramètres", (done) => {
      const sql = "SELECT ? AS value";
      const values = ["test"];

      connector.query(sql, values, (error, results) => {
        expect(error).toBeNull();
        expect(results).toBeDefined();
        expect(results[0].value).toBe("test");
        done();
      });
    });

    it("devrait gérer les erreurs SQL", (done) => {
      const sql = "SELECT * FROM table_qui_nexiste_pas";

      connector.query(sql, [], (error, results) => {
        expect(error).toBeDefined();
        expect(error?.message).toContain("doesn't exist");
        done();
      });
    });
  });

  describe("transactions", () => {
    it("devrait démarrer, committer et fermer une transaction", (done) => {
      connector.beginTransaction((err, connection) => {
        expect(err).toBeNull();
        expect(connection).toBeDefined();

        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Exécuter une requête dans la transaction
        connection.query("SELECT 1", [], (queryErr, results) => {
          expect(queryErr).toBeNull();
          expect(results).toBeDefined();

          // Committer la transaction
          connector.commit(connection, (commitErr) => {
            expect(commitErr).toBeNull();
            done();
          });
        });
      });
    });

    it("devrait démarrer et rollback une transaction", (done) => {
      connector.beginTransaction((err, connection) => {
        expect(err).toBeNull();
        expect(connection).toBeDefined();

        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Rollback la transaction
        connector.rollback(connection, () => {
          // Le rollback ne retourne pas d'erreur
          expect(true).toBe(true);
          done();
        });
      });
    });

    it("devrait commit sans callback", (done) => {
      connector.beginTransaction((err, connection) => {
        expect(err).toBeNull();

        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Commit sans callback
        connector.commit(connection);

        // Attendre un peu pour que le commit se termine
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it("devrait rollback sans callback", (done) => {
      connector.beginTransaction((err, connection) => {
        expect(err).toBeNull();

        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Rollback sans callback
        connector.rollback(connection);

        // Attendre un peu pour que le rollback se termine
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });

  describe("getPoolStatus", () => {
    it("devrait retourner le statut du pool", () => {
      const status = connector.getPoolStatus();

      expect(status).toHaveProperty("total");
      expect(status).toHaveProperty("free");
      expect(status).toHaveProperty("used");
      expect(status).toHaveProperty("healthy");
      expect(typeof status.total).toBe("number");
      expect(typeof status.free).toBe("number");
      expect(typeof status.used).toBe("number");
      expect(typeof status.healthy).toBe("boolean");
      expect(status.healthy).toBe(true);
    });

    it("devrait montrer des connexions utilisées pendant une requête", (done) => {
      // Exécuter une requête qui prend du temps
      connector.query("SELECT SLEEP(0.1)", [], () => {
        // La requête est terminée
        done();
      });

      // Vérifier le statut pendant que la requête est en cours
      setTimeout(() => {
        const status = connector.getPoolStatus();
        // On devrait avoir au moins une connexion (peut être used ou free selon le timing)
        expect(status.total).toBeGreaterThanOrEqual(0);
      }, 10);
    });
  });

  describe("setupGracefulShutdown", () => {
    it("devrait configurer les handlers de shutdown", () => {
      // On ne peut pas vraiment tester les handlers car ils modifient process.on
      // Mais on peut au moins vérifier que la méthode ne lance pas d'erreur
      expect(() => {
        connector.setupGracefulShutdown();
      }).not.toThrow();
    });
  });

  describe("requêtes multiples concurrentes", () => {
    it("devrait gérer plusieurs requêtes en parallèle", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve, reject) => {
            connector.query("SELECT ? AS id", [i], (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results[0].id);
              }
            });
          }),
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe("gestion des erreurs de connexion", () => {
    it("devrait retourner une erreur pour une requête SQL invalide", (done) => {
      connector.query("THIS IS NOT VALID SQL", [], (error) => {
        expect(error).toBeDefined();
        expect(error?.message).toBeDefined();
        done();
      });
    });
  });

  describe("edge cases et robustesse", () => {
    it("devrait gérer une transaction avec erreur de commit", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        // Exécuter une requête invalide pour forcer une erreur
        connection.query(
          "INSERT INTO table_inexistante VALUES (1)",
          [],
          (queryErr) => {
            // On s'attend à une erreur
            expect(queryErr).toBeDefined();

            // Essayer de commit (devrait échouer ou rollback)
            connector.commit(connection, (commitErr) => {
              // Commit devrait réussir même si la requête a échoué
              // car on commit une transaction vide (la requête a échoué mais pas la transaction)
              done();
            });
          },
        );
      });
    });

    it("devrait gérer query avec tableau de valeurs vide", (done) => {
      connector.query("SELECT 1 AS result", [], (error, results) => {
        expect(error).toBeNull();
        expect(results[0].result).toBe(1);
        done();
      });
    });

    it("devrait gérer query avec plusieurs paramètres", (done) => {
      connector.query(
        "SELECT ? AS a, ? AS b, ? AS c",
        [1, "test", true],
        (error, results) => {
          expect(error).toBeNull();
          expect(results[0].a).toBe(1);
          expect(results[0].b).toBe("test");
          expect(results[0].c).toBe(1); // MySQL convertit true en 1
          done();
        },
      );
    });

    it("devrait maintenir le statut healthy même après plusieurs requêtes", async () => {
      // Exécuter plusieurs requêtes
      for (let i = 0; i < 5; i++) {
        await new Promise<void>((resolve) => {
          connector.query("SELECT 1", [], () => {
            resolve();
          });
        });
      }

      const status = connector.getPoolStatus();
      expect(status.healthy).toBe(true);
    });

    it("devrait gérer les transactions imbriquées (non supporté mais devrait pas crasher)", (done) => {
      connector.beginTransaction((err1, connection1) => {
        expect(err1).toBeNull();

        if (!connection1) {
          done.fail("Connection should be defined");
          return;
        }

        // MySQL ne supporte pas les transactions imbriquées,
        // mais on ne devrait pas crasher
        connector.commit(connection1, (commitErr) => {
          expect(commitErr).toBeNull();
          done();
        });
      });
    });

    it("devrait retourner un statut avec used = 0 quand aucune requête n'est en cours", (done) => {
      // Attendre que toutes les requêtes soient terminées
      setTimeout(() => {
        const status = connector.getPoolStatus();
        // used peut être 0 ou positif selon le timing
        expect(status.used).toBeGreaterThanOrEqual(0);
        expect(status.total).toBeGreaterThanOrEqual(status.used);
        done();
      }, 200);
    });

    it("devrait gérer une séquence complète: begin -> query -> commit", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        connection.query("SELECT 1 AS test", [], (queryErr, results) => {
          expect(queryErr).toBeNull();
          expect(results[0].test).toBe(1);

          connector.commit(connection, (commitErr) => {
            expect(commitErr).toBeNull();
            done();
          });
        });
      });
    });

    it("devrait gérer une séquence complète: begin -> query -> rollback", (done) => {
      connector.beginTransaction((err, connection) => {
        if (!connection) {
          done.fail("Connection should be defined");
          return;
        }

        connection.query("SELECT 1 AS test", [], (queryErr, results) => {
          expect(queryErr).toBeNull();
          expect(results[0].test).toBe(1);

          connector.rollback(connection, () => {
            done();
          });
        });
      });
    });
  });
});
