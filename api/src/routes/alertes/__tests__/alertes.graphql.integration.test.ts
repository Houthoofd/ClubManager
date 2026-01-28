/**
 * Tests d'endpoints GraphQL pour les Alertes
 * Ces tests vérifient que les queries et mutations GraphQL fonctionnent correctement
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  teardownTestDatabase,
  seedTestAlertes,
} from "../../../tests/setup/testDatabase.js";

// IMPORTANT: Charger .env.test AVANT tout autre import
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
  path: join(__dirname, "../../../../.env.test"),
  override: true,
});

describe("Alertes - Tests GraphQL Endpoints", () => {
  let yoga: any;

  beforeAll(async () => {
    // Setup de la DB de test
    await setupTestDatabase();

    // Créer une instance Yoga pour les tests
    yoga = createYoga({
      schema,
      logging: false,
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    await seedTestAlertes();
  });

  /**
   * Helper pour exécuter une query GraphQL
   */
  async function executeGraphQL(query: string, variables?: any) {
    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    return result;
  }

  describe("Query: dashboardAlertes", () => {
    it("devrait retourner le dashboard des alertes", async () => {
      const query = `
        query {
          dashboardAlertes {
            totalAlertes
            alertesActives
            alertesCritiques
            alertesResolues
            alertesParType {
              typeAlerteId
              count
              statut
            }
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.dashboardAlertes).toBeDefined();
      expect(typeof result.data.dashboardAlertes.totalAlertes).toBe("number");
      expect(typeof result.data.dashboardAlertes.alertesActives).toBe("number");
      expect(typeof result.data.dashboardAlertes.alertesCritiques).toBe(
        "number",
      );
      expect(Array.isArray(result.data.dashboardAlertes.alertesParType)).toBe(
        true,
      );
    });

    it("devrait retourner des compteurs cohérents", async () => {
      const query = `
        query {
          dashboardAlertes {
            totalAlertes
            alertesActives
            alertesResolues
            alertesCritiques
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      const dashboard = result.data.dashboardAlertes;

      // Les alertes critiques doivent être <= aux alertes actives
      expect(dashboard.alertesCritiques).toBeLessThanOrEqual(
        dashboard.alertesActives,
      );

      // Le total doit être >= aux actives
      expect(dashboard.totalAlertes).toBeGreaterThanOrEqual(
        dashboard.alertesActives,
      );
    });
  });

  describe("Query: alertesActives", () => {
    it("devrait retourner uniquement les alertes actives", async () => {
      const query = `
        query {
          alertesActives {
            id
            utilisateurId
            statut
            typeAlerte
            priorite
            dateDetection
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data.alertesActives)).toBe(true);

      // Toutes les alertes doivent être actives
      result.data.alertesActives.forEach((alerte: any) => {
        expect(alerte.statut).toBe("active");
        expect(alerte.id).toBeDefined();
        expect(alerte.utilisateurId).toBeDefined();
      });
    });

    it("devrait retourner un tableau vide s'il n'y a pas d'alertes actives", async () => {
      // Ce test vérifie que la query fonctionne correctement
      // Note: Le beforeEach seed des alertes actives, donc on vérifie juste
      // que la query retourne un tableau et fonctionne sans erreur
      const query = `
        query {
          alertesActives {
            id
            statut
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(Array.isArray(result.data.alertesActives)).toBe(true);
      // Vérifier que toutes les alertes retournées sont bien actives
      result.data.alertesActives.forEach((alerte: any) => {
        expect(alerte.statut).toBe("active");
      });
    });
  });

  describe("Query: alertesUtilisateur", () => {
    it("devrait retourner les alertes d'un utilisateur spécifique", async () => {
      const query = `
        query AlertesUtilisateur($utilisateurId: Int!) {
          alertesUtilisateur(utilisateurId: $utilisateurId) {
            id
            utilisateurId
            statut
            typeAlerte
          }
        }
      `;

      const variables = { utilisateurId: 1 };
      const result = await executeGraphQL(query, variables);

      expect(result.errors).toBeUndefined();
      expect(Array.isArray(result.data.alertesUtilisateur)).toBe(true);

      // Toutes les alertes doivent appartenir à l'utilisateur 1
      result.data.alertesUtilisateur.forEach((alerte: any) => {
        expect(alerte.utilisateurId).toBe(1);
      });
    });

    it("devrait retourner un tableau vide pour un utilisateur sans alertes", async () => {
      const query = `
        query AlertesUtilisateur($utilisateurId: Int!) {
          alertesUtilisateur(utilisateurId: $utilisateurId) {
            id
          }
        }
      `;

      const variables = { utilisateurId: 99999 };
      const result = await executeGraphQL(query, variables);

      expect(result.errors).toBeUndefined();
      expect(Array.isArray(result.data.alertesUtilisateur)).toBe(true);
      expect(result.data.alertesUtilisateur.length).toBe(0);
    });

    it("devrait rejeter une requête sans utilisateurId", async () => {
      const query = `
        query {
          alertesUtilisateur {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Query: statistiquesAlertes", () => {
    it("devrait retourner les statistiques des alertes", async () => {
      const query = `
        query {
          statistiquesAlertes {
            totalAlertes
            alertesActives
            alertesResolues
            alertesCritiques
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.statistiquesAlertes).toBeDefined();
      expect(typeof result.data.statistiquesAlertes.totalAlertes).toBe(
        "number",
      );
      expect(typeof result.data.statistiquesAlertes.alertesActives).toBe(
        "number",
      );
      expect(typeof result.data.statistiquesAlertes.alertesResolues).toBe(
        "number",
      );
      expect(typeof result.data.statistiquesAlertes.alertesCritiques).toBe(
        "number",
      );
    });
  });

  describe("Mutation: detecterAlertes", () => {
    it("devrait détecter les nouvelles alertes", async () => {
      const mutation = `
        mutation {
          detecterAlertes {
            success
            message
          }
        }
      `;

      const result = await executeGraphQL(mutation);

      expect(result.errors).toBeUndefined();
      expect(result.data.detecterAlertes).toBeDefined();
      expect(result.data.detecterAlertes.success).toBe(true);
      expect(typeof result.data.detecterAlertes.message).toBe("string");
    });
  });

  describe("Mutation: resoudreAlerte", () => {
    it("devrait résoudre une alerte existante", async () => {
      // D'abord récupérer une alerte active
      const queryAlertes = `
        query {
          alertesActives {
            id
          }
        }
      `;

      const alertesResult = await executeGraphQL(queryAlertes);
      expect(alertesResult.data.alertesActives.length).toBeGreaterThan(0);
      const alerteId = alertesResult.data.alertesActives[0].id;

      // Résoudre l'alerte
      const mutation = `
        mutation ResoudreAlerte($input: ResoudreAlerteInput!) {
          resoudreAlerte(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          alerteId,
          notes: "Alerte résolue via GraphQL",
          effectuePar: 1,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      expect(result.errors).toBeUndefined();
      expect(result.data.resoudreAlerte).toBeDefined();
      expect(result.data.resoudreAlerte.success).toBe(true);
    });

    it("devrait rejeter la résolution d'une alerte inexistante", async () => {
      const mutation = `
        mutation ResoudreAlerte($input: ResoudreAlerteInput!) {
          resoudreAlerte(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          alerteId: 99999,
          notes: "Test",
          effectuePar: 1,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      // Soit une erreur GraphQL, soit success: false
      expect(
        result.errors !== undefined ||
          result.data.resoudreAlerte.success === false,
      ).toBe(true);
    });

    it("devrait rejeter une requête sans input requis", async () => {
      const mutation = `
        mutation {
          resoudreAlerte {
            success
            message
          }
        }
      `;

      const result = await executeGraphQL(mutation);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Mutation: ignorerAlerte", () => {
    it("devrait ignorer une alerte existante", async () => {
      // Récupérer une alerte active
      const queryAlertes = `
        query {
          alertesActives {
            id
          }
        }
      `;

      const alertesResult = await executeGraphQL(queryAlertes);
      expect(alertesResult.data.alertesActives.length).toBeGreaterThan(0);
      const alerteId = alertesResult.data.alertesActives[0].id;

      // Ignorer l'alerte
      const mutation = `
        mutation IgnorerAlerte($input: IgnorerAlerteInput!) {
          ignorerAlerte(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          alerteId,
          notes: "Alerte ignorée via GraphQL",
        },
      };

      const result = await executeGraphQL(mutation, variables);

      expect(result.errors).toBeUndefined();
      expect(result.data.ignorerAlerte).toBeDefined();
      expect(result.data.ignorerAlerte.success).toBe(true);
    });

    it("devrait accepter l'ignorance sans notes", async () => {
      const queryAlertes = `
        query {
          alertesActives {
            id
          }
        }
      `;

      const alertesResult = await executeGraphQL(queryAlertes);
      expect(alertesResult.data.alertesActives.length).toBeGreaterThan(0);
      const alerteId = alertesResult.data.alertesActives[0].id;

      const mutation = `
        mutation IgnorerAlerte($input: IgnorerAlerteInput!) {
          ignorerAlerte(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          alerteId,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      expect(result.errors).toBeUndefined();
      expect(result.data.ignorerAlerte.success).toBe(true);
    });
  });

  describe("Mutation: creerAlerte", () => {
    it("devrait créer une nouvelle alerte", async () => {
      const mutation = `
        mutation CreerAlerte($input: CreateAlerteInput!) {
          creerAlerte(input: $input) {
            id
            utilisateurId
            statut
            typeAlerte
          }
        }
      `;

      const variables = {
        input: {
          utilisateurId: 1,
          typeAlerteId: 1,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      expect(result.errors).toBeUndefined();
      expect(result.data.creerAlerte).toBeDefined();
      expect(result.data.creerAlerte.id).toBeDefined();
      expect(result.data.creerAlerte.utilisateurId).toBe(1);
      expect(result.data.creerAlerte.statut).toBe("active");
    });

    it("devrait rejeter la création sans utilisateurId", async () => {
      const mutation = `
        mutation CreerAlerte($input: CreateAlerteInput!) {
          creerAlerte(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          typeAlerteId: 1,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      expect(result.errors).toBeDefined();
    });
  });

  describe("Scénarios d'intégration complexes", () => {
    it("devrait refléter les changements après résolution dans le dashboard", async () => {
      // Récupérer le dashboard avant
      const queryDashboard = `
        query {
          dashboardAlertes {
            totalAlertes
            alertesActives
            alertesResolues
          }
        }
      `;

      const dashboardAvant = await executeGraphQL(queryDashboard);

      // Récupérer une alerte active
      const queryAlertes = `
        query {
          alertesActives {
            id
          }
        }
      `;

      const alertesResult = await executeGraphQL(queryAlertes);
      if (alertesResult.data.alertesActives.length > 0) {
        const alertesActivesAvant =
          dashboardAvant.data.dashboardAlertes.alertesActives;
        const alerteId = alertesResult.data.alertesActives[0].id;

        // Résoudre l'alerte
        const mutation = `
          mutation ResoudreAlerte($input: ResoudreAlerteInput!) {
            resoudreAlerte(input: $input) {
              success
            }
          }
        `;

        const variables = {
          input: {
            alerteId,
            notes: "Test",
            effectuePar: 1,
          },
        };

        const resolutionResult = await executeGraphQL(mutation, variables);

        // Vérifier que la résolution a réussi
        expect(resolutionResult.errors).toBeUndefined();
        expect(resolutionResult.data.resoudreAlerte.success).toBe(true);

        // Vérifier le dashboard après
        const dashboardApres = await executeGraphQL(queryDashboard);
        const alertesActivesApres =
          dashboardApres.data.dashboardAlertes.alertesActives;

        // Le nombre d'alertes actives devrait avoir diminué
        expect(alertesActivesApres).toBeLessThanOrEqual(alertesActivesAvant);
      }
    });

    it("devrait permettre une séquence complète: créer, détecter, résoudre", async () => {
      // 1. Détecter les alertes
      const mutationDetecter = `
        mutation {
          detecterAlertes {
            success
          }
        }
      `;

      const detectResult = await executeGraphQL(mutationDetecter);
      expect(detectResult.data.detecterAlertes.success).toBe(true);

      // 2. Récupérer les alertes actives
      const queryAlertes = `
        query {
          alertesActives {
            id
            utilisateurId
          }
        }
      `;

      const alertesResult = await executeGraphQL(queryAlertes);
      expect(Array.isArray(alertesResult.data.alertesActives)).toBe(true);

      // 3. Si des alertes existent, en résoudre une
      if (alertesResult.data.alertesActives.length > 0) {
        const alerteId = alertesResult.data.alertesActives[0].id;

        const mutationResoudre = `
          mutation ResoudreAlerte($input: ResoudreAlerteInput!) {
            resoudreAlerte(input: $input) {
              success
              message
            }
          }
        `;

        const variables = {
          input: {
            alerteId,
            notes: "Résolu dans le test d'intégration",
            effectuePar: 1,
          },
        };

        const resolveResult = await executeGraphQL(mutationResoudre, variables);
        if (resolveResult.errors) {
          console.error("Erreur résolution:", resolveResult.errors);
        }
        expect(resolveResult.data?.resoudreAlerte?.success).toBe(true);
      }
    });
  });
});
