import { useCallback } from "react";
import {
  useMessageTypesQuery,
  useMessagesReceivedQuery,
  useMessagesTrashedQuery,
  useUnreadMessagesCountQuery,
  useCreateMessageTypeMutation,
  useUpdateMessageTypeMutation,
  useDeleteMessageTypeMutation,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  useDeleteReceivedMessageMutation,
  useRestoreMessageMutation,
} from "@/lib/apollo/generated/graphql";

// ============================================================================
// Message Types Hooks
// ============================================================================

export const useMessageTypes = () => {
  return useMessageTypesQuery({
    fetchPolicy: "cache-and-network",
  });
};

export const useCreateMessageType = () => {
  const [mutate, result] = useCreateMessageTypeMutation({
    refetchQueries: ["MessageTypes"],
    awaitRefetchQueries: true,
  });

  const createMessageType = useCallback(
    async (input: {
      type_name: string;
      description?: string;
      active?: boolean;
    }) => {
      return mutate({ variables: { input } });
    },
    [mutate],
  );

  return {
    createMessageType,
    ...result,
  };
};

export const useUpdateMessageType = () => {
  const [mutate, result] = useUpdateMessageTypeMutation({
    refetchQueries: ["MessageTypes"],
    awaitRefetchQueries: true,
  });

  const updateMessageType = useCallback(
    async (
      id: number,
      input: { type_name?: string; description?: string; active?: boolean },
    ) => {
      return mutate({ variables: { id, input } });
    },
    [mutate],
  );

  return {
    updateMessageType,
    ...result,
  };
};

export const useDeleteMessageType = () => {
  const [mutate, result] = useDeleteMessageTypeMutation({
    refetchQueries: ["MessageTypes"],
    awaitRefetchQueries: true,
  });

  const deleteMessageType = useCallback(
    async (id: number) => {
      return mutate({ variables: { id } });
    },
    [mutate],
  );

  return {
    deleteMessageType,
    ...result,
  };
};

// ============================================================================
// Messages Hooks
// ============================================================================

export const useMessagesReceived = (userId: number | string) => {
  return useMessagesReceivedQuery({
    variables: { userId: Number(userId) },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000, // Poll every 30 seconds for new messages
  });
};

export const useMessagesTrashed = (userId: number | string) => {
  return useMessagesTrashedQuery({
    variables: { userId: Number(userId) },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });
};

export const useUnreadMessagesCount = (userId: number | string) => {
  return useUnreadMessagesCountQuery({
    variables: { userId: Number(userId) },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60000, // Poll every minute for unread count
  });
};

export const useSendMessage = () => {
  const [mutate, result] = useSendMessageMutation({
    refetchQueries: ["MessagesReceived", "UnreadMessagesCount"],
    awaitRefetchQueries: true,
  });

  const sendMessage = useCallback(
    async (input: {
      sender_id: number;
      type_message_id?: number;
      subject?: string;
      content: string;
      recipient_ids: number[];
    }) => {
      return mutate({ variables: { input } });
    },
    [mutate],
  );

  return {
    sendMessage,
    ...result,
  };
};

export const useMarkMessageAsRead = () => {
  const [mutate, result] = useMarkMessageAsReadMutation({
    refetchQueries: ["MessagesReceived", "UnreadMessagesCount"],
    awaitRefetchQueries: true,
  });

  const markAsRead = useCallback(
    async (recipientId: number) => {
      return mutate({ variables: { recipientId } });
    },
    [mutate],
  );

  return {
    markAsRead,
    markMessageAsRead: markAsRead,
    ...result,
  };
};

export const useDeleteReceivedMessage = () => {
  const [mutate, result] = useDeleteReceivedMessageMutation({
    refetchQueries: [
      "MessagesReceived",
      "MessagesTrashed",
      "UnreadMessagesCount",
    ],
    awaitRefetchQueries: true,
  });

  const deleteMessage = useCallback(
    async (recipientId: number) => {
      return mutate({ variables: { recipientId } });
    },
    [mutate],
  );

  return {
    deleteMessage,
    deleteReceivedMessage: deleteMessage,
    ...result,
  };
};

export const useRestoreMessage = () => {
  const [mutate, result] = useRestoreMessageMutation({
    refetchQueries: ["MessagesReceived", "MessagesTrashed"],
    awaitRefetchQueries: true,
  });

  const restoreMessage = useCallback(
    async (recipientId: number) => {
      return mutate({ variables: { recipientId } });
    },
    [mutate],
  );

  return {
    restoreMessage,
    ...result,
  };
};

// ============================================================================
// Composite/Utility Hooks
// ============================================================================

/**
 * Combined hook for message management
 * Provides all message-related functionality in one hook
 */
export const useMessages = (userId?: number | string) => {
  const unreadCountQuery = useUnreadMessagesCount(userId || 0);

  return {
    unreadCount: unreadCountQuery.data?.unreadMessagesCount?.count || 0,
    refreshUnreadCount: unreadCountQuery.refetch,
    isLoadingUnreadCount: unreadCountQuery.loading,
  };
};

// Legacy alias for backward compatibility
export const useMessagesNonLus = useUnreadMessagesCount;
export const useMessagesCorbeille = useMessagesTrashed;
export const useSupprimerMessageRecu = useDeleteReceivedMessage;
export const useMarquerMessageLu = useMarkMessageAsRead;
export const useEnvoyerMessage = useSendMessage;
export const useTypesMessages = useMessageTypes;
export const useCreerTypeMessage = useCreateMessageType;
export const useModifierTypeMessage = useUpdateMessageType;
export const useSupprimerTypeMessage = useDeleteMessageType;
