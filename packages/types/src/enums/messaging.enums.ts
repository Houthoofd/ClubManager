/**
 * @fileoverview Messaging Domain Enums
 * @module @clubmanager/types/enums/messaging
 *
 * Defines enums for the Messaging domain based on DB schema.
 * Covers notifications, alerts, message types, etc.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Tables: notifications, alertes_types, alertes_utilisateurs, alertes_actions
 */

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Notification types
 * DB: notifications.type ENUM('info', 'warning', 'error', 'success')
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Array of all valid notification types
 */
export const NOTIFICATION_TYPES = Object.values(NotificationType);

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Alert severity levels
 * DB: alertes_types.severite ENUM('info', 'warning', 'critical')
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Array of all valid alert severity levels
 */
export const ALERT_SEVERITIES = Object.values(AlertSeverity);

/**
 * Alert status
 * DB: alertes_utilisateurs.statut ENUM('active', 'resolue', 'ignoree')
 */
export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolue',
  IGNORED = 'ignoree',
}

/**
 * Array of all valid alert statuses
 */
export const ALERT_STATUSES = Object.values(AlertStatus);

/**
 * Alert action types
 * DB: alertes_actions.action_type ENUM('message_envoye', 'information_mise_a_jour', 'paiement_recu', 'statut_change', 'autre')
 */
export enum AlertActionType {
  MESSAGE_SENT = 'message_envoye',
  INFORMATION_UPDATED = 'information_mise_a_jour',
  PAYMENT_RECEIVED = 'paiement_recu',
  STATUS_CHANGED = 'statut_change',
  OTHER = 'autre',
}

/**
 * Array of all valid alert action types
 */
export const ALERT_ACTION_TYPES = Object.values(AlertActionType);

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid NotificationType
 */
export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && NOTIFICATION_TYPES.includes(value as NotificationType);
}

/**
 * Type guard to check if a value is a valid AlertSeverity
 */
export function isAlertSeverity(value: unknown): value is AlertSeverity {
  return typeof value === 'string' && ALERT_SEVERITIES.includes(value as AlertSeverity);
}

/**
 * Type guard to check if a value is a valid AlertStatus
 */
export function isAlertStatus(value: unknown): value is AlertStatus {
  return typeof value === 'string' && ALERT_STATUSES.includes(value as AlertStatus);
}

/**
 * Type guard to check if a value is a valid AlertActionType
 */
export function isAlertActionType(value: unknown): value is AlertActionType {
  return typeof value === 'string' && ALERT_ACTION_TYPES.includes(value as AlertActionType);
}
