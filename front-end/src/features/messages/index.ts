// ============================================================================
// Messages Feature - Barrel Export
// ============================================================================

/**
 * Main barrel export for the Messages feature
 * Provides a centralized entry point for all messages-related exports
 */

// ============================================================================
// Pages
// ============================================================================
export { default as MessagesPage } from "./pages/MessagesPage";
export { default as NotificationsPage } from "./pages/NotificationsPage";

// ============================================================================
// Components
// ============================================================================
export { default as MessageCard } from "./components/MessageCard";
export { default as MessageDetailModal } from "./components/MessageDetailModal";
export { default as MessageTypeCard } from "./components/MessageTypeCard";
export { default as MessageTypeSelector } from "./components/MessageTypeSelector";
export { default as MessageTypesListTab } from "./components/MessageTypesListTab";
export { default as MessagesReceivedTab } from "./components/MessagesReceivedTab";
export { default as MessagesReadTab } from "./components/MessagesReadTab";
export { default as SendMessageForm } from "./components/SendMessageForm";
export { default as SendMessageModal } from "./components/SendMessageModal";
export { default as SendMessageConfirmModal } from "./components/SendMessageConfirmModal";
export { default as DeleteMessageModal } from "./components/DeleteMessageModal";
export { default as CreateMessageTypeForm } from "./components/CreateMessageTypeForm";
export { default as UserSelector } from "./components/UserSelector";

// ============================================================================
// Hooks
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
  // Composite hooks
  useMessages,
  useMessaging,
  useConversation,
  useSendDirectMessage,
  useSendGroupMessage,
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
  useMessagesUtilisateur,
  useEnvoyerMessageGroupe,
} from "./hooks";

// ============================================================================
// Types
// ============================================================================
export type {
  MessageType,
  Message,
  MessageRecipient,
  MessageWithStatus,
  SuggestedMessage,
  CreateMessageTypeInput,
  UpdateMessageTypeInput,
  SendMessageInput,
  DeleteResponse,
  UnreadMessagesCount,
  MessagesTabProps,
  MessageTypesTabProps,
  SendMessageFormProps,
  MessagesPageState,
} from "./types";

// ============================================================================
// Constants
// ============================================================================
export {
  MESSAGE_TABS,
  MESSAGE_TAB_LABELS,
  POLLING_INTERVALS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  MESSAGE_STATUS,
  MESSAGE_STATUS_COLORS,
  MESSAGE_STATUS_ICONS,
  MESSAGE_PREVIEW_LENGTH,
  MESSAGE_SUBJECT_MAX_LENGTH,
  MESSAGE_CONTENT_MAX_LENGTH,
  SUGGESTED_MESSAGE_REASONS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  MESSAGE_VARIANTS,
  MESSAGE_CLASSES,
} from "./constants";
