// ============================================================================
// Messages Feature Hooks - Barrel Export
// ============================================================================

/**
 * This file re-exports all message-related hooks
 */

// ============================================================================
// Business Logic Hooks (Modular Architecture)
// ============================================================================
export { useMessageSearch } from "./useMessageSearch";
export { useMessageTabs } from "./useMessageTabs";

// ============================================================================
// Messages Hooks
// ============================================================================
export {
  useMessageTypes,
  useCreateMessageType,
  useUpdateMessageType,
  useDeleteMessageType,
  useMessagesReceived,
  useMessagesTrashed,
  useUnreadMessagesCount,
  useSendMessage,
  useMarkMessageAsRead,
  useDeleteReceivedMessage,
  useRestoreMessage,
  useMessages,
  // Legacy aliases
  useMessagesNonLus,
  useMessagesCorbeille,
  useSupprimerMessageRecu,
  useMarquerMessageLu,
  useEnvoyerMessage,
  useTypesMessages,
  useCreerTypeMessage,
  useModifierTypeMessage,
  useSupprimerTypeMessage,
} from "./useMessages";

// ============================================================================
// Notifications Hooks
// ============================================================================
export {
  useNotifications,
  useCreateNotification,
  useMarkNotificationAsRead,
  useUnreadNotificationsCount,
  // Legacy aliases
  useCreerNotification,
  useMarquerNotificationLue,
} from "./useNotifications";

// ============================================================================
// Messaging/Conversation Hooks
// ============================================================================
export {
  useMessaging,
  useConversation,
  useSendDirectMessage,
  useSendGroupMessage,
  // Legacy aliases
  useMessagesUtilisateur,
  useEnvoyerMessageGroupe,
} from "./useMessaging";
