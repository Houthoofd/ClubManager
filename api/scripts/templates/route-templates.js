/**
 * 📝 Route Templates - ClubManager API
 *
 * Templates pour la génération des routes GraphQL
 */

import { toPascalCase, toCamelCase, toPlural, toSingular } from '../utils/string-utils.js';

/**
 * Template pour l'index principal d'une route
 */
export function indexTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * Exports du module ${pascalName} (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { ${camelName}Resolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/${domainName}.service.js";
`;
}

/**
 * Template pour le fichier de resolvers GraphQL
 */
export function resolversTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);
  const singularName = toSingular(domainName);
  const pluralName = toPlural(domainName);

  return `/**
 * 🔄 Resolvers GraphQL - ${pascalName}
 *
 * Gère les opérations GraphQL pour ${domainName}
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { ${pascalName}Service } from "../services/${domainName}.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const ${camelName}Service = new ${pascalName}Service();

/**
 * Resolvers GraphQL pour ${domainName}
 */
export const ${camelName}Resolvers = {
  Query: {
    /**
     * Récupère tous les ${pluralName}
     */
    ${camelName}: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:${domainName}");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await ${camelName}Service.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un ${singularName} par ID
     */
    ${toCamelCase(singularName)}: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:${domainName}");
      const userId = getUserIdFromContext(context);

      const result = await ${camelName}Service.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(\`${pascalName} avec l'ID \${args.id} introuvable\`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau ${singularName}
     */
    create${pascalName}: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:${domainName}");
      const userId = getUserIdFromContext(context);

      return await ${camelName}Service.create({ ...args.input, userId });
    },

    /**
     * Met à jour un ${singularName}
     */
    update${pascalName}: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:${domainName}");
      const userId = getUserIdFromContext(context);

      return await ${camelName}Service.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un ${singularName}
     */
    delete${pascalName}: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:${domainName}");
      const userId = getUserIdFromContext(context);

      await ${camelName}Service.delete(args.id, userId);
      return { success: true, message: "${pascalName} supprimé avec succès" };
    },
  },
};

export default ${camelName}Resolvers;
`;
}

/**
 * Template pour l'index des resolvers
 */
export function resolversIndexTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);

  return `/**
 * Index du module GraphQL ${pascalName}
 * ✅ Export centralisé des resolvers et typedefs
 */

export { ${camelName}Resolvers } from "./${domainName}.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { ${camelName}TypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./${domainName}.resolvers.js";
`;
}

/**
 * Template pour le service
 */
export function serviceTemplate(domainName) {
  const pascalName = toPascalCase(domainName);
  const camelName = toCamelCase(domainName);
  const singularName = toSingular(domainName);

  return `/**
 * 🔧 Service - ${pascalName}
 *
 * Logique métier pour ${domainName}
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class ${pascalName}Service {
  /**
   * Récupère tous les ${domainName}
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.${domainName}WhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.${domainName}.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un ${singularName} par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.${domainName}WhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.${domainName}.findFirst({ where });
  }

  /**
   * Crée un nouveau ${singularName}
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.${domainName}.create({
      data,
    });
  }

  /**
   * Met à jour un ${singularName}
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(\`${pascalName} avec l'ID \${id} introuvable\`);
    }

    return await prisma.${domainName}.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un ${singularName}
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(\`${pascalName} avec l'ID \${id} introuvable\`);
    }

    await prisma.${domainName}.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de ${domainName}
   */
  async count(filters?: any) {
    return await prisma.${domainName}.count({
      where: filters,
    });
  }
}

export default ${pascalName}Service;
`;
}

/**
 * Template pour les handlers (si nécessaire)
 */
export function handlersTemplate(domainName) {
  const pascalName = toPascalCase(domainName);

  return `/**
 * 🎯 Handlers - ${pascalName}
 *
 * Handlers de logique métier spécifique pour ${domainName}
 */

/**
 * Exemple de handler personnalisé
 */
export async function example${pascalName}Handler(data: any) {
  // Implémentez votre logique métier ici
  return data;
}

export default {
  example${pascalName}Handler,
};
`;
}

/**
 * Template pour un fichier de types personnalisés
 */
export function typesTemplate(domainName) {
  const pascalName = toPascalCase(domainName);

  return `/**
 * 📦 Types personnalisés - ${pascalName}
 *
 * Types TypeScript spécifiques au domaine ${domainName}
 */

/**
 * Options de filtrage pour ${domainName}
 */
export interface ${pascalName}FilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour ${domainName}
 */
export interface ${pascalName}PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface ${pascalName}MutationResult {
  success: boolean;
  message: string;
  data?: any;
}
`;
}

export default {
  indexTemplate,
  resolversTemplate,
  resolversIndexTemplate,
  serviceTemplate,
  handlersTemplate,
  typesTemplate,
};
