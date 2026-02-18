/**
 * Communication Module Exports
 *
 * This barrel file exports all communication-related hooks:
 * - Messages (messaging system with types)
 * - Notifications (user notifications)
 * - Messaging (conversations and direct messaging)
 */

// ============================================================================
// Messages
// ============================================================================

export {
  // Message Types
  useMessageTypes,
  useCreateMessageType,
  useUpdateMessageType,
  useDeleteMessageType,
  // Messages
  useMessagesReceived,
  useMessagesTrashed,
  useUnreadMessagesCount,
  useSendMessage,
  useMarkMessageAsRead,
  useDeleteReceivedMessage,
  useRestoreMessage,
  // Composite
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
// Notifications
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
// Messaging (Conversations)
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
