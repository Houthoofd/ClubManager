/**
 * Services - Point d'entrée des services de logique métier
 *
 * Ce module exporte tous les services pour la gestion des messages,
 * types de messages et emails.
 *
 * @module services
 */

// Service pour les types de messages
export * from './types-messages.service.js';

// Service pour les messages personnalisés
export * from './messages-personnalises.service.js';

// Service pour les emails
export * from './email.service.js';
