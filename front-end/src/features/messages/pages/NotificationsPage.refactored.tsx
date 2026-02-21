import { useMemo } from "react";
import {
  PageSection,
  Card,
  CardBody,
  EmptyState,
  Title,
  Button,
  List,
  ListItem,
  Badge,
  Flex,
  FlexItem,
  Alert,
  Divider,
} from "@patternfly/react-core";
import { BellIcon, CheckIcon, TrashIcon } from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useAuthStore } from "@/core/store/authStore";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "@/core/api/graphql/generated/graphql";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

/**
 * NotificationsPage Component
 *
 * Displays user notifications including system alerts, updates, and messages
 *
 * @architecture
 * - GraphQL: useNotificationsQuery, useMarkNotificationAsReadMutation
 * - Zustand: authStore (user), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: notifications.*
 *
 * Features:
 * - List of notifications
 * - Mark as read functionality
 * - Filter by read/unread
 * - Notification types with badges
 */
const NotificationsPage = () => {
  const { t } = useTypedTranslation();
  const { trackEvent } = useTracking();

  // Zustand stores
  const user = useAuthStore((state) => state.user);
  const addNotification = useUiStore((state) => state.addNotification);

  // GraphQL queries
  const {
    data: notificationsData,
    loading: loadingNotifications,
    error: errorNotifications,
    refetch: refetchNotifications,
  } = useNotificationsQuery({
    variables: { userId: user?.id || 0 },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [markAsRead, { loading: markingAsRead }] = useMarkNotificationAsReadMutation();

  // Extract notifications from query
  const notifications = useMemo((): Notification[] => {
    return (notificationsData?.notifications || []) as Notification[];
  }, [notificationsData]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  /**
   * Mark notification as read
   */
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead({
        variables: { notificationId },
      });

      addNotification({
        type: "success",
        message: t("notifications.markAsRead"),
      });

      trackEvent("notification_marked_read", { notificationId });
      await refetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);

      addNotification({
        type: "error",
        message: t("common.error"),
      });

      trackEvent("notification_mark_read_failed", {
        notificationId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      await Promise.all(
        unreadNotifications.map((notification) =>
          markAsRead({ variables: { notificationId: notification.id } })
        )
      );

      addNotification({
        type: "success",
        message: t("notifications.markAllAsRead"),
      });

      trackEvent("notifications_all_marked_read", {
        count: unreadNotifications.length,
      });

      await refetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);

      addNotification({
        type: "error",
        message: t("common.error"),
      });

      trackEvent("notifications_mark_all_read_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Get notification type badge color
   */
  const getTypeBadgeColor = (type: string): "blue" | "green" | "orange" | "red" | "grey" => {
    const typeColors: Record<string, "blue" | "green" | "orange" | "red" | "grey"> = {
      info: "blue",
      success: "green",
      warning: "orange",
      error: "red",
      system: "grey",
    };
    return typeColors[type.toLowerCase()] || "grey";
  };

  /**
   * Format notification timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return t("common.justNow");
    } else if (diffMins < 60) {
      return t("common.minutesAgo", { count: diffMins });
    } else if (diffHours < 24) {
      return t("common.hoursAgo", { count: diffHours });
    } else if (diffDays < 7) {
      return t("common.daysAgo", { count: diffDays });
    } else {
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Loading state
  if (loadingNotifications) {
    return (
      <div>
        <PageHeader
          title={t("notifications.title")}
          subtitle={t("notifications.subtitle")}
        />
        <PageSection>
          <Alert variant="info" title={t("notifications.loading")} />
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorNotifications) {
    return (
      <div>
        <PageHeader
          title={t("notifications.title")}
          subtitle={t("notifications.subtitle")}
        />
        <PageSection>
          <Alert variant="danger" title={t("notifications.loadingError")} />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
      />

      <PageSection>
        <Card>
          <CardBody>
            {/* Header with actions */}
            {notifications.length > 0 && (
              <>
                <Flex
                  justifyContent={{ default: "justifyContentSpaceBetween" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  style={{ marginBottom: "1rem" }}
                >
                  <FlexItem>
                    <Title headingLevel="h3" size="md">
                      {unreadCount > 0 ? (
                        <>
                          {t("notifications.unread")}: {unreadCount}
                        </>
                      ) : (
                        t("notifications.noNotifications")
                      )}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    {unreadCount > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        isDisabled={markingAsRead}
                        isLoading={markingAsRead}
                      >
                        {t("notifications.markAllAsRead")}
                      </Button>
                    )}
                  </FlexItem>
                </Flex>
                <Divider style={{ marginBottom: "1rem" }} />
              </>
            )}

            {/* Notifications list */}
            {notifications.length === 0 ? (
              <EmptyState>
                <BellIcon size="xl" style={{ marginBottom: "16px", fontSize: "48px" }} />
                <Title headingLevel="h4" size="lg">
                  {t("notifications.noNotifications")}
                </Title>
                <p>{t("notifications.noNotificationsMessage")}</p>
              </EmptyState>
            ) : (
              <List isPlain>
                {notifications.map((notification) => (
                  <ListItem key={notification.id}>
                    <Card
                      isCompact
                      isRounded
                      style={{
                        marginBottom: "0.5rem",
                        backgroundColor: notification.read ? "#f5f5f5" : "#fff",
                        border: notification.read ? "1px solid #e0e0e0" : "1px solid #0066cc",
                      }}
                    >
                      <CardBody>
                        <Flex
                          justifyContent={{ default: "justifyContentSpaceBetween" }}
                          alignItems={{ default: "alignItemsCenter" }}
                        >
                          <FlexItem flex={{ default: "flex_1" }}>
                            <Flex
                              direction={{ default: "column" }}
                              spaceItems={{ default: "spaceItemsSm" }}
                            >
                              <FlexItem>
                                <Flex
                                  spaceItems={{ default: "spaceItemsSm" }}
                                  alignItems={{ default: "alignItemsCenter" }}
                                >
                                  <FlexItem>
                                    <strong style={{ fontSize: "1rem" }}>
                                      {notification.title}
                                    </strong>
                                  </FlexItem>
                                  <FlexItem>
                                    <Badge color={getTypeBadgeColor(notification.type)}>
                                      {t(`notifications.types.${notification.type}`) ||
                                        notification.type}
                                    </Badge>
                                  </FlexItem>
                                  {!notification.read && (
                                    <FlexItem>
                                      <Badge color="blue">{t("notifications.unread")}</Badge>
                                    </FlexItem>
                                  )}
                                </Flex>
                              </FlexItem>
                              <FlexItem>
                                <p style={{ margin: 0, color: "#6a6e73" }}>
                                  {notification.message}
                                </p>
                              </FlexItem>
                              <FlexItem>
                                <small style={{ color: "#6a6e73" }}>
                                  {formatTimestamp(notification.created_at)}
                                </small>
                              </FlexItem>
                            </Flex>
                          </FlexItem>
                          <FlexItem>
                            {!notification.read && (
                              <Button
                                variant="plain"
                                icon={<CheckIcon />}
                                aria-label={t("notifications.markAsRead")}
                                onClick={() => handleMarkAsRead(notification.id)}
                                isDisabled={markingAsRead}
                              />
                            )}
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </div>
  );
};

// Export with HOCs: Auth, Tracking, Error boundary
export default withAuth(
  withTracking(withErrorBoundary(NotificationsPage), "NotificationsPage")
);
