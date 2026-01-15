/**
 * Point d'entrée principal du module Messagerie
 * Exporte tous les éléments nécessaires pour utiliser le module
 */

// Repository
export {
  MessagerieRepository,
  getMessagerieRepository,
  messagerieRepository,
} from "./messagerie.repository.js";

// Types
export * from "./types.js";

// Queries (pour usage avancé)
export * as MessagerieQueries from "./queries/index.js";

// Clients existants (pour compatibilité)
export { EmailClient } from "./emailClient.js";
export { MessageClient } from "./messageClient.js";
export { MessagerieClient, getMessagerieClient, messagerieClient } from "./messagerieClient.js";

/**
 * USAGE RECOMMANDÉ:
 *
 * 1. Import du repository (pattern singleton):
 *    import { getMessagerieRepository } from './db/clients/messagerie/index.js';
 *    const messagerieRepo = getMessagerieRepository();
 *
 * 2. Import des types:
 *    import type { TypeMessage, MessagePersonnalise, EmailTemplate } from './db/clients/messagerie/index.js';
 *
 * EXEMPLES D'UTILISATION:
 *
 * // Récupérer tous les types de messages
 * const typesMessages = await messagerieRepo.getAllTypesMessages();
 *
 * // Créer un type de message
 * const typeId = await messagerieRepo.createTypeMessage('Bienvenue', 'Bienvenue sur notre plateforme!');
 *
 * // Envoyer un message personnalisé
 * await messagerieRepo.envoyerMessagePersonnalise(userId, 'Votre message ici');
 *
 * // Récupérer les messages d'un utilisateur
 * const messages = await messagerieRepo.getMessagesRecus('user123');
 *
 * // Obtenir les statistiques
 * const stats = await messagerieRepo.getStatistiquesMessages();
 *
 * // Gérer les templates d'email
 * const templates = await messagerieRepo.getAllEmailTemplates();
 * const template = await messagerieRepo.getEmailTemplateByTitle('Bienvenue');
 */
