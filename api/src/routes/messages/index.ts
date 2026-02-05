/**
 * Module Messages - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (types de messages, messages personnalisés, emails)
 * - validators: Schémas Zod pour validation des données
 *
 * @module messages
 * @version 2.0.0
 */

import messagesRouter from './messages.routes.js';

// Exporter le router principal
export default messagesRouter;

// Exporter les handlers pour utilisation dans les tests
export * from './core/handlers/index.js';

// Exporter les services pour réutilisation
export * from './core/services/index.js';

// Exporter les validators pour réutilisation
export * from './core/validators/index.js';
