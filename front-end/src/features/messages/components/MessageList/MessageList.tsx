/**
 * MessageList Component
 *
 * Renders a list of message cards, optionally grouped by date.
 * Atomic component with single responsibility: display message list.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Title, Divider } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { MessageCard } from "../MessageCard";
import { EmptyMessageState } from "../EmptyMessageState";
import {
  groupMessagesByDate,
  sortMessagesByDate,
} from "../../utils/message-formatters";

export interface MessageItem {
  id: string | number;
  subject: string;
  content?: string;
  sender: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    prenom?: string;
    nom?: string;
    email?: string;
  };
  type?: string;
  created_at?: string;
  date?: string;
  read?: boolean;
  lu?: boolean;
}

export interface MessageListProps {
  /** Array of messages to display */
  messages: MessageItem[];

  /** Whether to group messages by date (today/yesterday/older) */
  groupByDate?: boolean;

  /** Whether this is a filtered/searched list */
  isFiltered?: boolean;

  /** Click handler for message cards */
  onMessageClick?: (messageId: string | number) => void;

  /** Custom actions for each message card */
  renderActions?: (message: MessageItem) => React.ReactNode;

  /** Custom empty state component */
  emptyState?: React.ReactNode;

  /** Loading state */
  isLoading?: boolean;

  /** Whether to show content preview */
  showPreview?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  groupByDate = false,
  isFiltered = false,
  onMessageClick,
  renderActions,
  emptyState,
  isLoading = false,
  showPreview = true,
  className = "",
}) => {
  const { t } = useTranslation();

  // Show loading state
  if (isLoading) {
    return null; // Parent should handle loading spinner
  }

  // Show empty state if no messages
  if (messages.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return <EmptyMessageState isSearchResult={isFiltered} />;
  }

  // Render grouped by date
  if (groupByDate) {
    const grouped = groupMessagesByDate(messages);
    const hasToday = grouped.today.length > 0;
    const hasYesterday = grouped.yesterday.length > 0;
    const hasOlder = grouped.older.length > 0;

    return (
      <div className={`message-list message-list--grouped ${className}`}>
        {/* Today */}
        {hasToday && (
          <div className="message-list__date-group">
            <Title
              headingLevel="h3"
              size="lg"
              style={{
                marginBottom: "1rem",
              }}
            >
              {t("common.time.today")}
            </Title>
            <Divider style={{ marginBottom: "1rem" }} />
            <div className="message-list__date-messages">
              {grouped.today.map((message) => (
                <MessageCard
                  key={message.id}
                  id={message.id}
                  subject={message.subject}
                  content={message.content}
                  sender={message.sender}
                  type={message.type}
                  createdAt={message.created_at || message.date || ""}
                  read={message.read ?? message.lu ?? false}
                  onClick={onMessageClick}
                  actions={renderActions ? renderActions(message) : undefined}
                  showPreview={showPreview}
                />
              ))}
            </div>
          </div>
        )}

        {/* Yesterday */}
        {hasYesterday && (
          <div className="message-list__date-group" style={{ marginTop: hasToday ? "2rem" : "0" }}>
            <Title
              headingLevel="h3"
              size="lg"
              style={{
                marginBottom: "1rem",
              }}
            >
              {t("common.time.yesterday")}
            </Title>
            <Divider style={{ marginBottom: "1rem" }} />
            <div className="message-list__date-messages">
              {grouped.yesterday.map((message) => (
                <MessageCard
                  key={message.id}
                  id={message.id}
                  subject={message.subject}
                  content={message.content}
                  sender={message.sender}
                  type={message.type}
                  createdAt={message.created_at || message.date || ""}
                  read={message.read ?? message.lu ?? false}
                  onClick={onMessageClick}
                  actions={renderActions ? renderActions(message) : undefined}
                  showPreview={showPreview}
                />
              ))}
            </div>
          </div>
        )}

        {/* Older */}
        {hasOlder && (
          <div
            className="message-list__date-group"
            style={{ marginTop: hasToday || hasYesterday ? "2rem" : "0" }}
          >
            <Title
              headingLevel="h3"
              size="lg"
              style={{
                marginBottom: "1rem",
              }}
            >
              Plus ancien
            </Title>
            <Divider style={{ marginBottom: "1rem" }} />
            <div className="message-list__date-messages">
              {sortMessagesByDate(grouped.older).map((message) => (
                <MessageCard
                  key={message.id}
                  id={message.id}
                  subject={message.subject}
                  content={message.content}
                  sender={message.sender}
                  type={message.type}
                  createdAt={message.created_at || message.date || ""}
                  read={message.read ?? message.lu ?? false}
                  onClick={onMessageClick}
                  actions={renderActions ? renderActions(message) : undefined}
                  showPreview={showPreview}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render flat list (no grouping)
  const sortedMessages = sortMessagesByDate(messages);

  return (
    <div className={`message-list message-list--flat ${className}`}>
      {sortedMessages.map((message) => (
        <MessageCard
          key={message.id}
          id={message.id}
          subject={message.subject}
          content={message.content}
          sender={message.sender}
          type={message.type}
          createdAt={message.created_at || message.date || ""}
          read={message.read ?? message.lu ?? false}
          onClick={onMessageClick}
          actions={renderActions ? renderActions(message) : undefined}
          showPreview={showPreview}
        />
      ))}
    </div>
  );
};

export default MessageList;
