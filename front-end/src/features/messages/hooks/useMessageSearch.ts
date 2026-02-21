/**
 * useMessageSearch Hook
 *
 * Custom hook for managing message search functionality.
 * Handles search input state and filtering logic.
 * Fully supports i18n and type-safe operations.
 */

import { useState, useMemo } from "react";
import type { MessageItem } from "../components/MessageList";
import { createMessageSearchableString, normalizeSearchTerm } from "../utils/message-formatters";

export interface UseMessageSearchOptions {
  /** Initial search value */
  initialValue?: string;
}

export interface UseMessageSearchReturn {
  /** Current search value */
  searchValue: string;

  /** Set search value */
  setSearchValue: (value: string) => void;

  /** Clear search */
  clearSearch: () => void;

  /** Filter messages based on search */
  filterMessages: (messages: MessageItem[]) => MessageItem[];

  /** Whether search is active */
  hasSearch: boolean;
}

/**
 * Hook for managing message search
 * @param options - Configuration options
 * @returns Search state and methods
 */
export const useMessageSearch = (
  options: UseMessageSearchOptions = {}
): UseMessageSearchReturn => {
  const { initialValue = "" } = options;

  const [searchValue, setSearchValue] = useState<string>(initialValue);

  const hasSearch = useMemo(() => {
    return searchValue.trim().length > 0;
  }, [searchValue]);

  const clearSearch = () => {
    setSearchValue("");
  };

  const filterMessages = useMemo(() => {
    return (messages: MessageItem[]): MessageItem[] => {
      if (!hasSearch) {
        return messages;
      }

      const searchTerm = normalizeSearchTerm(searchValue);

      return messages.filter((message) => {
        const senderName = message.sender
          ? `${message.sender.first_name || message.sender.prenom || ""} ${
              message.sender.last_name || message.sender.nom || ""
            }`.trim()
          : "";

        const searchableText = createMessageSearchableString({
          subject: message.subject,
          content: message.content,
          senderName,
          type: message.type,
        });

        return searchableText.includes(searchTerm);
      });
    };
  }, [searchValue, hasSearch]);

  return {
    searchValue,
    setSearchValue,
    clearSearch,
    filterMessages,
    hasSearch,
  };
};

export default useMessageSearch;
