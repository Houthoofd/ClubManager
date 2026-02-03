/**
 * Module Paiements - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (Stripe, PaymentIntent, Confirmation)
 * - validators: Schémas Zod pour validation des données
 *
 * @module paiements
 * @version 2.0.0
 */

import paiementsRouter from './paiements.routes.js';

// Exporter le router principal
export default paiementsRouter;

// Exporter les handlers pour utilisation dans les tests
export * from './core/handlers/index.js';

// Exporter les services pour réutilisation
export * from './core/services/index.js';

// Exporter les validators pour réutilisation
export * from './core/validators/index.js';
