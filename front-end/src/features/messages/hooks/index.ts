// ============================================================================
// Messages Feature Hooks - Barrel Export
// ============================================================================

/**
 * This file re-exports all message-related hooks from the communication hooks
 * to provide a feature-specific interface while maintaining consistency
 * with the existing GraphQL hooks infrastructure.
 */

// Re-export from centralized communication hooks
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

  // Legacy aliases (for backward compatibility)
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
} from '@/hooks/communication';

// ============================================================================
// Feature-specific types for hooks
// ============================================================================

export type {
  MessageType,
  Message,
  MessageRecipient,
  CreateMessageTypeInput,
  UpdateMessageTypeInput,
  SendMessageInput,
  DeleteResponse,
  UnreadMessagesCount,
} from '../types';
