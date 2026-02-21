/**
 * ReceivedMessagesContent Component
 *
 * Displays received (unread) messages with search and actions.
 * Atomic component with single responsibility: received messages tab content.
 * Fully internationalized with i18n support.
 */

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MessageList } from "../MessageList";
import { MessageSearch } from "../MessageSearch";
import { MessageActionButtons } from "../MessageActionButtons";
import { useMessageSearch } from "../../hooks";
import type { ReceivedMessagesContentProps } from "./ReceivedMessagesContent.types";

export const ReceivedMessagesContent: React.FC<ReceivedMessagesContentProps> = ({
  messages,
  onMessageClick,
  onMarkAsRead,
  onDelete,
  isLoading = false,
  groupByDate = true,
  showSearch = true,
  className = "",
}) => {
  const { t } = useTranslation();

  // Search functionality
  const { searchValue, setSearchValue, clearSearch, filterMessages, hasSearch } =
    useMessageSearch();

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    return filterMessages(messages);
  }, [messages, filterMessages]);

  // Render action buttons for each message
  const renderActions = (message: any) => {
    return (
      <MessageActionButtons
        messageId={message.id}
        isRead={message.read ?? message.lu ?? false}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
        showMarkAsRead={true}
        showDelete={true}
        variant="inline"
      />
    );
  };

  return (
    <div className={`received-messages-content ${className}`}>
      {/* Search */}
      {showSearch && messages.length > 0 && (
        <MessageSearch
          value={searchValue}
          onChange={setSearchValue}
          onClear={clearSearch}
          resultsCount={filteredMessages.length}
          totalCount={messages.length}
          showResultsInfo={hasSearch}
          placeholder={t("messages.search.placeholder")}
        />
      )}

      {/* Message List */}
      <MessageList
        messages={filteredMessages}
        groupByDate={groupByDate}
        isFiltered={hasSearch}
        onMessageClick={onMessageClick}
        renderActions={renderActions}
        isLoading={isLoading}
        showPreview={true}
      />
    </div>
  );
};

export default ReceivedMessagesContent;
