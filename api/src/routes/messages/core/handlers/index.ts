/**
 * Handlers - Point d'entrée des handlers HTTP
 *
 * Ce module exporte tous les handlers pour la gestion des messages,
 * types de messages et emails.
 *
 * @module handlers
 */

// Handlers pour les types de messages
export * from './types-messages.handlers.js';

// Handlers pour les messages personnalisés
export * from './messages-personnalises.handlers.js';

// Handlers pour les emails
export * from './email.handlers.js';
