/**
 * Communications Domain Types
 *
 * TypeScript types for communications domain including database entities,
 * API operations, and business logic types.
 */

// ============================================================================
// API OPERATION TYPES
// ============================================================================

/**
 * Options de filtrage pour communications
 */
export interface CommunicationsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isRead?: boolean;
  messageType?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Résultat paginé pour communications
 */
export interface CommunicationsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface CommunicationsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

export interface Messages {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject?: string;
  content: string;
  is_read?: boolean;
  read_at?: string;
  /** Pour les fils de discussion */
  parent_id?: number;
  sent_at?: string;
}

export interface MessagesInsert {
  sender_id: number;
  recipient_id: number;
  subject?: string;
  content: string;
  is_read?: boolean;
  read_at?: string;
  /** Pour les fils de discussion */
  parent_id?: number;
  sent_at?: string;
}

export interface MessagesUpdate {
  sender_id?: number;
  recipient_id?: number;
  subject?: string;
  content?: string;
  is_read?: boolean;
  read_at?: string;
  /** Pour les fils de discussion */
  parent_id?: number;
  sent_at?: string;
}

export interface Announcements {
  id: number;
  author_id: number;
  title: string;
  content: string;
  priority?: "low" | "normal" | "high" | "urgent";
  target_audience?: "all" | "members" | "instructors" | "admins";
  published_at?: string;
  expires_at?: string;
  active?: boolean;
  created_at?: string;
}

export interface AnnouncementsInsert {
  author_id: number;
  title: string;
  content: string;
  priority?: "low" | "normal" | "high" | "urgent";
  target_audience?: "all" | "members" | "instructors" | "admins";
  published_at?: string;
  expires_at?: string;
  active?: boolean;
}

export interface AnnouncementsUpdate {
  author_id?: number;
  title?: string;
  content?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  target_audience?: "all" | "members" | "instructors" | "admins";
  published_at?: string;
  expires_at?: string;
  active?: boolean;
  created_at?: string;
}

export interface Notifications {
  id: number;
  user_id: number;
  /** Type de notification (message, payment, session, etc.) */
  type: string;
  title: string;
  content: string;
  /** URL vers l'action concernée */
  action_url?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
}

export interface NotificationsInsert {
  user_id: number;
  /** Type de notification (message, payment, session, etc.) */
  type: string;
  title: string;
  content: string;
  /** URL vers l'action concernée */
  action_url?: string;
  is_read?: boolean;
  read_at?: string;
}

export interface NotificationsUpdate {
  user_id?: number;
  /** Type de notification (message, payment, session, etc.) */
  type?: string;
  title?: string;
  content?: string;
  /** URL vers l'action concernée */
  action_url?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
}

