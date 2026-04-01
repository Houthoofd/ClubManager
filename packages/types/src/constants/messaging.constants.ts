/**
 * @fileoverview Messaging Domain Constants
 * @module @clubmanager/types/constants/messaging
 *
 * Defines constants for the Messaging domain based on DB schema.
 * Covers messages, notifications, alerts, custom message templates, etc.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Tables: messages, message_status, types_messages_personnalises, messages_personnalises,
 *         notifications, alertes_types, alertes_utilisateurs, alertes_actions
 */

// ============================================================================
// MESSAGES - Direct messages between users
// ============================================================================

/**
 * Maximum length for message subject
 * DB: messages.sujet VARCHAR(255)
 */
export const MESSAGE_SUBJECT_MAX_LENGTH = 255;

/**
 * Minimum length for message subject (when provided)
 */
export const MESSAGE_SUBJECT_MIN_LENGTH = 1;

/**
 * Minimum length for message content
 * DB: messages.contenu TEXT NOT NULL
 */
export const MESSAGE_CONTENT_MIN_LENGTH = 1;

/**
 * Maximum length for message content
 * TEXT field typically supports up to 65,535 bytes
 */
export const MESSAGE_CONTENT_MAX_LENGTH = 65535;

// ============================================================================
// MESSAGE STATUS - Lookup table for message statuses
// ============================================================================

/**
 * Maximum length for message status name
 * DB: message_status.nom VARCHAR(50)
 */
export const MESSAGE_STATUS_NAME_MAX_LENGTH = 50;

/**
 * Minimum length for message status name
 */
export const MESSAGE_STATUS_NAME_MIN_LENGTH = 1;

// ============================================================================
// CUSTOM MESSAGE TYPES - Types for automated/template messages
// ============================================================================

/**
 * Maximum length for custom message type name
 * DB: types_messages_personnalises.nom VARCHAR(100)
 */
export const CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH = 100;

/**
 * Minimum length for custom message type name
 */
export const CUSTOM_MESSAGE_TYPE_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for custom message type description
 * DB: types_messages_personnalises.description TEXT
 */
export const CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH = 65535;

// ============================================================================
// CUSTOM MESSAGES - Message templates for automated sending
// ============================================================================

/**
 * Maximum length for custom message title
 * DB: messages_personnalises.titre VARCHAR(255)
 */
export const CUSTOM_MESSAGE_TITLE_MAX_LENGTH = 255;

/**
 * Minimum length for custom message title
 */
export const CUSTOM_MESSAGE_TITLE_MIN_LENGTH = 1;

/**
 * Maximum length for custom message content
 * DB: messages_personnalises.contenu TEXT NOT NULL
 */
export const CUSTOM_MESSAGE_CONTENT_MAX_LENGTH = 65535;

/**
 * Minimum length for custom message content
 */
export const CUSTOM_MESSAGE_CONTENT_MIN_LENGTH = 1;

// ============================================================================
// NOTIFICATIONS - System notifications (push, email, SMS)
// ============================================================================

/**
 * Maximum length for notification title
 * DB: notifications.titre VARCHAR(255)
 */
export const NOTIFICATION_TITLE_MAX_LENGTH = 255;

/**
 * Minimum length for notification title
 */
export const NOTIFICATION_TITLE_MIN_LENGTH = 1;

/**
 * Maximum length for notification message
 * DB: notifications.message TEXT NOT NULL
 */
export const NOTIFICATION_MESSAGE_MAX_LENGTH = 65535;

/**
 * Minimum length for notification message
 */
export const NOTIFICATION_MESSAGE_MIN_LENGTH = 1;

// ============================================================================
// ALERT TYPES - Types of system alerts
// ============================================================================

/**
 * Maximum length for alert type name
 * DB: alertes_types.nom VARCHAR(100)
 */
export const ALERT_TYPE_NAME_MAX_LENGTH = 100;

/**
 * Minimum length for alert type name
 */
export const ALERT_TYPE_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for alert type description
 * DB: alertes_types.description TEXT
 */
export const ALERT_TYPE_DESCRIPTION_MAX_LENGTH = 65535;

// ============================================================================
// USER ALERTS - Alerts specific to users
// ============================================================================

/**
 * Maximum length for user alert message
 * DB: alertes_utilisateurs.message TEXT
 */
export const USER_ALERT_MESSAGE_MAX_LENGTH = 65535;

/**
 * Minimum length for user alert message (when provided)
 */
export const USER_ALERT_MESSAGE_MIN_LENGTH = 1;

/**
 * Maximum length for user alert notes
 * DB: alertes_utilisateurs.notes TEXT
 */
export const USER_ALERT_NOTES_MAX_LENGTH = 65535;

/**
 * Minimum length for user alert notes (when provided)
 */
export const USER_ALERT_NOTES_MIN_LENGTH = 1;

// ============================================================================
// ALERT ACTIONS - Actions performed on alerts
// ============================================================================

/**
 * Maximum length for alert action description
 * DB: alertes_actions.description TEXT
 */
export const ALERT_ACTION_DESCRIPTION_MAX_LENGTH = 65535;

/**
 * Minimum length for alert action description (when provided)
 */
export const ALERT_ACTION_DESCRIPTION_MIN_LENGTH = 1;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default page size for paginated messaging queries
 */
export const MESSAGING_DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated messaging queries
 */
export const MESSAGING_MAX_PAGE_SIZE = 100;

/**
 * Minimum page size for paginated messaging queries
 */
export const MESSAGING_MIN_PAGE_SIZE = 1;

/**
 * Default page number for paginated messaging queries
 */
export const MESSAGING_DEFAULT_PAGE = 1;

// ============================================================================
// COMMON VALIDATION
// ============================================================================

/**
 * Valid sort orders
 */
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Default sort order
 */
export const DEFAULT_SORT_ORDER = 'desc';
