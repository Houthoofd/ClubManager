/**
 * MessageStats Component
 *
 * Displays message statistics (total, unread, read counts).
 * Atomic component with single responsibility: display message stats.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Flex, FlexItem, Title } from "@patternfly/react-core";
import { InboxIcon, CheckCircleIcon, EnvelopeIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { MessageStatsProps } from "./MessageStats.types";

export const MessageStats: React.FC<MessageStatsProps> = ({
  totalMessages = 0,
  unreadMessages = 0,
  readMessages = 0,
  showTotal = true,
  showUnread = true,
  showRead = true,
  variant = "horizontal",
  className = "",
}) => {
  const { t } = useTranslation();

  const stats = [];

  if (showUnread) {
    stats.push({
      key: "unread",
      label: t("messages.stats.unread"),
      value: unreadMessages,
      icon: InboxIcon,
      color: "#0066cc",
    });
  }

  if (showRead) {
    stats.push({
      key: "read",
      label: t("messages.stats.read"),
      value: readMessages,
      icon: CheckCircleIcon,
      color: "#3e8635",
    });
  }

  if (showTotal) {
    stats.push({
      key: "total",
      label: t("messages.stats.total"),
      value: totalMessages,
      icon: EnvelopeIcon,
      color: "#6a6e73",
    });
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <Flex
      direction={{ default: variant === "horizontal" ? "row" : "column" }}
      spaceItems={{ default: variant === "horizontal" ? "spaceItemsLg" : "spaceItemsMd" }}
      className={`message-stats message-stats--${variant} ${className}`}
      style={{ marginBottom: "1.5rem" }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <FlexItem key={stat.key}>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsNone" }}
            >
              <FlexItem>
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    <Icon style={{ color: stat.color }} />
                  </FlexItem>
                  <FlexItem>
                    <Title
                      headingLevel="h3"
                      size="2xl"
                      style={{ color: stat.color, marginBottom: 0 }}
                    >
                      {stat.value}
                    </Title>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6a6e73",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                  }}
                >
                  {stat.label}
                </p>
              </FlexItem>
            </Flex>
          </FlexItem>
        );
      })}
    </Flex>
  );
};

export default MessageStats;