export interface EmailLogs {
  id: number;
  user_id?: number;
  recipient_email: string;
  recipient_name?: string;
  email_type:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  subject: string;
  body: string;
  status?: "pending" | "sent" | "failed" | "bounced";
  sent_at?: string;
  failed_reason?: string;
  /** Nom du template utilisé */
  template_used?: string;
  /** Données additionnelles (variables template, tracking, etc.) */
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface EmailLogsInsert {
  user_id?: number;
  recipient_email: string;
  recipient_name?: string;
  email_type:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  subject: string;
  body: string;
  status?: "pending" | "sent" | "failed" | "bounced";
  sent_at?: string;
  failed_reason?: string;
  /** Nom du template utilisé */
  template_used?: string;
  /** Données additionnelles (variables template, tracking, etc.) */
  metadata?: Record<string, any>;
}

export interface EmailLogsUpdate {
  user_id?: number;
  recipient_email?: string;
  recipient_name?: string;
  email_type?:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  subject?: string;
  body?: string;
  status?: "pending" | "sent" | "failed" | "bounced";
  sent_at?: string;
  failed_reason?: string;
  /** Nom du template utilisé */
  template_used?: string;
  /** Données additionnelles (variables template, tracking, etc.) */
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface EmailTemplates {
  id: number;
  /** Nom du template */
  name: string;
  /** Identifiant unique (ex: welcome-email) */
  slug: string;
  description?: string;
  email_type:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  /** Sujet du mail (peut contenir des variables {{name}}) */
  subject: string;
  /** Corps HTML du mail avec variables {{variable}} */
  body_html: string;
  /** Version texte brut (fallback) */
  body_text?: string;
  /** Liste des variables disponibles: [ */
  variables?: Record<string, any>;
  active?: boolean;
  /** Template par défaut pour ce type d'email */
  is_default?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTemplatesInsert {
  /** Nom du template */
  name: string;
  /** Identifiant unique (ex: welcome-email) */
  slug: string;
  description?: string;
  email_type:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  /** Sujet du mail (peut contenir des variables {{name}}) */
  subject: string;
  /** Corps HTML du mail avec variables {{variable}} */
  body_html: string;
  /** Version texte brut (fallback) */
  body_text?: string;
  /** Liste des variables disponibles: [ */
  variables?: Record<string, any>;
  active?: boolean;
  /** Template par défaut pour ce type d'email */
  is_default?: boolean;
  created_by?: number;
}

export interface EmailTemplatesUpdate {
  /** Nom du template */
  name?: string;
  /** Identifiant unique (ex: welcome-email) */
  slug?: string;
  description?: string;
  email_type?:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice"
    | "receipt"
    | "event_confirmation"
    | "session_reminder"
    | "newsletter"
    | "announcement"
    | "other";
  /** Sujet du mail (peut contenir des variables {{name}}) */
  subject?: string;
  /** Corps HTML du mail avec variables {{variable}} */
  body_html?: string;
  /** Version texte brut (fallback) */
  body_text?: string;
  /** Liste des variables disponibles: [ */
  variables?: Record<string, any>;
  active?: boolean;
  /** Template par défaut pour ce type d'email */
  is_default?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Alerts {
  id: number;
  user_id: number;
  alert_type:
    | "membership_expiring"
    | "payment_due"
    | "payment_overdue"
    | "session_cancelled"
    | "profile_incomplete"
    | "document_expiring"
    | "birthday"
    | "achievement"
    | "account_security"
    | "system";
  severity?: "info" | "warning" | "critical";
  title: string;
  message: string;
  /** Nécessite une action de l'utilisateur */
  action_required?: boolean;
  /** Lien vers l'action à effectuer */
  action_url?: string;
  /** Type d'entité liée (membership, payment, session, etc.) */
  reference_type?: string;
  /** ID de l'entité liée */
  reference_id?: number;
  is_read?: boolean;
  read_at?: string;
  is_dismissed?: boolean;
  dismissed_at?: string;
  /** Date d'expiration de l'alerte */
  expires_at?: string;
  /** Email d'alerte envoyé */
  email_sent?: boolean;
  created_at?: string;
}

export interface AlertsInsert {
  user_id: number;
  alert_type:
    | "membership_expiring"
    | "payment_due"
    | "payment_overdue"
    | "session_cancelled"
    | "profile_incomplete"
    | "document_expiring"
    | "birthday"
    | "achievement"
    | "account_security"
    | "system";
  severity?: "info" | "warning" | "critical";
  title: string;
  message: string;
  /** Nécessite une action de l'utilisateur */
  action_required?: boolean;
  /** Lien vers l'action à effectuer */
  action_url?: string;
  /** Type d'entité liée (membership, payment, session, etc.) */
  reference_type?: string;
  /** ID de l'entité liée */
  reference_id?: number;
  is_read?: boolean;
  read_at?: string;
  is_dismissed?: boolean;
  dismissed_at?: string;
  /** Date d'expiration de l'alerte */
  expires_at?: string;
  /** Email d'alerte envoyé */
  email_sent?: boolean;
}

export interface AlertsUpdate {
  user_id?: number;
  alert_type?:
    | "membership_expiring"
    | "payment_due"
    | "payment_overdue"
    | "session_cancelled"
    | "profile_incomplete"
    | "document_expiring"
    | "birthday"
    | "achievement"
    | "account_security"
    | "system";
  severity?: "info" | "warning" | "critical";
  title?: string;
  message?: string;
  /** Nécessite une action de l'utilisateur */
  action_required?: boolean;
  /** Lien vers l'action à effectuer */
  action_url?: string;
  /** Type d'entité liée (membership, payment, session, etc.) */
  reference_type?: string;
  /** ID de l'entité liée */
  reference_id?: number;
  is_read?: boolean;
  read_at?: string;
  is_dismissed?: boolean;
  dismissed_at?: string;
  /** Date d'expiration de l'alerte */
  expires_at?: string;
  /** Email d'alerte envoyé */
  email_sent?: boolean;
  created_at?: string;
}

// ============================================================================
// FRONT-END MESSAGES TYPES
// ============================================================================

/**
 * Message Type
 * Représente un type/template de message prédéfini
 */
export interface MessageType {
  id: number;
  type_name: string;
  title?: string;
  description?: string;
  content?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Message avec état de lecture (pour l'UI)
 */
export interface MessageWithStatus {
  id: number;
  title: string;
  content: string;
  sender: string;
  date_envoi: string;
  lu: boolean;
  date_lecture?: string;
  type?: string;
  message_id?: number;
  recipient_id?: number;
}

/**
 * Suggested Message
 * Message suggéré basé sur le profil utilisateur
 */
export interface SuggestedMessage {
  typeId: number;
  raison: string;
}

/**
 * Input pour créer un type de message
 */
export interface CreateMessageTypeInput {
  type_name: string;
  description?: string;
  active?: boolean;
}

/**
 * Input pour mettre à jour un type de message
 */
export interface UpdateMessageTypeInput {
  type_name?: string;
  description?: string;
  active?: boolean;
}

/**
 * Input pour envoyer un message
 */
export interface SendMessageInput {
  sender_id: number;
  type_message_id?: number;
  subject?: string;
  content: string;
  recipient_ids: number[];
}

/**
 * Compteur de messages non lus
 */
export interface UnreadMessagesCount {
  count: number;
}

/**
 * Props pour les composants de tab
 */
export interface MessagesTabProps {
  messagesRecus: MessageWithStatus[];
  onMessageClick: (message: MessageWithStatus) => void;
  onMarkAsRead: (messageId: number) => void;
  onDeleteMessage: (messageId: number) => void;
  onShowDeleteModal: (message: MessageWithStatus) => void;
}

export interface MessageTypesTabProps {
  typesMessages: MessageType[];
  editingId: number | null;
  editFormData: { title: string; content: string };
  onEditStart: (id: number, title: string, content: string) => void;
  onEditCancel: () => void;
  onEditSave: (id: number) => void;
  onDelete: (id: number) => void;
  onFormDataChange: (field: string, value: string) => void;
}

/**
 * Props pour le formulaire d'envoi de message
 */
export interface SendMessageFormProps {
  utilisateurs: any[];
  typesMessages: MessageType[];
  selectedUsers: number[];
  selectedType: string;
  isLoading: boolean;
  onUserSelect: (userId: number) => void;
  onUserRemove: (userId: number) => void;
  onTypeSelect: (typeId: string) => void;
  onSendMessage: () => void;
}

/**
 * État de la page messages
 */
export interface MessagesPageState {
  activeTabKey: string;
  selectedMessage: MessageWithStatus | null;
  isDetailModalOpen: boolean;
  isDeleteModalOpen: boolean;
  messageToDelete: MessageWithStatus | null;
  editingMessageTypeId: number | null;
  editFormData: {
    title: string;
    content: string;
  };
}
