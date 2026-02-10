/**
 * Module Échéances - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (CRUD échéances, statistiques, diagnostics)
 * - validators: Schémas Zod pour validation des données
 *
 * @module echeances
 * @version 2.0.0
 */

import echeancesRouter from "./echeances.routes.js";

// Exporter le router principal
export default echeancesRouter;

// Exporter les handlers pour utilisation dans les tests
export * from "./core/handlers/index.js";

// Exporter les services pour réutilisation
export * from "./core/services/index.js";

// Exporter les validators pour réutilisation
export * from "@clubmanager/types/validators";
