import { useCallback } from "react";
import {
  useNotificationsQuery,
  useCreateNotificationMutation,
  useMarkNotificationAsReadMutation,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Notifications Hooks
// ============================================================================

/**
 * Hook to fetch notifications for a specific user
 */
export const useNotifications = (userId: number | string) => {
  return useNotificationsQuery({
    variables: { userId: Number(userId) },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60000, // Poll every minute for new notifications
  });
};

/**
 * Hook to create a new notification
 */
export const useCreateNotification = () => {
  const [mutate, result] = useCreateNotificationMutation({
    refetchQueries: ["Notifications"],
    awaitRefetchQueries: true,
  });

  const createNotification = useCallback(
    async (input: {
      user_id?: number;
      user_ids?: number[];
      title: string;
      message: string;
      type: string;
    }) => {
      return mutate({ variables: { input } });
    },
    [mutate],
  );

  return {
    createNotification,
    ...result,
  };
};

/**
 * Hook to mark a notification as read
 */
export const useMarkNotificationAsRead = () => {
  const [mutate, result] = useMarkNotificationAsReadMutation({
    refetchQueries: ["Notifications"],
    awaitRefetchQueries: true,
  });

  const markAsRead = useCallback(
    async (notificationId: number) => {
      return mutate({ variables: { notificationId } });
    },
    [mutate],
  );

  return {
    markAsRead,
    markNotificationAsRead: markAsRead,
    ...result,
  };
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get unread notifications count
 */
export const useUnreadNotificationsCount = (userId: number | string) => {
  const { data, loading } = useNotifications(userId);

  const unreadCount =
    data?.notifications?.filter((notif: any) => !notif.read).length || 0;

  return {
    unreadCount,
    loading,
  };
};

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

export const useCreerNotification = useCreateNotification;
export const useMarquerNotificationLue = useMarkNotificationAsRead;
