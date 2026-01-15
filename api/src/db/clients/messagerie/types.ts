/**
 * Types pour le module Messagerie
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Type de message personnalisé
 */
export interface TypeMessage {
  id: number;
  title: string;
  content: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Message personnalisé
 */
export interface MessagePersonnalise {
  id: number;
  utilisateur_id: number;
  contenu: string;
  lu?: boolean;
  created_at: Date | string;
  updated_at?: Date | string;
}

/**
 * Message avec informations expéditeur
 */
export interface MessageAvecExpediteur {
  id: number;
  content: string;
  date_reception: Date | string;
  expediteur_prenom: string;
  expediteur_nom: string;
  title: string;
  lu: boolean;
}

/**
 * Historique d'un message envoyé
 */
export interface HistoriqueMessage {
  id: number;
  utilisateur_id: number | null;
  type_message: string;
  sujet: string;
  contenu: string;
  recipients: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  created_at: Date | string;
  sent_at: Date | string | null;
  user_email?: string;
  user_name?: string;
}

/**
 * Utilisateur pour la messagerie
 */
export interface UtilisateurMessagerie {
  id: number;
  userId: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string | null;
}

/**
 * Statistiques de la messagerie
 */
export interface StatistiquesMessagerie {
  totalTypesMessages: number;
  totalMessagesEnvoyes: number;
  messagesUtilisateur?: number;
  messagesParJour: MessageParJour[];
}

/**
 * Messages envoyés par jour
 */
export interface MessageParJour {
  date: string;
  count: number;
}

/**
 * Template d'email
 */
export interface EmailTemplate {
  id: number;
  title: string;
  subject: string;
  content_text: string;
  content_html: string;
  variables: string | null;
  category: string | null;
  active: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Variables pour personnalisation des templates
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

// ============================================================================
// TYPES DE DONNÉES POUR LES OPÉRATIONS
// ============================================================================

/**
 * Données pour créer un type de message
 */
export interface CreateTypeMessageData {
  title: string;
  content: string;
}

/**
 * Données pour mettre à jour un type de message
 */
export interface UpdateTypeMessageData {
  title?: string;
  content?: string;
}

/**
 * Données pour envoyer un message
 */
export interface EnvoyerMessageData {
  destinataires: number[];
  typeMessageId: number;
  expediteurId?: number;
}

/**
 * Données pour envoyer un message personnalisé
 */
export interface EnvoyerMessagePersonnaliseData {
  destinataireId: number;
  contenu: string;
  expediteurId?: number;
}

/**
 * Données pour envoyer un email
 */
export interface EnvoyerEmailData {
  to: string | string[];
  subject: string;
  message: string;
  isHtml?: boolean;
  cc?: string | string[];
  bcc?: string | string[];
  saveToDb?: boolean;
  utilisateurId?: number;
}

/**
 * Données pour envoyer un email avec template
 */
export interface EnvoyerEmailTemplateData {
  templateTitle: string;
  to: string | string[];
  variables: TemplateVariables;
  saveToDb?: boolean;
  utilisateurId?: number;
}

/**
 * Données pour créer un template d'email
 */
export interface CreateEmailTemplateData {
  title: string;
  subject: string;
  content_text: string;
  content_html: string;
  variables?: string;
  category?: string;
  active?: boolean;
}

/**
 * Données pour mettre à jour un template d'email
 */
export interface UpdateEmailTemplateData {
  title?: string;
  subject?: string;
  content_text?: string;
  content_html?: string;
  variables?: string;
  category?: string;
  active?: boolean;
}

/**
 * Données pour sauvegarder un message en base
 */
export interface SaveMessageData {
  utilisateur_id?: number;
  type_message: string;
  sujet: string;
  contenu: string;
  recipients: string;
  status?: 'pending' | 'sent' | 'failed';
  error_message?: string;
}

// ============================================================================
// TYPES DE RÉSULTAT
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
export interface MessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Résultat d'envoi groupé
 */
export interface EnvoyerGroupeResult {
  success: boolean;
  total: number;
  reussites: number;
  echecs: number;
  details?: any[];
  error?: string;
}

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Row type_message de la base de données
 */
export interface TypeMessageRow {
  id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row message_personnalise de la base de données
 */
export interface MessagePersonnaliseRow {
  id: number;
  utilisateur_id: number;
  contenu: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row historique_messages de la base de données
 */
export interface HistoriqueMessageRow {
  id: number;
  utilisateur_id: number | null;
  type_message: string;
  sujet: string;
  contenu: string;
  recipients: string;
  status: string;
  error_message: string | null;
  created_at: Date;
  sent_at: Date | null;
  user_email?: string;
  user_name?: string;
}

/**
 * Row email_template de la base de données
 */
export interface EmailTemplateRow {
  id: number;
  title: string;
  subject: string;
  content_text: string;
  content_html: string;
  variables: string | null;
  category: string | null;
  active: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row utilisateur de la base de données (pour messagerie)
 */
export interface UtilisateurRow {
  id: number;
  userId: string;
  full_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
  active: number;
}

// ============================================================================
// OPTIONS ET CONFIGURATIONS
// ============================================================================

/**
 * Options pour l'envoi d'email
 */
export interface EmailClientOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

/**
 * Options pour la notification de cours
 */
export interface NotificationCoursOptions {
  email: string;
  prenom: string;
  action: 'inscription' | 'annulation' | 'modification';
  typeCours: string;
  dateCours: string;
  heureCours: string;
  instructeur: string;
  utilisateurId?: number;
}

/**
 * Options pour le rappel de paiement
 */
export interface RappelPaiementOptions {
  email: string;
  prenom: string;
  montant: string;
  dateEcheance: string;
  utilisateurId?: number;
  niveau?: 1 | 2 | 3;
}

/**
 * Options pour la confirmation de paiement
 */
export interface ConfirmationPaiementOptions {
  email: string;
  prenom: string;
  montant: string;
  datePaiement: string;
  utilisateurId?: number;
}

/**
 * Options pour l'email de bienvenue
 */
export interface BienvenueOptions {
  email: string;
  prenom: string;
  userId: string;
  utilisateurId?: number;
}

/**
 * Options pour la validation d'email
 */
export interface ValidationEmailOptions {
  email: string;
  prenom: string;
  userId: string;
  validationToken?: string;
  utilisateurId?: number;
}

/**
 * Options pour la récupération de userId
 */
export interface RecuperationUserIdOptions {
  email: string;
  prenom: string;
  userId: string;
  utilisateurId?: number;
}

/**
 * Options pour le reset de mot de passe
 */
export interface ResetPasswordOptions {
  email: string;
  prenom: string;
  resetToken: string;
  expiryHours?: number;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Statuts possibles d'un message
 */
export enum StatutMessage {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * Types de messages
 */
export enum TypeMessageEnum {
  BIENVENUE = 'bienvenue',
  VALIDATION_EMAIL = 'validation_email',
  RESET_PASSWORD = 'reset_password',
  NOTIFICATION_COURS = 'notification_cours',
  RAPPEL_PAIEMENT = 'rappel_paiement',
  CONFIRMATION_PAIEMENT = 'confirmation_paiement',
  MESSAGE_PERSONNALISE = 'message_personnalise',
  GROUPE = 'groupe',
  TEST = 'test',
}

/**
 * Catégories de templates
 */
export enum CategorieTemplate {
  AUTHENTIFICATION = 'authentification',
  NOTIFICATION = 'notification',
  PAIEMENT = 'paiement',
  COURS = 'cours',
  ADMINISTRATIF = 'administratif',
  AUTRE = 'autre',
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un objet est un TypeMessage valide
 */
export function isValidTypeMessage(obj: any): obj is TypeMessage {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string'
  );
}

/**
 * Vérifie si un objet est un MessagePersonnalise valide
 */
export function isValidMessagePersonnalise(obj: any): obj is MessagePersonnalise {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.utilisateur_id === 'number' &&
    typeof obj.contenu === 'string'
  );
}

/**
 * Vérifie si un objet est un EmailTemplate valide
 */
export function isValidEmailTemplate(obj: any): obj is EmailTemplate {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.content_text === 'string' &&
    typeof obj.content_html === 'string'
  );
}

/**
 * Vérifie si une adresse email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie si un statut de message est valide
 */
export function isValidStatut(statut: string): statut is StatutMessage {
  return Object.values(StatutMessage).includes(statut as StatutMessage);
}
