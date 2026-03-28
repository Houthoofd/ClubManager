/**
 * @fileoverview Messaging Domain Validators Index
 * @module @clubmanager/types/validators/messaging
 *
 * Central export point for all Messaging domain validators.
 * Exports schemas and types for messages, notifications, alerts, custom messages, etc.
 */

// ============================================================================
// MESSAGE VALIDATORS
// ============================================================================

export {
  // Schemas
  messageBaseSchema,
  createMessageSchema,
  updateMessageSchema,
  listMessagesSchema,
  messageInboxSchema,
  messageOutboxSchema,
  messageIdSchema,
  messageIdStringSchema,
  messageIdParamSchema,
  bulkMarkReadSchema,
  bulkDeleteMessagesSchema,
  messageResponseSchema,
  messagesListResponseSchema,
  messageStatsSchema,
  // Types
  type Message,
  type CreateMessage,
  type UpdateMessage,
  type ListMessagesQuery,
  type MessageInboxQuery,
  type MessageOutboxQuery,
  type MessageIdParam,
  type BulkMarkRead,
  type BulkDeleteMessages,
  type MessageResponse,
  type MessagesListResponse,
  type MessageStats,
} from './message.validators.js';

// ============================================================================
// MESSAGE STATUS VALIDATORS
// ============================================================================

export {
  // Schemas
  messageStatusBaseSchema,
  createMessageStatusSchema,
  updateMessageStatusSchema,
  listMessageStatusesSchema,
  messageStatusIdSchema,
  messageStatusIdStringSchema,
  messageStatusIdParamSchema,
  messageStatusResponseSchema,
  messageStatusesListResponseSchema,
  messageStatusStatsSchema,
  // Types
  type MessageStatus,
  type CreateMessageStatus,
  type UpdateMessageStatus,
  type ListMessageStatusesQuery,
  type MessageStatusIdParam,
  type MessageStatusResponse,
  type MessageStatusesListResponse,
  type MessageStatusStats,
} from './message-status.validators.js';

// ============================================================================
// NOTIFICATION VALIDATORS
// ============================================================================

export {
  // Schemas
  notificationTypeSchema,
  notificationBaseSchema,
  createNotificationSchema,
  updateNotificationSchema,
  listNotificationsSchema,
  userNotificationsSchema,
  notificationIdSchema,
  notificationIdStringSchema,
  notificationIdParamSchema,
  bulkMarkReadNotificationsSchema,
  bulkDeleteNotificationsSchema,
  markAllReadSchema,
  notificationResponseSchema,
  notificationsListResponseSchema,
  notificationStatsSchema,
  // Types
  type Notification,
  type CreateNotification,
  type UpdateNotification,
  type ListNotificationsQuery,
  type UserNotificationsQuery,
  type NotificationIdParam,
  type BulkMarkReadNotifications,
  type BulkDeleteNotifications,
  type MarkAllRead,
  type NotificationResponse,
  type NotificationsListResponse,
  type NotificationStats,
} from './notification.validators.js';

// ============================================================================
// ALERT TYPE VALIDATORS
// ============================================================================

export {
  // Schemas
  alertSeveritySchema,
  alertTypeBaseSchema,
  createAlertTypeSchema,
  updateAlertTypeSchema,
  listAlertTypesSchema,
  alertTypesBySeveritySchema,
  alertTypeIdSchema,
  alertTypeIdStringSchema,
  alertTypeIdParamSchema,
  alertTypeResponseSchema,
  alertTypesListResponseSchema,
  alertTypeStatsSchema,
  // Types
  type AlertType,
  type CreateAlertType,
  type UpdateAlertType,
  type ListAlertTypesQuery,
  type AlertTypesBySeverityQuery,
  type AlertTypeIdParam,
  type AlertTypeResponse,
  type AlertTypesListResponse,
  type AlertTypeStats,
} from './alert-type.validators.js';

// ============================================================================
// USER ALERT VALIDATORS
// ============================================================================

