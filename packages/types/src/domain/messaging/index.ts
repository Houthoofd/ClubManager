/**
 * @fileoverview Messaging Domain Types
 * @module @clubmanager/types/domain/messaging
 *
 * Domain types for the Messaging module.
 * Re-exports types inferred from Zod validators for consistency.
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type {
  Message,
  CreateMessage,
  UpdateMessage,
  MessageResponse,
  MessagesListResponse,
  MessageStats,
} from '../../validators/messaging/message.validators.js';

// ============================================================================
// MESSAGE STATUS TYPES
// ============================================================================

export type {
  MessageStatus,
  CreateMessageStatus,
  UpdateMessageStatus,
  MessageStatusResponse,
  MessageStatusesListResponse,
  MessageStatusStats,
} from '../../validators/messaging/message-status.validators.js';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type {
  Notification,
  CreateNotification,
  UpdateNotification,
  NotificationResponse,
  NotificationsListResponse,
  NotificationStats,
} from '../../validators/messaging/notification.validators.js';

// ============================================================================
// ALERT TYPE TYPES
// ============================================================================

export type {
  AlertType,
  CreateAlertType,
  UpdateAlertType,
  AlertTypeResponse,
  AlertTypesListResponse,
  AlertTypeStats,
} from '../../validators/messaging/alert-type.validators.js';

// ============================================================================
// USER ALERT TYPES
// ============================================================================

export type {
  UserAlert,
  CreateUserAlert,
  UpdateUserAlert,
  ResolveAlert,
  IgnoreAlert,
  UserAlertResponse,
  UserAlertsListResponse,
  UserAlertStats,
} from '../../validators/messaging/user-alert.validators.js';

// ============================================================================
// ALERT ACTION TYPES
// ============================================================================

export type {
  AlertAction,
  CreateAlertAction,
  AlertActionResponse,
  AlertActionsListResponse,
  AlertActionStats,
  AlertTimelineEntry,
  AlertTimeline,
} from '../../validators/messaging/alert-action.validators.js';

// ============================================================================
// CUSTOM MESSAGE TYPE TYPES
// ============================================================================

export type {
  CustomMessageType,
  CreateCustomMessageType,
  UpdateCustomMessageType,
  CustomMessageTypeResponse,
  CustomMessageTypesListResponse,
  CustomMessageTypeStats,
} from '../../validators/messaging/custom-message-type.validators.js';

// ============================================================================
// CUSTOM MESSAGE TYPES
// ============================================================================

export type {
  CustomMessage,
  CreateCustomMessage,
  UpdateCustomMessage,
  TemplateVariables,
  RenderTemplate,
  RenderedTemplate,
  CustomMessageResponse,
  CustomMessagesListResponse,
  CustomMessageStats,
  CustomMessagePreview,
} from '../../validators/messaging/custom-message.validators.js';

// ============================================================================
// ENUMS
// ============================================================================

export {
  NotificationType,
  NOTIFICATION_TYPES,
  AlertSeverity,
  ALERT_SEVERITIES,
  AlertStatus,
  ALERT_STATUSES,
  AlertActionType,
  ALERT_ACTION_TYPES,
  isNotificationType,
  isAlertSeverity,
  isAlertStatus,
  isAlertActionType,
} from '../../enums/messaging.enums.js';
