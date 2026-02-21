/**
 * MessageActionButtons Types
 *
 * Type definitions for MessageActionButtons component.
 */

export interface MessageActionButtonsProps {
  /** ID of the message */
  messageId: string | number;

  /** Whether the message is already read */
  isRead?: boolean;

  /** Handler for marking message as read */
  onMarkAsRead?: (messageId: string | number) => void;

  /** Handler for deleting message */
  onDelete?: (messageId: string | number) => void;

  /** Whether to show the "mark as read" button */
  showMarkAsRead?: boolean;

  /** Whether to show the "delete" button */
  showDelete?: boolean;

  /** Variant of the action buttons */
  variant?: "inline" | "dropdown";

  /** Whether the dropdown is open (only for dropdown variant) */
  isDropdownOpen?: boolean;

  /** Handler for toggling dropdown (only for dropdown variant) */
  onDropdownToggle?: (messageId: string | number) => void;

  /** Additional CSS classes */
  className?: string;
}
