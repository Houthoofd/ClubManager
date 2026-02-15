/**
 * Export centralisé des types GraphQL
 * Utilisez: import { AuthUser, Utilisateur, ... } from '@clubmanager/types/graphql'
 */

// ============================================================================
// TYPES DATABASE (snake_case pour Prisma/DB)
// ============================================================================
export * from "../infrastructure/database/auth.types.js";
export * from "../infrastructure/database/utilisateurs.types.js";

// ============================================================================
// TYPES GRAPHQL (camelCase pour GraphQL)
// ============================================================================
export * from "../domains/auth/graphql.types.js";
export * from "../domains/utilisateurs/graphql.types.js";

// Note: Les validators sont disponibles via import séparé:
// import { loginSchema, validerLogin, ... } from '@clubmanager/types/validators'
