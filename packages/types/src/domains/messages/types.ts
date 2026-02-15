/**
 * Types TypeScript pour le module Messages
 * Centralisation des types pour la gestion des messages personnalisés
 *
 * @package @clubmanager/types
 */

/**
 * Type représentant un message personnalisé
 */
export interface Message {
  id: number;
  expediteur_id: number | null;
  destinataire_id: number;
  type_message_id: number;
  contenu: string;
  date_envoi: string;
  lu: boolean;
  date_lecture: string | null;
  supprime: boolean;
  date_suppression: string | null;
  actif: boolean;
}

/**
 * Type représentant un type de message (template)
 */
export interface TypeMessage {
  id: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Détail de l'envoi d'un email individuel
 */
export interface EmailDetail {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Détails de l'envoi avec statistiques emails
 */
export interface EnvoiMessageDetails {
  totalDestinataires: number;
  emailsEnvoyes: number;
  emailsEchecs: number;
  emailsDetails: EmailDetail[];
}

/**
 * Données détaillées de l'envoi d'un message
 */
export interface EnvoiMessageData {
  messagesInternes: number;
  emailsEnvoyes: number;
  typeMessage: TypeMessage | null;
  details: EnvoiMessageDetails;
}

/**
 * Résultat de l'envoi d'un message avec détails
 */
export interface EnvoiMessageResult {
  success: boolean;
  message: string;
  data?: EnvoiMessageData;
}

/**
 * Statistiques des messages
 */
export interface MessageStatistiques {
  totalMessages: number;
  messagesNonLus: number;
  messagesLus: number;
  messagesSupprimes: number;
  periode: string;
}

/**
 * Résultat du comptage des messages non lus
 */
export interface MessageNonLusCount {
  success: boolean;
  count: number;
  userId: number;
}

/**
 * Résultat d'une opération sur un message
 */
export interface MessageOperationResult {
  success: boolean;
  message: string;
}

/**
 * Données du rappel de paiement
 */
export interface RappelPaiementData {
  echeancesTraitees: number;
  emailsEnvoyes: number;
  erreurs: string[];
}

/**
 * Résultat de l'envoi de rappel de paiement
 */
export interface RappelPaiementResult {
  success: boolean;
  message: string;
  data?: RappelPaiementData;
}

/**
 * Options d'envoi d'email personnalisé
 */
export interface SendCustomEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string;
  bcc?: string;
  saveToDb?: boolean;
  utilisateurId?: number;
  type_message?: string;
}

/**
 * Options d'envoi d'email avec template
 */
export interface SendTemplateEmailOptions {
  templateTitle: string;
  to: string;
  variables?: Record<string, any>;
  saveToDb?: boolean;
  utilisateurId?: number;
}

/**
 * Options d'envoi d'email de bienvenue
 */
export interface SendWelcomeEmailOptions {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  utilisateurId?: number;
}

/**
 * Options d'envoi d'email de validation
 */
export interface SendValidationEmailOptions {
  email: string;
  firstName: string;
  userId: string;
  utilisateurId?: number;
}

/**
 * Historique des messages
 */
export interface MessageHistory {
  id: number;
  utilisateur_id: number;
  type_message: string;
  contenu: string;
  date_envoi: string;
  status: string;
}

/**
 * Statistiques d'emails
 */
export interface EmailStatistics {
  totalEmails: number;
  emailsReussis: number;
  emailsEchoues: number;
  derniersEmails: MessageHistory[];
}

/**
 * Response types pour les APIs
 */
export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  count?: number;
}

export interface TypesMessagesResponse {
  success: boolean;
  typesMessages: TypeMessage[];
  count?: number;
}

export interface TypeMessageResponse {
  success: boolean;
  typeMessage: TypeMessage;
}

export interface EmailOperationResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}
