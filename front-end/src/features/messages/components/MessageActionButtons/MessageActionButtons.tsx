/**
 * MessageActionButtons Component
 *
 * Displays action buttons for a message (mark as read, delete, etc.).
 * Atomic component with single responsibility: message actions.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Button, Dropdown, DropdownItem, KebabToggle } from "@patternfly/react-core";
import { CheckCircleIcon, TrashIcon, EyeIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { MessageActionButtonsProps } from "./MessageActionButtons.types";

export const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  messageId,
  isRead = false,
  onMarkAsRead,
  onDelete,
  showMarkAsRead = true,
  showDelete = true,
  variant = "inline",
  isDropdownOpen = false,
  onDropdownToggle,
  className = "",
}) => {
  const { t } = useTranslation();

  // Inline variant - show buttons side by side
  if (variant === "inline") {
    return (
      <div className={`message-action-buttons message-action-buttons--inline ${className}`}>
        {showMarkAsRead && !isRead && onMarkAsRead && (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircleIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(messageId);
            }}
          >
            {t("messages.actions.markAsRead")}
          </Button>
        )}

        {showDelete && onDelete && (
          <Button
            variant="danger"
            size="sm"
            icon={<TrashIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(messageId);
            }}
            style={{ marginLeft: showMarkAsRead && !isRead ? "0.5rem" : "0" }}
          >
            {t("messages.actions.delete")}
          </Button>
        )}
      </div>
    );
  }

  // Dropdown variant - show in a kebab menu
  if (variant === "dropdown" && onDropdownToggle) {
    const items: React.ReactNode[] = [];

    if (showMarkAsRead && !isRead && onMarkAsRead) {
      items.push(
        <DropdownItem
          key="mark-read"
          icon={<CheckCircleIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(messageId);
            onDropdownToggle(messageId);
          }}
        >
          {t("messages.actions.markAsRead")}
        </DropdownItem>
      );
    }

    if (showDelete && onDelete) {
      items.push(
        <DropdownItem
          key="delete"
          icon={<TrashIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(messageId);
            onDropdownToggle(messageId);
          }}
        >
          {t("messages.actions.delete")}
        </DropdownItem>
      );
    }

    if (items.length === 0) {
      return null;
    }

    return (
      <Dropdown
        onSelect={() => onDropdownToggle(messageId)}
        toggle={
          <KebabToggle
            onToggle={() => onDropdownToggle(messageId)}
            id={`message-actions-${messageId}`}
          />
        }
        isOpen={isDropdownOpen}
        isPlain
        dropdownItems={items}
        className={className}
      />
    );
  }

  return null;
};

export default MessageActionButtons;
