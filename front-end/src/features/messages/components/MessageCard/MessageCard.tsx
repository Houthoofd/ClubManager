/**
 * MessageCard Component
 *
 * Displays message information in a card format.
 * Atomic component with single responsibility: render message data.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Card, CardBody, Title, Label, Flex, FlexItem } from "@patternfly/react-core";
import { EnvelopeIcon, CheckCircleIcon, ClockIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { MessageCardProps } from "./MessageCard.types";
import {
  formatRelativeTime,
  formatSenderName,
  truncateSubject,
  truncateContent,
  isMessageUnread,
} from "../../utils/message-formatters";

export const MessageCard: React.FC<MessageCardProps> = ({
  id,
  subject,
  content,
  sender,
  type,
  createdAt,
  read = false,
  onClick,
  actions,
  className = "",
  showPreview = true,
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const senderName = formatSenderName(sender);
  const relativeTime = formatRelativeTime(createdAt);
  const isUnread = isMessageUnread({ read });

  return (
    <Card
      className={`message-card ${isUnread ? "message-card--unread" : ""} ${className}`}
      style={{
        marginBottom: "1rem",
        cursor: onClick ? "pointer" : "default",
        backgroundColor: isUnread ? "#f0f8ff" : "white",
        borderLeft: isUnread ? "4px solid #0066cc" : "none",
      }}
      onClick={handleClick}
      isClickable={!!onClick}
    >
      <CardBody>
        <Flex
          direction={{ default: "column" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          {/* Header with Subject and Read Status */}
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem flex={{ default: "flex_1" }}>
              <Title
                headingLevel="h4"
                size="md"
                style={{ fontWeight: isUnread ? "bold" : "normal" }}
              >
                <EnvelopeIcon
                  style={{
                    marginRight: "0.5rem",
                    color: isUnread ? "#0066cc" : "#6a6e73",
                  }}
                />
                {truncateSubject(subject, 60)}
                {isUnread && (
                  <Label
                    color="blue"
                    isCompact
                    style={{ marginLeft: "0.5rem" }}
                  >
                    {t("messages.list.unread")}
                  </Label>
                )}
              </Title>
            </FlexItem>
            {actions && <FlexItem>{actions}</FlexItem>}
          </Flex>

          {/* Message Meta Information */}
          <Flex
            spaceItems={{ default: "spaceItemsSm" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            {/* Sender */}
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <strong>{t("messages.view.from")}:</strong>
                <span>{senderName}</span>
              </div>
            </FlexItem>

            {/* Time */}
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <ClockIcon size="sm" />
                <span>{relativeTime}</span>
              </div>
            </FlexItem>

            {/* Message Type */}
            {type && (
              <FlexItem>
                <Label color="purple" isCompact>
                  {type}
                </Label>
              </FlexItem>
            )}

            {/* Read Indicator */}
            {read && (
              <FlexItem>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#3e8635",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <CheckCircleIcon size="sm" />
                  <span>{t("messages.list.read")}</span>
                </div>
              </FlexItem>
            )}
          </Flex>

          {/* Content Preview */}
          {showPreview && content && (
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                  padding: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  fontStyle: "italic",
                }}
              >
                {truncateContent(content, 150)}
              </div>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default MessageCard;
