/**
 * Module Professeurs - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (CRUD professeurs, planning, promotions)
 * - validators: Schémas Zod pour validation des données
 *
 * @module professeurs
 * @version 2.0.0
 */

import professeursRouter from './professeurs.routes.js';

// Exporter le router principal
export default professeursRouter;

// Exporter les handlers pour utilisation dans les tests
export * from './core/handlers/index.js';

// Exporter les services pour réutilisation
export * from './core/services/index.js';

// Exporter les validators pour réutilisation
export * from './core/validators/index.js';
