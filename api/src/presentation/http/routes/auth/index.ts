/**
 * Barrel export pour les Routes Auth
 *
 * Ce fichier centralise les exports des Routes Auth pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement, on peut importer depuis ce fichier.
 *
 * @example
 * import { createAuthRoutes, createAccountRoutes } from '@/presentation/http/routes/auth';
 */

// ============== AUTH ROUTES ==============
export { createAuthRoutes } from "./auth.routes.js";
export { default as authRoutesDefault } from "./auth.routes.js";

// ============== ACCOUNT ROUTES ==============
export { createAccountRoutes } from "./account.routes.js";
export { default as accountRoutesDefault } from "./account.routes.js";
