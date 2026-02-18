/**
 * 🧪 Test Templates - ClubManager API
 *
 * Templates pour la génération de tous les types de tests
 */

import {
  toPascalCase,
  toCamelCase,
  toPlural,
  toSingular,
} from "../utils/string-utils.js";

/**
 * Template pour les tests unitaires des services
 */
export function unitServiceTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);
  const singularName = toSingular(domainName);

  return `/**
 * 🧪 Tests Unitaires - ${pascalName} Service
 *
 * Tests unitaires pour le service ${domainName}
 */

import { ${pascalName}Service } from "../../core/services/${domainName}.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    ${domainName}: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("${pascalName}Service - Tests Unitaires", () => {
  let service: ${pascalName}Service;

  beforeEach(() => {
    service = new ${pascalName}Service();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les ${domainName}", async () => {
      const mock${pascalName} = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.${domainName}.findMany as jest.Mock).mockResolvedValue(mock${pascalName});

      const result = await service.findAll({});

      expect(result).toEqual(mock${pascalName});
      expect(prisma.${domainName}.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.${domainName}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un ${singularName} par ID", async () => {
      const mock${pascalName} = { id: 1, name: "Test" };
      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(mock${pascalName});

      const result = await service.findById(1);

      expect(result).toEqual(mock${pascalName});
      expect(prisma.${domainName}.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau ${singularName}", async () => {
      const input = { name: "Nouveau ${singularName}" };
      const created = { id: 1, ...input };

      (prisma.${domainName}.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.${domainName}.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un ${singularName} existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.${domainName}.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un ${singularName} existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.${domainName}.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.${domainName}.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.${domainName}.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les ${domainName}", async () => {
      (prisma.${domainName}.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
`;
}

/**
 * Template pour les tests unitaires des resolvers
 */
export function unitResolverTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * 🧪 Tests Unitaires - ${pascalName} Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de ${domainName}
 */

import { ${camelName}Resolvers } from "../../core/resolvers/${domainName}.resolvers";
import { ${pascalName}Service } from "../../core/services/${domainName}.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/${domainName}.service");

