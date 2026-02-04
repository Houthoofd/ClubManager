/**
 * Module Magasin - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (CRUD articles, commandes, statistiques)
 * - validators: Schémas Zod pour validation des données
 *
 * @module magasin
 * @version 1.0.0
 */

import magasinRouter from './magasin.routes.js';

// Exporter le router principal
export default magasinRouter;

// Exporter les handlers pour utilisation dans les tests
export * from './core/handlers/index.js';

// Exporter les services pour réutilisation
export * from './core/services/index.js';

// Exporter les validators pour réutilisation
export * from './core/validators/index.js';
