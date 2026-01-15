/**
 * Types pour le module Messages
 */

// ============================================================================
// TYPES TYPESCRIPT - ENTITÉS
// ============================================================================

/**
 * Type de message personnalisé
 */
export interface TypeMessagePersonnalise {
  id: number;
  nom_type: string;
  description?: string | null;
  actif: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Message personnalisé
 */
export interface MessagePersonnalise {
  id: number;
  titre: string;
  contenu: string;
  type_id: number;
  expediteur_id: number;
  destinataire_id: number;
  lu: boolean;
  supprime: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Message personnalisé avec détails des relations
 */
export interface MessagePersonnaliseAvecDetails {
  id: number;
  titre: string;
  contenu: string;
  type_nom: string;
  expediteur_nom: string;
  expediteur_prenom: string;
  destinataire_nom: string;
  destinataire_prenom: string;
  lu: boolean;
  supprime: boolean;
  created_at?: Date | string;
}

/**
 * Historique des messages (emails)
 */
export interface HistoriqueMessage {
  id: number;
  utilisateur_id: number;
  type_message: string;
  contenu: string;
  status_envoi: "pending" | "sent" | "failed";
  email_recipient: string;
  message_id?: string | null;
  error_message?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Template d'email
 */
export interface EmailTemplate {
  id: number;
  nom_template: string;
  sujet: string;
  contenu_html: string;
  contenu_texte?: string | null;
  variables_disponibles?: string | null;
  actif: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Row de la table types_messages_personnalises
 */
export interface TypeMessagePersonnaliseRow {
  id: number;
  nom_type: string;
  description: string | null;
  actif: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row de la table messages_personnalises
 */
export interface MessagePersonnaliseRow {
  id: number;
  titre: string;
  contenu: string;
  type_id: number;
  expediteur_id: number;
  destinataire_id: number;
  lu: number;
  supprime: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row avec jointures pour les messages personnalisés
 */
export interface MessagePersonnaliseAvecDetailsRow {
  id: number;
  titre: string;
  contenu: string;
  type_nom: string;
  expediteur_nom: string;
  expediteur_prenom: string;
  destinataire_nom: string;
  destinataire_prenom: string;
  lu: number;
  supprime: number;
  created_at: Date;
}

/**
 * Row de la table historique_messages
 */
export interface HistoriqueMessageRow {
  id: number;
  utilisateur_id: number;
  type_message: string;
  contenu: string;
  status_envoi: string;
  email_recipient: string;
  message_id: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row de la table email_templates
 */
export interface EmailTemplateRow {
  id: number;
  nom_template: string;
  sujet: string;
  contenu_html: string;
  contenu_texte: string | null;
  variables_disponibles: string | null;
  actif: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// DTOs (DATA TRANSFER OBJECTS)
// ============================================================================

/**
 * Données pour créer un type de message
 */
export interface CreateTypeMessageData {
  nom_type: string;
  description?: string;
  actif?: boolean;
}

/**
 * Données pour modifier un type de message
 */
export interface UpdateTypeMessageData {
  nom_type?: string;
  description?: string;
  actif?: boolean;
}

/**
 * Données pour envoyer un message personnalisé
 */
export interface SendMessagePersonnaliseData {
  titre: string;
  contenu: string;
  type_id: number;
  expediteur_id: number;
  destinataire_id: number;
}

/**
 * Données pour envoyer un message avec emails
 */
export interface SendMessageAvecEmailsData {
  titre: string;
  contenu: string;
  type_id: number;
  expediteur_id: number;
  destinataires_ids: number[];
  envoyer_email?: boolean;
}

/**
 * Données pour l'email de bienvenue
 */
export interface WelcomeEmailData {
  userId: number;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
}

/**
 * Données pour l'email de validation
 */
export interface ValidationEmailData {
  userId: number;
  email: string;
  prenom: string;
  confirmationToken: string;
}

/**
 * Données pour l'email de récupération
 */
export interface RecoveryEmailData {
  userId: number;
  email: string;
  prenom: string;
}

/**
 * Données pour l'email de rappel de paiement
 */
export interface RappelPaiementEmailData {
  receiverId?: number;
  echeanceIds: number[];
  montant?: number;
  dateEcheance?: string;
}

/**
 * Données pour sauvegarder un message en base
 */
export interface SaveMessageData {
  utilisateur_id: number;
  type_message: string;
  contenu: string;
  status_envoi: "pending" | "sent" | "failed";
  email_recipient: string;
  message_id?: string;
  error_message?: string;
}

/**
 * Données pour mettre à jour le statut d'un message
 */
export interface UpdateMessageStatusData {
  messageId: number;
  status: "pending" | "sent" | "failed";
  emailMessageId?: string;
  errorMessage?: string;
}

// ============================================================================
// RÉSULTATS
// ============================================================================

/**
 * Résultat d'envoi d'email
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Résultat d'envoi de message
 */
export interface SendMessageResult {
  isConfirm: boolean;
  message: string;
  messageId?: number;
}

/**
 * Résultat de recherche de messages
 */
export interface MessageSearchResult {
  isFind: boolean;
  message: string;
  data: MessagePersonnalise[] | MessagePersonnaliseAvecDetails[] | any;
}

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}

/**
 * Résultat d'envoi avec emails
 */
export interface SendMessageAvecEmailsResult {
  messagesInternes: {
    isConfirm: boolean;
    message: string;
  };
  emailsEnvoyes: {
    total: number;
    reussis: number;
    echecs: number;
    details: EmailSendDetail[];
  };
}

/**
 * Détail d'envoi d'email
 */
export interface EmailSendDetail {
  id: number;
  email: string;
  nom: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Statistiques des messages
 */
export interface MessageStatistiques {
  total: number;
  envoyes: number;
  lus: number;
  non_lus: number;
  supprimes: number;
  par_type?: {
    [key: string]: number;
  };
}

/**
 * Statistiques de suppression
 */
export interface StatistiquesSuppressions {
  total_supprimes: number;
  derniere_suppression?: Date | string;
  par_utilisateur?: {
    [key: number]: number;
  };
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Status d'envoi d'un message
 */
export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
}

/**
 * Types de messages prédéfinis
 */
export enum TypeMessage {
  BIENVENUE = "bienvenue",
  VALIDATION = "validation",
  RECUPERATION = "recuperation",
  RAPPEL_PAIEMENT = "rappel_paiement",
  NOTIFICATION = "notification",
  ALERTE = "alerte",
  INFORMATION = "information",
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un message personnalisé est valide
 */
export function isValidMessagePersonnalise(
  msg: any,
): msg is MessagePersonnalise {
  return (
    msg &&
    typeof msg.id === "number" &&
    typeof msg.titre === "string" &&
    typeof msg.contenu === "string" &&
    typeof msg.type_id === "number" &&
    typeof msg.expediteur_id === "number" &&
    typeof msg.destinataire_id === "number"
  );
}

/**
 * Vérifie si un type de message est valide
 */
export function isValidTypeMessage(type: any): type is TypeMessagePersonnalise {
  return (
    type &&
    typeof type.id === "number" &&
    typeof type.nom_type === "string" &&
    typeof type.actif === "boolean"
  );
}

/**
 * Vérifie si un status de message est valide
 */
export function isValidMessageStatus(status: any): status is MessageStatus {
  return Object.values(MessageStatus).includes(status);
}

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie si un contenu de message est valide
 */
export function isValidMessageContent(content: string): boolean {
  return Boolean(
    content && content.trim().length > 0 && content.length <= 10000,
  );
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Champs pouvant être mis à jour pour un message personnalisé
 */
export type UpdatableMessageFields = "lu" | "supprime";

/**
 * Options de recherche de messages
 */
export interface MessageSearchOptions {
  includeDeleted?: boolean;
  includeRead?: boolean;
  typeId?: number;
  dateDebut?: Date | string;
  dateFin?: Date | string;
  limit?: number;
  offset?: number;
}

/**
 * Options de filtrage de l'historique
 */
export interface HistoriqueFilterOptions {
  utilisateurId?: number;
  typeMessage?: string;
  status?: MessageStatus;
  dateDebut?: Date | string;
  dateFin?: Date | string;
  limit?: number;
  offset?: number;
}

/**
 * Variables pour template d'email
 */
export interface EmailTemplateVariables {
  [key: string]: string | number | boolean | Date;
}

/**
 * Configuration d'envoi d'email
 */
export interface EmailSendConfig {
  to: string;
  subject?: string;
  templateName?: string;
  variables?: EmailTemplateVariables;
  html?: string;
  text?: string;
  utilisateurId?: number;
  fallbackSubject?: string;
}
