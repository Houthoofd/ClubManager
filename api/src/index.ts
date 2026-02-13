/**
 * ClubManager API - Exports centralisés
 *
 * ✅ Point d'entrée unique pour tous les exports de l'API
 * ✅ Tous les modules ont maintenant des barrel exports (index.ts)
 * ✅ 19 modules dans routes/ + infrastructure/ + shared/
 *
 * STRUCTURE DES BARREL EXPORTS:
 *
 * src/
 * ├── index.ts                    ← Vous êtes ici (export global)
 * ├── infrastructure/index.ts     ← Exports infrastructure (DB, Email, S3)
 * ├── shared/index.ts            ← Exports partagés (middleware, errors, utils)
 * └── routes/
 *     ├── index.ts               ← Exports de tous les modules
 *     ├── auth/index.ts          ← Module auth
 *     ├── alertes/index.ts       ← Module alertes
 *     ├── cours/index.ts         ← Module cours
 *     └── [16 autres modules]/index.ts
 *
 * UTILISATION:
 *
 * @example Import depuis infrastructure
 * import { prisma, emailClient, s3Service } from '@/infrastructure';
 *
 * @example Import depuis shared
 * import { requireAuth, requireAdmin, ValidationError } from '@/shared';
 *
 * @example Import depuis un module spécifique
 * import { authService, authentifierUtilisateur } from '@/routes/auth';
 * import { coursResolvers } from '@/routes/cours';
 *
 * @example Import global (tout depuis un point)
 * import { prisma, requireAuth, authService } from '@/index';
 *
 * COMMANDES UTILES:
 * - npm run migrate:imports:dry  → Simuler migration des imports
 * - npm run migrate:imports      → Migrer tous les imports vers path aliases
 * - npm run organize:check       → Vérifier l'organisation
 */

// ===== Infrastructure =====
export * from "./infrastructure/index.js";

// ===== Shared =====
export * from "./shared/index.js";

// ===== Routes (Modules métier) =====
export * from "./routes/index.js";

// ===== GraphQL =====
export { schema } from "./graphql/schema.js";

// ===== Types =====
export * from "./types/express.js";
