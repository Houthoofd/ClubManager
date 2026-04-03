/**
 * Barrel export pour toutes les Routes
 *
 * Ce fichier centralise les exports des Routes pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement, on peut importer depuis ce fichier.
 *
 * @example
 * import { createCoursRoutes, createUserRoutes } from '@/presentation/http/routes';
 */

// ============== USER ROUTES ==============
export { createUserRoutes } from "./users.routes.js";
export { default as userRoutesDefault } from "./users.routes.js";

// ============== COURS ROUTES ==============
export { createCoursRoutes } from "./cours.routes.js";
export { default as coursRoutesDefault } from "./cours.routes.js";

// ============== COURS RECURRENTS ROUTES ==============
export { createCoursRecurrentsRoutes } from "./cours-recurrents.routes.js";
export { default as coursRecurrentsRoutesDefault } from "./cours-recurrents.routes.js";

// ============== AUTH ROUTES ==============
export { createAuthRoutes } from "./auth/auth.routes.js";
export { default as authRoutesDefault } from "./auth/auth.routes.js";

// ============== ACCOUNT ROUTES ==============
export { createAccountRoutes } from "./auth/account.routes.js";
export { default as accountRoutesDefault } from "./auth/account.routes.js";
