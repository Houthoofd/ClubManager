/**
 * Point d'entrée du module Inscription
 * Réexporte le router depuis la nouvelle architecture modulaire
 *
 * Cette architecture suit le pattern du module Informations:
 * - Routes: Définition des endpoints
 * - Handlers: Contrôleurs HTTP
 * - Services: Logique métier
 * - Validators: Schémas Zod
 */

export { default } from './inscription/inscription.routes.js';
