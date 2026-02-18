import { useCallback } from "react";
import {
  useMessagesReceived,
  useSendMessage,
  useMarkMessageAsRead,
  useDeleteReceivedMessage,
} from "./useMessages";

// ============================================================================
// Messaging/Conversation Hooks
// ============================================================================

/**
 * Hook for managing user's messaging conversations
 * Wrapper around message hooks for easier conversation management
 */
export const useMessaging = (userId: number | string) => {
  const messagesQuery = useMessagesReceived(userId);
  const { sendMessage, loading: sendingMessage } = useSendMessage();
  const { markAsRead, loading: markingAsRead } = useMarkMessageAsRead();
  const { deleteMessage, loading: deletingMessage } =
    useDeleteReceivedMessage();

  return {
    messages: messagesQuery.data?.messagesReceived || [],
    loading: messagesQuery.loading,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
    sendMessage,
    sendingMessage,
    markAsRead,
    markingAsRead,
    deleteMessage,
    deletingMessage,
  };
};

/**
 * Hook for managing conversation between two users
 * Filters messages for a specific conversation
 */
export const useConversation = (
  userId: number | string,
  otherUserId: number | string,
) => {
  const messagesQuery = useMessagesReceived(userId);

  const conversationMessages =
    messagesQuery.data?.messagesReceived?.filter(
      (msgRecipient: any) =>
        msgRecipient.message?.sender_id === Number(otherUserId) ||
        msgRecipient.recipient_id === Number(otherUserId),
    ) || [];

  return {
    messages: conversationMessages,
    loading: messagesQuery.loading,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
  };
};

/**
 * Hook to send a message to a single user
 */
export const useSendDirectMessage = () => {
  const { sendMessage, loading, error } = useSendMessage();

  const sendDirectMessage = useCallback(
    async (params: {
      senderId: number;
      recipientId: number;
      content: string;
      subject?: string;
      typeMessageId?: number;
    }) => {
      return sendMessage({
        sender_id: params.senderId,
        recipient_ids: [params.recipientId],
        content: params.content,
        subject: params.subject,
        type_message_id: params.typeMessageId,
      });
    },
    [sendMessage],
  );

  return {
    sendDirectMessage,
    loading,
    error,
  };
};

/**
 * Hook to send a message to multiple users (group/broadcast)
 */
export const useSendGroupMessage = () => {
  const { sendMessage, loading, error } = useSendMessage();

  const sendGroupMessage = useCallback(
    async (params: {
      senderId: number;
      recipientIds: number[];
      content: string;
      subject: string;
      typeMessageId?: number;
    }) => {
      return sendMessage({
        sender_id: params.senderId,
        recipient_ids: params.recipientIds,
        content: params.content,
        subject: params.subject,
        type_message_id: params.typeMessageId,
      });
    },
    [sendMessage],
  );

  return {
    sendGroupMessage,
    loading,
    error,
  };
};

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

export const useMessagesUtilisateur = useMessagesReceived;
export const useEnvoyerMessageGroupe = useSendGroupMessage;