describe("${pascalName} Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<${pascalName}Service>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new ${pascalName}Service() as jest.Mocked<${pascalName}Service>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:${domainName}", "create:${domainName}", "update:${domainName}", "delete:${domainName}"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.${camelName}", () => {
    it("devrait retourner tous les ${domainName}", async () => {
      const mock${pascalName} = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mock${pascalName});

      const result = await ${camelName}Resolvers.Query.${camelName}(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mock${pascalName});
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        ${camelName}Resolvers.Query.${camelName}({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        ${camelName}Resolvers.Query.${camelName}({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.create${pascalName}", () => {
    it("devrait créer un nouveau ${domainName}", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await ${camelName}Resolvers.Mutation.create${pascalName}(
        {},
        { input },
        mockContext
      );

      expect(result).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
    });
  });

  describe("Mutation.update${pascalName}", () => {
    it("devrait mettre à jour un ${domainName}", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await ${camelName}Resolvers.Mutation.update${pascalName}(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.delete${pascalName}", () => {
    it("devrait supprimer un ${domainName}", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await ${camelName}Resolvers.Mutation.delete${pascalName}(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
`;
}

/**
 * Template pour les tests d'intégration
 */
export function integrationTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * 🧪 Tests d'Intégration - ${pascalName}
 *
 * Tests d'intégration avec base de données pour ${domainName}
 */

import { ${pascalName}Service } from "../../core/services/${domainName}.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";

describe("${pascalName} - Tests d'Intégration", () => {
  let service: ${pascalName}Service;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    service = new ${pascalName}Service();
    // Nettoyage des données de test
    await prisma.${domainName}.deleteMany({});
  });

  describe("Cycle de vie complet", () => {
    it("devrait créer, lire, mettre à jour et supprimer un ${domainName}", async () => {
      // CREATE
      const created = await service.create({
        name: "Test ${pascalName}",
        // Ajoutez les champs requis
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();

      // READ
      const found = await service.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test ${pascalName}");

      // UPDATE
      const updated = await service.update(created.id, {
        name: "Updated ${pascalName}",
      });
      expect(updated.name).toBe("Updated ${pascalName}");

      // DELETE
      await service.delete(created.id);
      const deleted = await service.findById(created.id);
      expect(deleted).toBeNull();
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      // Créer des données de test
      for (let i = 1; i <= 25; i++) {
        await prisma.${domainName}.create({
          data: { name: \`Test \${i}\` },
        });
      }
    });

    it("devrait paginer correctement", async () => {
      const page1 = await service.findAll({ limit: 10, offset: 0 });
      const page2 = await service.findAll({ limit: 10, offset: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe("Contraintes de données", () => {
    it("devrait respecter les contraintes d'unicité", async () => {
      // Implémentez selon vos contraintes
    });

    it("devrait valider les données requises", async () => {
      // Implémentez selon vos validations
    });
  });
});
`;
}

/**
 * Template pour les tests de sécurité
 */
export function securityTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * 🔐 Tests de Sécurité - ${pascalName}
 *
 * Tests de sécurité pour ${domainName}
 */

import { ${camelName}Resolvers } from "../../core/resolvers/${domainName}.resolvers";
import { AuthenticationError, ForbiddenError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

describe("${pascalName} - Tests de Sécurité", () => {
  describe("Authentification", () => {
    it("devrait rejeter les requêtes non authentifiées", async () => {
      const unauthContext = {
        user: null,
        permissions: [],
      } as any;

      await expect(
        ${camelName}Resolvers.Query.${camelName}({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait accepter les utilisateurs authentifiés", async () => {
      const authContext = {
        user: { id: 1, role: "user" },
        permissions: ["read:${domainName}"],
      } as any;

      // Ne devrait pas lever d'erreur d'authentification
      await expect(
        ${camelName}Resolvers.Query.${camelName}({}, {}, authContext)
      ).resolves.toBeDefined();
    });
  });

  describe("Autorisation", () => {
    it("devrait vérifier les permissions de lecture", async () => {
      const noPermContext = {
        user: { id: 1, role: "user" },
        permissions: [],
      } as any;

      await expect(
        ${camelName}Resolvers.Query.${camelName}({}, {}, noPermContext)
      ).rejects.toThrow();
    });

    it("devrait vérifier les permissions de création", async () => {
      const noPermContext = {
        user: { id: 1, role: "user" },
        permissions: ["read:${domainName}"],
      } as any;

      await expect(
        ${camelName}Resolvers.Mutation.create${pascalName}({}, { input: {} }, noPermContext)
      ).rejects.toThrow();
    });

    it("devrait vérifier les permissions de suppression", async () => {
      const noPermContext = {
        user: { id: 1, role: "user" },
        permissions: ["read:${domainName}", "create:${domainName}"],
      } as any;

      await expect(
        ${camelName}Resolvers.Mutation.delete${pascalName}({}, { id: 1 }, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Injection et Validation", () => {
    it("devrait rejeter les IDs invalides", async () => {
      const context = {
        user: { id: 1, role: "admin" },
        permissions: ["read:${domainName}"],
      } as any;

      await expect(
        ${camelName}Resolvers.Query.${toCamelCase(toSingular(domainName))}(
          {},
          { id: "invalid" as any },
          context
        )
      ).rejects.toThrow();
    });

    it("devrait échapper les caractères dangereux", async () => {
      // Test d'injection SQL/NoSQL
      const maliciousInput = {
        name: "'; DROP TABLE ${domainName}; --",
      };

      const context = {
        user: { id: 1, role: "admin" },
        permissions: ["create:${domainName}"],
      } as any;

      // Ne devrait pas causer d'injection
      await expect(
        ${camelName}Resolvers.Mutation.create${pascalName}(
          {},
          { input: maliciousInput },
          context
        )
      ).resolves.toBeDefined();
    });
  });

  describe("Rate Limiting et Abus", () => {
    it("devrait limiter les requêtes trop fréquentes", async () => {
      // Implémentez si vous avez du rate limiting
    });

    it("devrait limiter la taille des résultats", async () => {
      const context = {
        user: { id: 1, role: "user" },
        permissions: ["read:${domainName}"],
      } as any;

      const result = await ${camelName}Resolvers.Query.${camelName}(
        {},
        { limit: 999999 },
        context
      );

      // Devrait être limité à un maximum raisonnable
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Isolation des données", () => {
    it("ne devrait pas exposer les données d'autres utilisateurs", async () => {
      // Testez l'isolation des données entre utilisateurs
    });

    it("devrait filtrer les champs sensibles", async () => {
      // Vérifiez que les champs sensibles ne sont pas exposés
    });
  });
});
`;
}

/**
 * Template pour les tests avancés (edge cases)
 */
export function advancedTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * 🎯 Tests Avancés - ${pascalName}
 *
 * Tests des cas limites et scénarios complexes pour ${domainName}
 */

import { ${pascalName}Service } from "../../core/services/${domainName}.service";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("${pascalName} - Tests Avancés", () => {
  let service: ${pascalName}Service;

  beforeEach(() => {
    service = new ${pascalName}Service();
    jest.clearAllMocks();
  });

  describe("Cas limites (Edge Cases)", () => {
    it("devrait gérer les valeurs nulles", async () => {
      // Test avec des valeurs nulles
    });

    it("devrait gérer les chaînes vides", async () => {
      // Test avec des chaînes vides
    });

    it("devrait gérer les IDs négatifs", async () => {
      const result = await service.findById(-1);
      expect(result).toBeNull();
    });

    it("devrait gérer les IDs très grands", async () => {
      const result = await service.findById(Number.MAX_SAFE_INTEGER);
      expect(result).toBeNull();
    });

    it("devrait gérer les valeurs limite (0, MAX)", async () => {
      await expect(service.findAll({ limit: 0 })).resolves.toBeDefined();
      await expect(service.findAll({ limit: 1000000 })).resolves.toBeDefined();
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait gérer les erreurs de base de données", async () => {
      // Simuler une erreur de connexion
      jest.spyOn(prisma.${domainName}, 'findMany').mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(service.findAll({})).rejects.toThrow();
    });

    it("devrait gérer les timeouts", async () => {
      // Test de timeout
    });

    it("devrait gérer les transactions échouées", async () => {
      // Test de rollback de transaction
    });
  });

  describe("Performance", () => {
    it("devrait gérer de grandes quantités de données", async () => {
      // Test avec beaucoup de données
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
      }));

      jest.spyOn(prisma.${domainName}, 'findMany').mockResolvedValue(largeDataset as any);

      const result = await service.findAll({ limit: 1000 });
      expect(result).toHaveLength(1000);
    });

    it("devrait optimiser les requêtes N+1", async () => {
      // Vérifiez qu'il n'y a pas de requêtes N+1
    });
  });

  describe("Concurrence", () => {
    it("devrait gérer les modifications concurrentes", async () => {
      // Test de race condition
    });

    it("devrait gérer les lectures pendant les écritures", async () => {
      // Test de consistency
    });
  });

  describe("Validation complexe", () => {
    it("devrait valider les dépendances entre champs", async () => {
      // Test de validation croisée
    });

    it("devrait valider les formats complexes", async () => {
      // Test de validation de format
    });

    it("devrait gérer les validations asynchrones", async () => {
      // Test de validation async
    });
  });

  describe("Scénarios métier complexes", () => {
    it("devrait gérer les workflows multi-étapes", async () => {
      // Test de workflow complet
    });

    it("devrait maintenir la cohérence des données", async () => {
      // Test d'intégrité référentielle
    });
  });
});
`;
}

/**
 * Template pour les tests E2E GraphQL
 */
export function e2eTestTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * 🌐 Tests E2E - ${pascalName}
 *
 * Tests end-to-end pour ${domainName} via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("${pascalName} - Tests E2E", () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    const auth = await authenticateUser("admin@example.com", "password");
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await prisma.${domainName}.deleteMany({});
  });

  describe("Query ${camelName}", () => {
    it("devrait récupérer tous les ${domainName}", async () => {
      // Créer des données de test
      await prisma.${domainName}.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = \`
        query {
          ${camelName}(limit: 10, offset: 0) {
            id
            name
          }
        }
      \`;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.${camelName}).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.${domainName}.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: \`Test \${i + 1}\`,
        })),
      });

      const query = \`
        query GetPaginated($limit: Int!, $offset: Int!) {
          ${camelName}(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      \`;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.${camelName}).toHaveLength(10);
      expect(page2.data.${camelName}).toHaveLength(10);
      expect(page1.data.${camelName}[0].id).not.toBe(page2.data.${camelName}[0].id);
    });
  });

  describe("Mutation create${pascalName}", () => {
    it("devrait créer un nouveau ${domainName}", async () => {
      const mutation = \`
        mutation Create($input: Create${pascalName}Input!) {
          create${pascalName}(input: $input) {
            id
            name
          }
        }
      \`;

      const variables = {
        input: {
          name: "Nouveau ${pascalName}",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.create${pascalName}).toBeDefined();
      expect(response.data.create${pascalName}.name).toBe("Nouveau ${pascalName}");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.${domainName}.findUnique({
        where: { id: response.data.create${pascalName}.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = \`
        mutation Create($input: Create${pascalName}Input!) {
          create${pascalName}(input: $input) {
            id
          }
        }
      \`;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation update${pascalName}", () => {
    it("devrait mettre à jour un ${domainName} existant", async () => {
      const existing = await prisma.${domainName}.create({
        data: { name: "Original" },
      });

      const mutation = \`
        mutation Update($id: Int!, $input: Update${pascalName}Input!) {
          update${pascalName}(id: $id, input: $input) {
            id
            name
          }
        }
      \`;

      const variables = {
        id: existing.id,
        input: { name: "Modifié" },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.update${pascalName}.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation delete${pascalName}", () => {
    it("devrait supprimer un ${domainName}", async () => {
      const existing = await prisma.${domainName}.create({
        data: { name: "À supprimer" },
      });

      const mutation = \`
        mutation Delete($id: Int!) {
          delete${pascalName}(id: $id) {
            success
            message
          }
        }
      \`;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.delete${pascalName}.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.${domainName}.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = \`
        mutation Create($input: Create${pascalName}Input!) {
          create${pascalName}(input: $input) {
            id
            name
          }
        }
      \`;

      const createResponse = await graphqlRequest(
        createMutation,
        { input: { name: "Workflow Test" } },
        authToken
      );
      const createdId = createResponse.data.create${pascalName}.id;

      // READ
      const readQuery = \`
        query Get($id: Int!) {
          ${toCamelCase(toSingular(domainName))}(id: $id) {
            id
            name
          }
        }
      \`;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.${toCamelCase(toSingular(domainName))}.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = \`
        mutation Update($id: Int!, $input: Update${pascalName}Input!) {
          update${pascalName}(id: $id, input: $input) {
            id
            name
          }
        }
      \`;

      const updateResponse = await graphqlRequest(
        updateMutation,
        { id: createdId, input: { name: "Updated Workflow" } },
        authToken
      );
      expect(updateResponse.data.update${pascalName}.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = \`
        mutation Delete($id: Int!) {
          delete${pascalName}(id: $id) {
            success
          }
        }
      \`;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.delete${pascalName}.success).toBe(true);
    });
  });
});
`;
}

/**
 * Template pour l'index des tests
 */
export function testIndexTemplate(domainName) {
  const pascalName = toPascalCase(domainName);

  return `/**
 * 🧪 Index des Tests - ${pascalName}
 *
 * Point d'entrée pour tous les tests de ${domainName}
 */

// Tests Unitaires
export * from './unit/${domainName}.service.unit.test';
export * from './unit/${domainName}.resolvers.unit.test';

// Tests d'Intégration
export * from './integration/${domainName}.integration.test';

// Tests de Sécurité
export * from './security/${domainName}.security.test';

// Tests Avancés
export * from './advanced/${domainName}.advanced.test';

// Tests E2E
export * from './e2e/${domainName}.e2e.test';
`;
}

export default {
  unitServiceTestTemplate,
  unitResolverTestTemplate,
  integrationTestTemplate,
  securityTestTemplate,
  advancedTestTemplate,
  e2eTestTemplate,
  testIndexTemplate,
};
