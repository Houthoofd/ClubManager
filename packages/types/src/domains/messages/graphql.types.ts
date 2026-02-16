/**
 * Types GraphQL pour Messages (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module messages/graphql.types
 */

/**
 * Type représentant un message personnalisé (GraphQL)
 */
export interface Message {
  id: number;
  expediteurId?: number;
  destinataireId: number;
  typeMessageId: number;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
  dateLecture?: string;
  supprime: boolean;
  dateSuppression?: string;
  actif: boolean;
}

/**
 * Type représentant un type de message (GraphQL)
 */
export interface TypeMessage {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Résultat de l'envoi d'un message avec détails (GraphQL)
 */
export interface EnvoiMessageResult {
  success: boolean;
  message: string;
  data?: EnvoiMessageData;
}

/**
 * Données détaillées de l'envoi d'un message (GraphQL)
 */
export interface EnvoiMessageData {
  messagesInternes: number;
  emailsEnvoyes: number;
  typeMessage?: TypeMessage;
  details: EnvoiMessageDetails;
}

/**
 * Détails de l'envoi avec statistiques emails (GraphQL)
 */
export interface EnvoiMessageDetails {
  totalDestinataires: number;
  emailsEnvoyes: number;
  emailsEchecs: number;
  emailsDetails: EmailDetail[];
}

/**
 * Détail de l'envoi d'un email individuel (GraphQL)
 */
export interface EmailDetail {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Statistiques des messages (GraphQL)
 */
export interface MessageStatistiques {
  totalMessages: number;
  messagesNonLus: number;
  messagesEnvoyes: number;
  messagesRecus: number;
}

/**
 * Input pour envoyer un message (GraphQL)
 */
export interface EnvoyerMessageInput {
  destinataireIds: number[];
  typeMessageId: number;
  contenu: string;
  expediteurId?: number;
  envoyerEmail?: boolean;
}

/**
 * Input pour marquer un message comme lu (GraphQL)
 */
export interface MarquerLuInput {
  messageId: number;
}

/**
 * Input pour supprimer un message (GraphQL)
 */
export interface SupprimerMessageInput {
  messageId: number;
}

/**
 * Input pour récupérer les messages d'un utilisateur (GraphQL)
 */
export interface MessagesUtilisateurInput {
  utilisateurId: number;
  nonLusSeulement?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Résultat d'une opération sur message (GraphQL)
 */
export interface MessageOperationResult {
  success: boolean;
  message: string;
  data?: Message;
}

/**
 * Liste paginée de messages (GraphQL)
 */
export interface MessagesList {
  messages: Message[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

/**
 * Contexte GraphQL pour Messages
 */
export interface MessagesContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
