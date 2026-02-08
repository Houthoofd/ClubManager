/**
 * Test Server Helper
 *
 * Démarre un vrai serveur HTTP sur un port éphémère pour les tests E2E.
 * Contourne le problème ECONNRESET avec Jest ESM + Multer + supertest.
 *
 * @module test-server
 */

import { Express } from "express";
import { Server } from "http";
import { AddressInfo } from "net";

export interface TestServer {
  url: string;
  port: number;
  server: Server;
  close: () => Promise<void>;
}

/**
 * Démarre l'application sur un port éphémère (0 = OS choisit un port libre)
 *
 * @param app - L'application Express à démarrer
 * @returns Promesse résolue avec les infos du serveur
 */
export async function startTestServer(app: Express): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    // Port 0 = le système d'exploitation choisit un port disponible
    const server = app.listen(0, () => {
      const address = server.address() as AddressInfo;

      if (!address) {
        reject(new Error("Impossible d'obtenir l'adresse du serveur"));
        return;
      }

      const port = address.port;
      const url = `http://localhost:${port}`;

      console.log(`✅ Test server started on ${url}`);

      resolve({
        url,
        port,
        server,
        close: async () => {
          return new Promise((resolveClose, rejectClose) => {
            server.close((err) => {
              if (err) {
                console.error("❌ Error closing test server:", err);
                rejectClose(err);
              } else {
                console.log(`✅ Test server on port ${port} closed`);
                resolveClose();
              }
            });
          });
        },
      });
    });

    server.on("error", (err) => {
      console.error("❌ Test server error:", err);
      reject(err);
    });
  });
}

/**
 * Arrête un serveur de test
 *
 * @param testServer - Le serveur à arrêter
 */
export async function stopTestServer(testServer: TestServer): Promise<void> {
  if (testServer && testServer.close) {
    await testServer.close();
  }
}

/**
 * Wrapper pour faciliter l'utilisation dans beforeAll/afterAll
 *
 * @example
 * ```typescript
 * let testServer: TestServer;
 *
 * beforeAll(async () => {
 *   const app = createTestApp();
 *   testServer = await startTestServer(app);
 * });
 *
 * afterAll(async () => {
 *   await stopTestServer(testServer);
 * });
 *
 * it("should work", async () => {
 *   const response = await request(testServer.url)
 *     .get("/api/upload/health")
 *     .expect(200);
 * });
 * ```
 */
export default {
  start: startTestServer,
  stop: stopTestServer,
};
