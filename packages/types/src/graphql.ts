/**
 * Export centralisé des types GraphQL
 * Utilisez: import { AuthUser, Utilisateur, ... } from '@clubmanager/types/graphql'
 */

// ============================================================================
// TYPES DATABASE (snake_case pour Prisma/DB)
// ============================================================================
export * from "./database/auth.db.types.js";
export * from "./database/utilisateurs.db.types.js";

// ============================================================================
// TYPES GRAPHQL (camelCase pour GraphQL)
// ============================================================================
export * from "./graphql/auth.graphql.types.js";
export * from "./graphql/utilisateurs.graphql.types.js";

// Note: Les validators sont disponibles via import séparé:
// import { loginSchema, validerLogin, ... } from '@clubmanager/types/validators'
