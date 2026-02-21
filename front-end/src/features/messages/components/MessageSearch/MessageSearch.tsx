/**
 * MessageSearch Component
 *
 * Search bar and results information for filtering messages.
 * Atomic component with single responsibility: search UI.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

export interface MessageSearchProps {
  /** Current search value */
  value: string;

  /** Handler for search value changes */
  onChange: (value: string) => void;

  /** Handler for clearing search */
  onClear: () => void;

  /** Placeholder text for search input (overrides i18n default) */
  placeholder?: string;

  /** Number of filtered results */
  resultsCount?: number;

  /** Total number of items */
  totalCount?: number;

  /** Whether to show results info */
  showResultsInfo?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  value,
  onChange,
  onClear,
  placeholder,
  resultsCount,
  totalCount,
  showResultsInfo = true,
  className = "",
}) => {
  const { t } = useTranslation();

  const handleChange = (_event: React.FormEvent<HTMLInputElement>, newValue: string) => {
    onChange(newValue);
  };

  const showInfo =
    showResultsInfo && value && resultsCount !== undefined && totalCount !== undefined;

  const defaultPlaceholder = t("messages.list.search") || "Rechercher un message...";

  return (
    <div className={className}>
      {/* Search Toolbar */}
      <Toolbar style={{ marginBottom: showInfo ? "0.5rem" : "1rem" }}>
        <ToolbarContent>
          <ToolbarItem style={{ flexGrow: 1, width: "100%" }}>
            <SearchInput
              placeholder={placeholder || defaultPlaceholder}
              value={value}
              onChange={handleChange}
              onClear={onClear}
              style={{ width: "100%" }}
              aria-label={t("common.actions.search")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {/* Results Info */}
      {showInfo && (
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
            {resultsCount} message{resultsCount !== 1 ? "s" : ""} trouvé
            {resultsCount !== 1 ? "s" : ""} sur {totalCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
