/**
 * @fileoverview Messaging DTOs
 * @module @clubmanager/types/dtos/messaging
 *
 * Data Transfer Objects for the Messaging module.
 * Re-exports types from validators for API request/response structures.
 */

// ============================================================================
// MESSAGE DTOs
// ============================================================================

export type {
  CreateMessage,
  UpdateMessage,
  MessageResponse,
  MessagesListResponse,
  MessageStats,
  ListMessagesQuery,
  MessageInboxQuery,
  MessageOutboxQuery,
  BulkMarkRead,
  BulkDeleteMessages,
} from '../../validators/messaging/message.validators.js';

// ============================================================================
// MESSAGE STATUS DTOs
// ============================================================================

export type {
  CreateMessageStatus,
  UpdateMessageStatus,
  MessageStatusResponse,
  MessageStatusesListResponse,
  MessageStatusStats,
  ListMessageStatusesQuery,
} from '../../validators/messaging/message-status.validators.js';

// ============================================================================
// NOTIFICATION DTOs
// ============================================================================

export type {
  CreateNotification,
  UpdateNotification,
  NotificationResponse,
  NotificationsListResponse,
  NotificationStats,
  ListNotificationsQuery,
  UserNotificationsQuery,
  BulkMarkReadNotifications,
  BulkDeleteNotifications,
  MarkAllRead,
} from '../../validators/messaging/notification.validators.js';

// ============================================================================
// ALERT TYPE DTOs
// ============================================================================

export type {
  CreateAlertType,
  UpdateAlertType,
  AlertTypeResponse,
  AlertTypesListResponse,
  AlertTypeStats,
  ListAlertTypesQuery,
  AlertTypesBySeverityQuery,
} from '../../validators/messaging/alert-type.validators.js';

// ============================================================================
// USER ALERT DTOs
// ============================================================================

export type {
  CreateUserAlert,
  UpdateUserAlert,
  ResolveAlert,
  IgnoreAlert,
  UserAlertResponse,
  UserAlertsListResponse,
  UserAlertStats,
  ListUserAlertsQuery,
  ActiveAlertsQuery,
  ResolvedAlertsQuery,
  BulkMarkReadAlerts,
  BulkResolveAlerts,
} from '../../validators/messaging/user-alert.validators.js';

// ============================================================================
// ALERT ACTION DTOs
// ============================================================================

export type {
  CreateAlertAction,
  AlertActionResponse,
  AlertActionsListResponse,
  AlertActionStats,
  AlertTimelineEntry,
  AlertTimeline,
  ListAlertActionsQuery,
  AlertHistoryQuery,
  ActionsByTypeQuery,
  ActionsByUserQuery,
} from '../../validators/messaging/alert-action.validators.js';

// ============================================================================
// CUSTOM MESSAGE TYPE DTOs
// ============================================================================

export type {
  CreateCustomMessageType,
  UpdateCustomMessageType,
  CustomMessageTypeResponse,
  CustomMessageTypesListResponse,
  CustomMessageTypeStats,
  ListCustomMessageTypesQuery,
  ActiveCustomMessageTypesQuery,
} from '../../validators/messaging/custom-message-type.validators.js';

// ============================================================================
// CUSTOM MESSAGE DTOs
// ============================================================================

export type {
  CreateCustomMessage,
  UpdateCustomMessage,
  CustomMessageResponse,
  CustomMessagesListResponse,
  CustomMessageStats,
  CustomMessagePreview,
  ListCustomMessagesQuery,
  ActiveCustomMessagesByTypeQuery,
  ActiveCustomMessagesQuery,
  ActivateCustomMessage,
  DeactivateCustomMessage,
  BulkToggleCustomMessages,
  TemplateVariables,
  RenderTemplate,
  RenderedTemplate,
} from '../../validators/messaging/custom-message.validators.js';
