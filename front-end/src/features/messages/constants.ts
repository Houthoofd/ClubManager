// ============================================================================
// Messages Feature Constants
// ============================================================================

/**
 * Tab keys pour la navigation dans la page messages
 */
export const MESSAGE_TABS = {
  RECEIVED: 'received',
  READ: 'read',
  SENT: 'sent',
  TYPES: 'types',
  SEND: 'send',
} as const;

/**
 * Labels des tabs
 */
export const MESSAGE_TAB_LABELS = {
  [MESSAGE_TABS.RECEIVED]: 'Messages non lus',
  [MESSAGE_TABS.READ]: 'Messages lus',
  [MESSAGE_TABS.SENT]: 'Messages envoyés',
  [MESSAGE_TABS.TYPES]: 'Types de messages',
  [MESSAGE_TABS.SEND]: 'Envoyer un message',
} as const;

/**
 * Intervalles de polling pour les queries
 */
export const POLLING_INTERVALS = {
  MESSAGES: 30000, // 30 secondes
  UNREAD_COUNT: 60000, // 1 minute
  MESSAGE_TYPES: 0, // Pas de polling
} as const;

/**
 * Messages de validation
 */
export const VALIDATION_MESSAGES = {
  NO_RECIPIENTS: 'Veuillez sélectionner au moins un destinataire',
  NO_MESSAGE_TYPE: 'Veuillez sélectionner un type de message',
  NO_SUBJECT: 'Veuillez entrer un objet',
  NO_CONTENT: 'Veuillez entrer un contenu',
  MESSAGE_TYPE_NAME_REQUIRED: 'Le nom du type de message est requis',
  MESSAGE_TYPE_CONTENT_REQUIRED: 'Le contenu du type de message est requis',
} as const;

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message envoyé avec succès',
  MESSAGE_MARKED_READ: 'Message marqué comme lu',
  MESSAGE_DELETED: 'Message supprimé avec succès',
  MESSAGE_RESTORED: 'Message restauré avec succès',
  MESSAGE_TYPE_CREATED: 'Type de message créé avec succès',
  MESSAGE_TYPE_UPDATED: 'Type de message mis à jour avec succès',
  MESSAGE_TYPE_DELETED: 'Type de message supprimé avec succès',
} as const;

/**
 * Messages d'erreur
 */
export const ERROR_MESSAGES = {
  MESSAGE_SEND_FAILED: 'Erreur lors de l\'envoi du message',
  MESSAGE_MARK_READ_FAILED: 'Erreur lors du marquage comme lu',
  MESSAGE_DELETE_FAILED: 'Erreur lors de la suppression du message',
  MESSAGE_RESTORE_FAILED: 'Erreur lors de la restauration du message',
  MESSAGE_TYPE_CREATE_FAILED: 'Erreur lors de la création du type de message',
  MESSAGE_TYPE_UPDATE_FAILED: 'Erreur lors de la mise à jour du type de message',
  MESSAGE_TYPE_DELETE_FAILED: 'Erreur lors de la suppression du type de message',
  LOAD_MESSAGES_FAILED: 'Erreur lors du chargement des messages',
  LOAD_MESSAGE_TYPES_FAILED: 'Erreur lors du chargement des types de messages',
} as const;

/**
 * Status des messages
 */
export const MESSAGE_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  DELETED: 'deleted',
} as const;

/**
 * Couleurs pour les statuts de messages
 */
export const MESSAGE_STATUS_COLORS = {
  [MESSAGE_STATUS.UNREAD]: {
    background: '#e3f2fd',
    border: '#007bff',
    badge: '#dc3545',
  },
  [MESSAGE_STATUS.READ]: {
    background: '#e8f5e8',
    border: '#28a745',
    badge: '#28a745',
  },
  [MESSAGE_STATUS.DELETED]: {
    background: '#f8f9fa',
    border: '#6c757d',
    badge: '#6c757d',
  },
} as const;

/**
 * Icônes pour les statuts de messages
 */
export const MESSAGE_STATUS_ICONS = {
  [MESSAGE_STATUS.UNREAD]: '●',
  [MESSAGE_STATUS.READ]: '✓',
  [MESSAGE_STATUS.DELETED]: '🗑️',
} as const;

/**
 * Taille maximale du preview de contenu dans les cartes de messages
 */
export const MESSAGE_PREVIEW_LENGTH = 100;

/**
 * Taille maximale du sujet du message
 */
export const MESSAGE_SUBJECT_MAX_LENGTH = 200;

/**
 * Taille maximale du contenu du message
 */
export const MESSAGE_CONTENT_MAX_LENGTH = 5000;

/**
 * Configurations des alertes de messages suggérés
 */
export const SUGGESTED_MESSAGE_REASONS = {
  PAYMENT_OVERDUE: 'Paiement en retard',
  MEMBERSHIP_EXPIRING: 'Adhésion expire bientôt',
  INCOMPLETE_PROFILE: 'Profil incomplet',
  NO_RECENT_ACTIVITY: 'Aucune activité récente',
  COURSE_ENROLLMENT_PENDING: 'Inscription en attente',
} as const;

/**
 * Types de notifications d'envoi
 */
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  INTERNAL: 'internal',
  BOTH: 'both',
} as const;

/**
 * Labels pour les types de notification
 */
export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.EMAIL]: 'Email uniquement',
  [NOTIFICATION_TYPES.INTERNAL]: 'Messagerie interne uniquement',
  [NOTIFICATION_TYPES.BOTH]: 'Email et messagerie interne',
} as const;

/**
 * Variantes PatternFly pour les messages
 */
export const MESSAGE_VARIANTS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

/**
 * Classes CSS pour les messages
 */
export const MESSAGE_CLASSES = {
  CARD: 'messages-card',
  LIST: 'messages-list',
  ITEM: 'message-item',
  HEADER: 'messages-header',
  CONTENT: 'messages-content',
  FOOTER: 'messages-footer',
  BADGE: 'message-badge',
  STATUS_INDICATOR: 'message-status-indicator',
} as const;