export {
  // Schemas
  alertStatusSchema,
  alertContextDataSchema,
  userAlertBaseSchema,
  createUserAlertSchema,
  updateUserAlertSchema,
  resolveAlertSchema,
  ignoreAlertSchema,
  listUserAlertsSchema,
  activeAlertsSchema,
  resolvedAlertsSchema,
  userAlertIdSchema,
  userAlertIdStringSchema,
  userAlertIdParamSchema,
  bulkMarkReadAlertsSchema,
  bulkResolveAlertsSchema,
  userAlertResponseSchema,
  userAlertsListResponseSchema,
  userAlertStatsSchema,
  // Types
  type UserAlert,
  type CreateUserAlert,
  type UpdateUserAlert,
  type ResolveAlert,
  type IgnoreAlert,
  type ListUserAlertsQuery,
  type ActiveAlertsQuery,
  type ResolvedAlertsQuery,
  type UserAlertIdParam,
  type BulkMarkReadAlerts,
  type BulkResolveAlerts,
  type UserAlertResponse,
  type UserAlertsListResponse,
  type UserAlertStats,
} from './user-alert.validators.js';

// ============================================================================
// ALERT ACTION VALIDATORS
// ============================================================================

export {
  // Schemas
  alertActionTypeSchema,
  alertActionBaseSchema,
  createAlertActionSchema,
  listAlertActionsSchema,
  alertHistorySchema,
  actionsByTypeSchema,
  actionsByUserSchema,
  alertActionIdSchema,
  alertActionIdStringSchema,
  alertActionIdParamSchema,
  alertIdParamSchema,
  alertActionResponseSchema,
  alertActionsListResponseSchema,
  alertActionStatsSchema,
  alertTimelineEntrySchema,
  alertTimelineSchema,
  // Types
  type AlertAction,
  type CreateAlertAction,
  type ListAlertActionsQuery,
  type AlertHistoryQuery,
  type ActionsByTypeQuery,
  type ActionsByUserQuery,
  type AlertActionIdParam,
  type AlertIdParam,
  type AlertActionResponse,
  type AlertActionsListResponse,
  type AlertActionStats,
  type AlertTimelineEntry,
  type AlertTimeline,
} from './alert-action.validators.js';

// ============================================================================
// CUSTOM MESSAGE TYPE VALIDATORS
// ============================================================================

export {
  // Schemas
  customMessageTypeBaseSchema,
  createCustomMessageTypeSchema,
  updateCustomMessageTypeSchema,
  listCustomMessageTypesSchema,
  activeCustomMessageTypesSchema,
  customMessageTypeIdSchema,
  customMessageTypeIdStringSchema,
  customMessageTypeIdParamSchema,
  customMessageTypeResponseSchema,
  customMessageTypesListResponseSchema,
  customMessageTypeStatsSchema,
  // Types
  type CustomMessageType,
  type CreateCustomMessageType,
  type UpdateCustomMessageType,
  type ListCustomMessageTypesQuery,
  type ActiveCustomMessageTypesQuery,
  type CustomMessageTypeIdParam,
  type CustomMessageTypeResponse,
  type CustomMessageTypesListResponse,
  type CustomMessageTypeStats,
} from './custom-message-type.validators.js';

// ============================================================================
// CUSTOM MESSAGE VALIDATORS
// ============================================================================

export {
  // Schemas
  customMessageBaseSchema,
  createCustomMessageSchema,
  updateCustomMessageSchema,
  listCustomMessagesSchema,
  activeCustomMessagesByTypeSchema,
  activeCustomMessagesSchema,
  customMessageIdSchema,
  customMessageIdStringSchema,
  customMessageIdParamSchema,
  activateCustomMessageSchema,
  deactivateCustomMessageSchema,
  bulkToggleCustomMessagesSchema,
  templateVariablesSchema,
  renderTemplateSchema,
  renderedTemplateSchema,
  customMessageResponseSchema,
  customMessagesListResponseSchema,
  customMessageStatsSchema,
  customMessagePreviewSchema,
  // Types
  type CustomMessage,
  type CreateCustomMessage,
  type UpdateCustomMessage,
  type ListCustomMessagesQuery,
  type ActiveCustomMessagesByTypeQuery,
  type ActiveCustomMessagesQuery,
  type CustomMessageIdParam,
  type ActivateCustomMessage,
  type DeactivateCustomMessage,
  type BulkToggleCustomMessages,
  type TemplateVariables,
  type RenderTemplate,
  type RenderedTemplate,
  type CustomMessageResponse,
  type CustomMessagesListResponse,
  type CustomMessageStats,
  type CustomMessagePreview,
} from './custom-message.validators.js';
